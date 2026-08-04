import { Module } from '@nestjs/common'
import { OrderService } from './order.service'
import { OrderPaymentService } from './order-payment.service'
import { OrderAnalyticsService } from './order-analytics.service'
import { OrderStatusLogService } from './order-status-log.service'
import { PromoService } from './promo.service'
import { OrderController } from './order.controller'
import { TelegramService } from 'src/telegram/telegram.service'

@Module({
	controllers: [OrderController],
	providers: [
		OrderService,
		OrderPaymentService,
		OrderAnalyticsService,
		OrderStatusLogService,
		PromoService,
		TelegramService
	]
})
export class OrderModule {}
