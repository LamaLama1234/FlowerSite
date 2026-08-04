// src/order/order.service.ts
import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { OrderDto } from './dto/order.dto'
import { UpdateOrderDto } from './dto/update-order.dto'
import { Prisma } from '@prisma/client'
import { EnumOrderStatus } from '@prisma/client'
import { TelegramService } from 'src/telegram/telegram.service'
import { parsePagination } from 'src/common/pagination'
import { PromoService } from './promo.service'
import { OrderStatusLogService } from './order-status-log.service'
import { WELCOME_PROMO_CODE } from './promo.constants'
import { ProductService } from 'src/product/product.service'

// Оплата (ЮKassa, вебхук) вынесена в OrderPaymentService, аналитика — в
// OrderAnalyticsService, промокоды — в PromoService, запись лога статусов —
// в OrderStatusLogService (её используют все три). Здесь остаётся только
// сам жизненный цикл заказа: создание, чтение, редактирование, статус.
@Injectable()
export class OrderService {
    constructor(
        private prisma: PrismaService,
        private readonly telegramService: TelegramService,
        private readonly statusLog: OrderStatusLogService,
        private readonly promoService: PromoService,
        private readonly productService: ProductService
    ) {}

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
            const result = await this.promoService.validatePromoCode(dto.promoCode, dto.phone)
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

        await this.statusLog.logStatusChange(order.id, EnumOrderStatus.PENDING, userId, 'customer')

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
            await this.statusLog.logStatusChange(orderId, status, user.id, user.role === 'ADMIN' ? 'admin' : 'worker')
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

        await this.statusLog.logStatusChange(orderId, status as EnumOrderStatus, changedBy, source)

        // Не блокируем ответ пересчётом тега "популярное" по всей базе
        // товаров — это фоновая переоценка, а не часть смены статуса заказа.
        this.productService.recalculatePopularTags().catch((error) => {
            console.error('Не удалось пересчитать теги "популярное":', error)
        })

        return updated
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
