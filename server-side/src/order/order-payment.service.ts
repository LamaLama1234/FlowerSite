import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { EnumOrderStatus, EnumDeliveryType } from '@prisma/client'
import { YooCheckout, ICreatePayment } from '@a2seven/yoo-checkout'
import { v4 as uuidv4 } from 'uuid'
import { TelegramService } from 'src/telegram/telegram.service'
import { OrderStatusLogService } from './order-status-log.service'

@Injectable()
export class OrderPaymentService {
	private checkout: YooCheckout

	constructor(
		private prisma: PrismaService,
		// forwardRef: TelegramService, в свою очередь, вызывает setPaymentDetails
		// (ответ на "введите стоимость доставки" в боте) — обычный circular import.
		@Inject(forwardRef(() => TelegramService))
		private readonly telegramService: TelegramService,
		private readonly statusLog: OrderStatusLogService
	) {
		// Инициализируем через новый пакет
		this.checkout = new YooCheckout({
			shopId: process.env.YOOKASSA_SHOP_ID || '',
			secretKey: process.env.YOOKASSA_SECRET_KEY || ''
		})
	}

	async setPaymentDetails(orderId: string, shippingPrice: number) {
		const order = await this.prisma.order.findUnique({
			where: { id: orderId },
			include: { items: true }
		})

		if (!order) throw new NotFoundException('Заказ не найден')

		const subTotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
		const finalShipping = order.deliveryType === EnumDeliveryType.PICKUP ? 0 : shippingPrice
		const finalTotal = subTotal + finalShipping

		try {
			// Структура запроса в этом пакете чуть-чуть отличается
			const createPayload: ICreatePayment = {
				amount: {
					value: finalTotal.toFixed(2),
					currency: 'RUB'
				},
				confirmation: {
					type: 'redirect',
					return_url: 'https://google.com'
				},
				capture: true,
				description: `Оплата заказа №${order.id}`,
				metadata: { orderId: order.id }
			}

			// Вызываем через this.checkout
			const payment = await this.checkout.createPayment(createPayload, uuidv4())

			const updated = await this.prisma.order.update({
				where: { id: orderId },
				data: {
					paymentLink: payment.confirmation.confirmation_url,
					shippingPrice: finalShipping,
					total: finalTotal,
					status: EnumOrderStatus.AWAITING_PAYMENT
				}
			})
			await this.statusLog.logStatusChange(orderId, EnumOrderStatus.AWAITING_PAYMENT, undefined, 'admin')
			return updated
		} catch (error) {
			console.error('YooCheckout Error:', error)
			throw new BadRequestException('Ошибка платежной системы: ' + error.message)
		}
	}

	async handleWebhook(data: any) {
		const paymentId = data?.object?.id
		if (data?.event === 'payment.succeeded' && paymentId) {
			// Не доверяем телу вебхука напрямую — оно может быть подделано.
			// Запрашиваем актуальный статус платежа у самой ЮKassa по её API,
			// используя наш секретный ключ, и доверяем только этому ответу.
			const payment = await this.checkout.getPayment(paymentId)
			if (payment.status !== 'succeeded') {
				return { status: 'ok' }
			}

			const orderId = payment.metadata?.orderId
			if (!orderId) return { status: 'error' }

			// 1. Обновляем статус на Оплачено (CONFIRMED)
			const updatedOrder = await this.prisma.order.update({
				where: { id: orderId },
				data: { status: EnumOrderStatus.CONFIRMED },
				include: { items: { include: { product: true } } }
			})
			await this.statusLog.logStatusChange(orderId, EnumOrderStatus.CONFIRMED, undefined, 'yookassa')

			// 2. Получаем всех воркеров с telegramId, чтобы обновить им списки
			const workers = await this.prisma.user.findMany({
				where: {
					telegramId: { not: null },
					role: { in: ['ADMIN', 'WORKER'] }
				}
			})

			// 3. Рассылаем уведомление об оплате — не ждём отправку, чтобы
			// не задерживать ответ вебхука ЮKassa; ошибка у одного воркера
			// не должна прерывать рассылку остальным.
			void (async () => {
				for (const worker of workers) {
					if (!worker.telegramId) continue
					try {
						// Опционально: короткое уведомление, что заказ оплачен
						await this.telegramService.sendNewOrderAlert({
							...updatedOrder,
							customMessage: `💰 Заказ #${orderId.slice(-6)} успешно оплачен!`
						})
						// Список обновится автоматически внутри sendNewOrderAlert или вызови отдельно:
						// await this.telegramService.sendOrdersList(worker.telegramId);
					} catch (error) {
						console.error(`Не удалось отправить Telegram-уведомление об оплате воркеру ${worker.id}:`, error)
					}
				}
			})()

			return { status: 'ok' }
		}
		return { status: 'ok' }
	}
}
