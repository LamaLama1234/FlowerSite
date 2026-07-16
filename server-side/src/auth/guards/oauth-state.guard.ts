import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException
} from '@nestjs/common'
import type { Request } from 'express'

export const OAUTH_STATE_COOKIE = 'oauth_state'

/**
 * Проверяет, что запрос на OAuth-callback пришёл от того же браузера,
 * который инициировал вход (cookie oauth_state == query.state).
 * Без этого коллбэк можно было бы дёрнуть напрямую с чужим/произвольным state.
 */
@Injectable()
export class OAuthStateGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const req = context.switchToHttp().getRequest<Request>()
		const stateFromQuery = req.query?.state
		const stateFromCookie = req.cookies?.[OAUTH_STATE_COOKIE] as
			| string
			| undefined

		if (
			!stateFromQuery ||
			!stateFromCookie ||
			stateFromQuery !== stateFromCookie
		) {
			throw new UnauthorizedException('Некорректный OAuth state')
		}

		return true
	}
}
