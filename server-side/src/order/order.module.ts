import { Module } from '@nestjs/common'
import { OrderService } from './order.service'
import { OrderController } from './order.controller'
import { TelegramService } from 'src/telegram/telegram.service'

@Module({
	controllers: [OrderController],
	providers: [OrderService, TelegramService]
})
export class OrderModule {}
