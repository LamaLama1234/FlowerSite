import { Injectable } from '@nestjs/common'
import { randomUUID } from 'crypto'

interface PendingExchange {
	accessToken: string
	state: string
	expiresAt: number
}

const CODE_TTL_MS = 60 * 1000

/**
 * Одноразовые коды обмена для OAuth-возврата: вместо JWT в query-параметре
 * редиректа (виден в истории браузера, легко переиспользовать чужим кодом)
 * бэкенд выдаёт короткоживущий opaque-код, привязанный к oauth_state той же
 * сессии браузера. Это не даёт злоумышленнику, честно прошедшему свой
 * собственный OAuth-вход, просто переслать получившуюся ссылку жертве —
 * при обмене кода потребуется совпадение oauth_state cookie, а она есть
 * только в браузере, который реально инициировал этот вход.
 */
@Injectable()
export class OAuthExchangeService {
	private readonly pending = new Map<string, PendingExchange>()

	create(accessToken: string, state: string): string {
		this.cleanupExpired()

		const code = randomUUID()
		this.pending.set(code, {
			accessToken,
			state,
			expiresAt: Date.now() + CODE_TTL_MS
		})
		return code
	}

	consume(code: string, presentedState: string | undefined): string | null {
		const entry = this.pending.get(code)
		this.pending.delete(code)

		if (!entry || entry.expiresAt < Date.now()) return null
		if (!presentedState || presentedState !== entry.state) return null

		return entry.accessToken
	}

	private cleanupExpired() {
		const now = Date.now()
		for (const [code, entry] of this.pending) {
			if (entry.expiresAt < now) this.pending.delete(code)
		}
	}
}
