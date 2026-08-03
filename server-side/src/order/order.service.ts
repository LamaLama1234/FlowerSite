// src/order/order.service.ts
import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { OrderDto } from './dto/order.dto'
import { UpdateOrderDto } from './dto/update-order.dto'
import { Prisma } from '@prisma/client'
import { EnumOrderStatus } from '@prisma/client'
import { EnumDeliveryType } from '@prisma/client'
import { YooCheckout, ICreatePayment } from '@a2seven/yoo-checkout'
import { v4 as uuidv4 } from 'uuid'
import { TelegramService } from 'src/telegram/telegram.service'
import { parsePagination } from 'src/common/pagination'
import { WELCOME_PROMO_CODE, WELCOME_PROMO_DISCOUNT_PERCENT } from './promo.constants'

@Injectable()
export class OrderService {
    private checkout: YooCheckout;

    constructor(private prisma: PrismaService, private readonly telegramService: TelegramService) {
        // Инициализируем через новый пакет
        this.checkout = new YooCheckout({
            shopId: process.env.YOOKASSA_SHOP_ID || '',
            secretKey: process.env.YOOKASSA_SECRET_KEY || ''
        });
    }

    async setPaymentDetails(orderId: string, shippingPrice: number) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        if (!order) throw new NotFoundException('Заказ не найден');

        const subTotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const finalShipping = order.deliveryType === EnumDeliveryType.PICKUP ? 0 : shippingPrice;
        const finalTotal = subTotal + finalShipping;

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
            };

            // Вызываем через this.checkout
            const payment = await this.checkout.createPayment(createPayload, uuidv4());

            const updated = await this.prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentLink: payment.confirmation.confirmation_url,
                    shippingPrice: finalShipping,
                    total: finalTotal,
                    status: EnumOrderStatus.AWAITING_PAYMENT
                }
            });
            await this.logStatusChange(orderId, EnumOrderStatus.AWAITING_PAYMENT, undefined, 'admin')
            return updated;
        } catch (error) {
            console.error('YooCheckout Error:', error);
            throw new BadRequestException('Ошибка платежной системы: ' + error.message);
        }
    }

    async handleWebhook(data: any) {
        const paymentId = data?.object?.id;
        if (data?.event === 'payment.succeeded' && paymentId) {
            // Не доверяем телу вебхука напрямую — оно может быть подделано.
            // Запрашиваем актуальный статус платежа у самой ЮKassa по её API,
            // используя наш секретный ключ, и доверяем только этому ответу.
            const payment = await this.checkout.getPayment(paymentId);
            if (payment.status !== 'succeeded') {
                return { status: 'ok' };
            }

            const orderId = payment.metadata?.orderId;
            if (!orderId) return { status: 'error' };

            // 1. Обновляем статус на Оплачено (CONFIRMED)
            const updatedOrder = await this.prisma.order.update({
                where: { id: orderId },
                data: { status: EnumOrderStatus.CONFIRMED },
                include: { items: { include: { product: true } } }
            });
            await this.logStatusChange(orderId, EnumOrderStatus.CONFIRMED, undefined, 'yookassa')

            // 2. Получаем всех воркеров с telegramId, чтобы обновить им списки
            const workers = await this.prisma.user.findMany({
                where: { 
                    telegramId: { not: null },
                    role: { in: ['ADMIN', 'WORKER'] }
                }
            });

            // 3. Рассылаем уведомление об оплате — не ждём отправку, чтобы
            // не задерживать ответ вебхука ЮKassa; ошибка у одного воркера
            // не должна прерывать рассылку остальным.
            void (async () => {
                for (const worker of workers) {
                    if (!worker.telegramId) continue;
                    try {
                        // Опционально: короткое уведомление, что заказ оплачен
                        await this.telegramService.sendNewOrderAlert({
                            ...updatedOrder,
                            customMessage: `💰 Заказ #${orderId.slice(-6)} успешно оплачен!`
                        });
                        // Список обновится автоматически внутри sendNewOrderAlert или вызови отдельно:
                        // await this.telegramService.sendOrdersList(worker.telegramId);
                    } catch (error) {
                        console.error(`Не удалось отправить Telegram-уведомление об оплате воркеру ${worker.id}:`, error);
                    }
                }
            })();

            return { status: 'ok' };
        }
        return { status: 'ok' };
    }

    async getAll(user: { id: string, role: string }, searchTerm?: string, page?: string, limit?: string) {
        const whereClause: Prisma.OrderWhereInput = searchTerm
            ? { customerName: { contains: searchTerm, mode: 'insensitive' } }: {}

        const filter = user.role === 'USER' ? { userId: user.id } : {}
        const finalWhere = { ...whereClause, ...filter }
        const pagination = parsePagination(page, limit)

        const [items, total] = await Promise.all([
            this.prisma.order.findMany({
                where: finalWhere,
                include: { items: { include: { product: true } } }, // Добавлено
                orderBy: { createdAt: 'desc' },
                skip: pagination.skip,
                take: pagination.limit
            }),
            this.prisma.order.count({ where: finalWhere })
        ])

        return { items, total, page: pagination.page, limit: pagination.limit }
    }

    /**
     * Полная карточка заказа (с логом статусов). Намеренно доступна только
     * ADMIN без ограничений — WORKER здесь приравнен к обычному USER
     * (только свои заказы, которых у него как у сотрудника нет), чтобы
     * не получить обходной путь к чужим данным клиента мимо getForWorker().
     */
    async getById(id: string, user: { id: string, role: string }) {
        const order = await this.prisma.order.findFirst({
            where: {
                id,
                ... (user.role === 'ADMIN' ? {} : { userId: user.id })
            },
            include: {
                items: { include: { product: true } },
                // Полный лог смены статусов — только для деталей одного заказа
                // в админке, не тащим это в списки (getAll), чтобы не раздувать ответ.
                statusHistory: {
                    orderBy: { createdAt: 'asc' },
                    include: { changedByUser: { select: { name: true, role: true } } }
                }
            }
        })
        if (!order) throw new NotFoundException('Заказ не найден или доступ запрещен')
        return order
    }

    /**
     * Урезанная карточка заказа для воркеров — те же поля, что и раньше
     * уходили в Telegram-бот (см. prepareOrdersListData в telegram.service.ts).
     * Никакого userId/email/платёжной ссылки/лога/промокода — явный select,
     * а не include, чтобы лишние поля физически не могли утечь по ошибке.
     */
    async getForWorker() {
        return this.prisma.order.findMany({
            where: {
                status: {
                    in: [
                        EnumOrderStatus.PENDING,
                        EnumOrderStatus.AWAITING_PAYMENT,
                        EnumOrderStatus.IN_PROGRESS,
                        EnumOrderStatus.CONFIRMED,
                        EnumOrderStatus.IN_DELIVERY
                    ]
                }
            },
            select: {
                id: true,
                createdAt: true,
                status: true,
                customerName: true,
                phone: true,
                deliveryType: true,
                deliveryAddress: true,
                deliveryDate: true,
                isAsap: true,
                deliveryTimeSlot: true,
                comment: true,
                total: true,
                items: {
                    select: {
                        id: true,
                        quantity: true,
                        price: true,
                        product: { select: { title: true } }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        })
    }

    /**
     * Данные для админской аналитики: выручка по дням за последние N дней,
     * топ товаров по выручке (за всё время — иначе список почти пустой на
     * маленьких объёмах), разбивка по статусам и сводные KPI. Отменённые
     * заказы никуда не считаются — это не состоявшаяся выручка.
     */
    async getAnalytics(days = 30) {
        const since = new Date()
        since.setDate(since.getDate() - (days - 1))
        since.setHours(0, 0, 0, 0)

        const periodOrders = await this.prisma.order.findMany({
            where: {
                status: { not: EnumOrderStatus.CANCELLED },
                createdAt: { gte: since }
            },
            select: { createdAt: true, total: true, status: true }
        })

        const revenueByDayMap = new Map<string, number>()
        for (let i = 0; i < days; i++) {
            const day = new Date(since)
            day.setDate(day.getDate() + i)
            revenueByDayMap.set(day.toISOString().slice(0, 10), 0)
        }
        for (const order of periodOrders) {
            const key = order.createdAt.toISOString().slice(0, 10)
            revenueByDayMap.set(key, (revenueByDayMap.get(key) ?? 0) + order.total)
        }
        const revenueByDay = Array.from(revenueByDayMap.entries()).map(([date, revenue]) => ({
            date,
            revenue
        }))

        const totalRevenue = periodOrders.reduce((sum, o) => sum + o.total, 0)
        const totalOrders = periodOrders.length
        const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

        const statusCounts = new Map<string, number>()
        for (const order of periodOrders) {
            statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1)
        }
        const ordersByStatus = Array.from(statusCounts.entries())
            .map(([status, count]) => ({ status, count }))
            .sort((a, b) => b.count - a.count)

        const allItems = await this.prisma.orderItem.findMany({
            where: { order: { status: { not: EnumOrderStatus.CANCELLED } } },
            select: {
                productId: true,
                quantity: true,
                price: true,
                product: { select: { title: true } }
            }
        })
        const productMap = new Map<string, { title: string; quantity: number; revenue: number }>()
        for (const item of allItems) {
            const existing = productMap.get(item.productId) ?? {
                title: item.product.title,
                quantity: 0,
                revenue: 0
            }
            existing.quantity += item.quantity
            existing.revenue += item.quantity * item.price
            productMap.set(item.productId, existing)
        }
        const topProducts = Array.from(productMap.entries())
            .map(([productId, data]) => ({ productId, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 8)

        return {
            summary: { totalRevenue, totalOrders, averageOrderValue },
            revenueByDay,
            ordersByStatus,
            topProducts
        }
    }

    async getByUserId(targetUserId: string, currentUser: { id: string, role: string }) {
        if (currentUser.role !== 'ADMIN' && currentUser.id !== targetUserId) {
            throw new ForbiddenException('Вы не имеете доступа к чужим заказам')
        }

        return this.prisma.order.findMany({ 
            where: { userId: targetUserId },
            include: { items: { include: { product: true } } },
            orderBy: { createdAt: 'desc' }
        })
    }

    private normalizePhone(phone: string) {
        return phone.replace(/\D/g, '')
    }

    async validatePromoCode(code: string | undefined, phone: string | undefined) {
        const normalizedCode = code?.trim().toUpperCase()
        if (!normalizedCode || normalizedCode !== WELCOME_PROMO_CODE) {
            return { valid: false as const, message: 'Промокод не найден' }
        }

        const normalizedPhone = phone ? this.normalizePhone(phone) : ''
        if (!normalizedPhone) {
            return { valid: false as const, message: 'Сначала укажите номер телефона' }
        }

        // Сверяем по телефону, а не по аккаунту — иначе промокод "для новых"
        // можно было бы получать бесконечно, просто регистрируя новые email.
        const existing = await this.prisma.$queryRaw<{ id: string }[]>`
            SELECT id FROM "order"
            WHERE regexp_replace(phone, '\\D', '', 'g') = ${normalizedPhone}
            LIMIT 1
        `
        if (existing.length > 0) {
            return {
                valid: false as const,
                message: 'Промокод уже был использован с этим номером телефона'
            }
        }

        return { valid: true as const, discountPercent: WELCOME_PROMO_DISCOUNT_PERCENT }
    }

    async create(dto: OrderDto, userId: string) {
        const productIds = dto.items.map(item => item.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } }
        });

        let total = 0;
        const itemsData = dto.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) throw new NotFoundException(`Товар ${item.productId} не найден`);

            total += product.price * item.quantity;
            return {
                quantity: item.quantity,
                price: product.price,
                productId: item.productId
            };
        });

        let discount = 0
        let appliedPromoCode: string | null = null
        if (dto.promoCode) {
            const result = await this.validatePromoCode(dto.promoCode, dto.phone)
            if (!result.valid) {
                throw new BadRequestException(result.message)
            }
            discount = Math.round(total * (result.discountPercent / 100))
            appliedPromoCode = WELCOME_PROMO_CODE
            total -= discount
        }

        const order = await this.prisma.order.create({
            data: {
                total,
                discount,
                promoCode: appliedPromoCode,
                customerName: dto.customerName,
                phone: dto.phone,
                deliveryType: dto.deliveryType,
                deliveryAddress: dto.deliveryAddress,
                deliveryDate: new Date(dto.deliveryDate),
                isAsap: dto.isAsap ?? false,
                deliveryTimeSlot: dto.isAsap ? null : dto.deliveryTimeSlot,
                comment: dto.comment,
                status: EnumOrderStatus.PENDING,
                userId: userId,
                items: { create: itemsData }
            },
            include: { items: { include: { product: true } } }
        });

        await this.logStatusChange(order.id, EnumOrderStatus.PENDING, userId, 'customer')

        // Не ждём отправку в Telegram — она не должна задерживать ответ
        // клиенту и не должна валить создание заказа при сбое бота.
        this.telegramService.sendNewOrderAlert(order).catch((error) => {
            console.error('Не удалось отправить уведомление в Telegram о новом заказе:', error);
        });

        return order;
    }
    async updateOrder(orderId: string, user: { id: string, role: string }, dto: UpdateOrderDto) {
    const order = await this.getById(orderId, user)
    if (!order) throw new NotFoundException('Заказ не найден')

    if (user.role !== 'ADMIN' && order.status !== 'PENDING') {
            throw new ForbiddenException('Заказ можно менять только в статусе ожидания');
    }

    const { items, status, ...orderData } = dto;

    if (status !== undefined && user.role !== 'ADMIN' && user.role !== 'WORKER') {
        throw new ForbiddenException('Изменение статуса заказа недоступно');
    }

    const itemsData = items ? await this.mapItemsWithPrice(items) : undefined;
    const total = itemsData ? itemsData.reduce((sum, item) => sum + (item.price * item.quantity), 0) : undefined;
    const updated = await this.prisma.order.update({
        where: { id: orderId },
        data: {
            ...orderData,
            ...(status !== undefined ? { status } : {}),
            total,
            items: itemsData ? {
                deleteMany: {}, // Удаляем старые
                create: itemsData
                } : undefined
            }
        })

    if (status !== undefined && status !== order.status) {
        await this.logStatusChange(orderId, status, user.id, user.role === 'ADMIN' ? 'admin' : 'worker')
    }

    return updated
    }

    async delete(id: string, user: { id: string, role: string }) {
        const order = await this.getById(id, user);

        if (user.role !== 'ADMIN') {
            // Приводим тип к строке, чтобы сравнение в массиве работало без ошибок TS
            const currentStatus = order.status as string;
            
            if (!['PENDING', 'AWAITING_PAYMENT'].includes(currentStatus)) {
                throw new ForbiddenException(
                    'Удалить можно только заказ, который еще не начали собирать'
                );
            }
        }
        
        return this.prisma.order.delete({ where: { id: order.id } });
    }

    async updateStatus(
        orderId: string,
        status: string,
        paymentLink?: string,
        changedBy?: string,
        source: string = 'admin'
    ) {
        const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: status as EnumOrderStatus,
                paymentLink: paymentLink || undefined
                }
            })

        await this.logStatusChange(orderId, status as EnumOrderStatus, changedBy, source)

        return updated
    }

    private async logStatusChange(
        orderId: string,
        status: EnumOrderStatus,
        changedBy?: string,
        source: string = 'system'
    ) {
        await this.prisma.orderStatusHistory.create({
            data: { orderId, status, changedBy, source }
        })
    }

    private async mapItemsWithPrice(items: { productId: string; quantity: number }[]) {
        const productIds = items.map(item => item.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } }
        });

        return items.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) throw new NotFoundException(`Товар ${item.productId} не найден`);
        
            return {
                quantity: item.quantity,
                price: product.price, // Берем актуальную цену
                productId: item.productId
            };
        });
    }
}