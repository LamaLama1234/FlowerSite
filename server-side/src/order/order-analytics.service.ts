import { Injectable } from '@nestjs/common'
import { EnumOrderStatus } from '@prisma/client'
import { PrismaService } from 'src/prisma.service'

@Injectable()
export class OrderAnalyticsService {
	constructor(private prisma: PrismaService) {}

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
}
