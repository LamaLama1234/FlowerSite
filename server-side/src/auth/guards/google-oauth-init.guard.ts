import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { randomUUID } from 'crypto'
import type { Response } from 'express'
import { OAUTH_STATE_COOKIE } from './oauth-state.guard'

const OAUTH_STATE_TTL_MS = 5 * 60 * 1000

/**
 * Генерирует одноразовый state, кладёт его в httpOnly cookie и передаёт
 * тем же значением в редирект к Google — так callback можно привязать
 * к конкретному браузеру (см. OAuthStateGuard).
 */
@Injectable()
export class GoogleOAuthInitGuard extends AuthGuard('google') {
	getAuthenticateOptions(context: ExecutionContext) {
		const res = context.switchToHttp().getResponse<Response>()
		const state = randomUUID()

		res.cookie(OAUTH_STATE_COOKIE, state, {
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: OAUTH_STATE_TTL_MS
		})

		return { state }
	}
}
