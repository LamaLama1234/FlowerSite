import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { WELCOME_PROMO_CODE, WELCOME_PROMO_DISCOUNT_PERCENT } from './promo.constants'

@Injectable()
export class PromoService {
	constructor(private prisma: PrismaService) {}

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
}
