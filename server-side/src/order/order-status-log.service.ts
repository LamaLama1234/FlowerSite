import { Injectable } from '@nestjs/common'
import { EnumOrderStatus } from '@prisma/client'
import { PrismaService } from 'src/prisma.service'

// Вынесено из OrderService в отдельный сервис, потому что лог статусов
// пишут сразу три источника (создание заказа, обновление статуса воркером/
// админом, вебхук ЮKassa) — они живут в разных сервисах после разбиения
// order.service.ts, и всем нужен один и тот же метод записи.
@Injectable()
export class OrderStatusLogService {
	constructor(private prisma: PrismaService) {}

	async logStatusChange(
		orderId: string,
		status: EnumOrderStatus,
		changedBy?: string,
		source: string = 'system'
	) {
		await this.prisma.orderStatusHistory.create({
			data: { orderId, status, changedBy, source }
		})
	}
}
