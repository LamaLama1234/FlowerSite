import {
	Body,
	Controller,
	Get,
	HttpCode,
	Post,
	Req,
	Res,
	UnauthorizedException,
	UseGuards,
	UsePipes,
	ValidationPipe
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthDto } from './dto/auth.dto'
import type { Request, Response } from 'express'
import { ConfigService } from '@nestjs/config'
import { OAuthExchangeService } from './oauth-exchange.service'
import { OAuthStateGuard, OAUTH_STATE_COOKIE } from './guards/oauth-state.guard'
import { GoogleOAuthInitGuard } from './guards/google-oauth-init.guard'
import { YandexOAuthInitGuard } from './guards/yandex-oauth-init.guard'
import { AuthGuard } from '@nestjs/passport'

@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly oauthExchangeService: OAuthExchangeService,
		private readonly configService: ConfigService
	) {}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('login')
	async login(
		@Body() dto: AuthDto,
		@Res({ passthrough: true }) res: Response
	) {
		const { refreshToken, ...response } = await this.authService.login(dto)

		this.authService.addRefreshTokenToResponse(res, refreshToken)

		return response
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('register')
	async register(
		@Body() dto: AuthDto,
		@Res({ passthrough: true }) res: Response
	) {
		const { refreshToken, ...response } =
			await this.authService.register(dto)

		this.authService.addRefreshTokenToResponse(res, refreshToken)

		return response
	}

	@UsePipes(new ValidationPipe())
	@HttpCode(200)
	@Post('login/access-token')
	async getNewTokens(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	) {
		const refreshTokenFromCookies = req.cookies[
			this.authService.REFRESH_TOKEN_NAME
		] as string | undefined

		if (!refreshTokenFromCookies) {
			this.authService.removeRefreshTokenFromResponse(res)
			throw new UnauthorizedException({
				message: 'Пользователь не авторизован'
			})
		}

		const { refreshToken, ...response } =
			await this.authService.getNewTokens(refreshTokenFromCookies)

		this.authService.addRefreshTokenToResponse(res, refreshToken)

		return response
	}

	@HttpCode(200)
	@Post('logout')
	logout(@Res({ passthrough: true }) res: Response) {
		this.authService.removeRefreshTokenFromResponse(res)
		return true
	}

	@Get('google')
	@UseGuards(GoogleOAuthInitGuard)
	async googleAuth() {}

	@Get('google/callback')
	@UseGuards(OAuthStateGuard, AuthGuard('google'))
	async googleCallback(@Req() req: Request, @Res() res: Response) {
		return this.completeOAuthLogin(req, res)
	}

	@Get('yandex')
	@UseGuards(YandexOAuthInitGuard)
	async yandexAuth() {}

	@Get('yandex/callback')
	@UseGuards(OAuthStateGuard, AuthGuard('yandex'))
	async yandexCallback(@Req() req: Request, @Res() res: Response) {
		return this.completeOAuthLogin(req, res)
	}

	private async completeOAuthLogin(req: Request, res: Response) {
		const oauthUser = req.user as {
			email?: string
			name?: string
			picture?: string
		}

		const { refreshToken, accessToken } =
			await this.authService.validateOAuthUser({
				user: oauthUser
			})

		this.authService.addRefreshTokenToResponse(res, refreshToken)

		const state = req.cookies?.[OAUTH_STATE_COOKIE] as string
		const code = this.oauthExchangeService.create(accessToken, state)
		const clientUrl =
			this.configService.get<string>('CLIENT_URL') ??
			'http://localhost:3000'

		return res.redirect(
			`${clientUrl}/dashboard?code=${encodeURIComponent(code)}`
		)
	}

	@HttpCode(200)
	@Post('oauth/exchange')
	exchangeOAuthCode(
		@Body('code') code: string,
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response
	) {
		const state = req.cookies?.[OAUTH_STATE_COOKIE] as string | undefined
		const accessToken = this.oauthExchangeService.consume(code, state)

		if (!accessToken) {
			throw new UnauthorizedException(
				'Код авторизации недействителен или истёк'
			)
		}

		res.clearCookie(OAUTH_STATE_COOKIE)

		return { accessToken }
	}
}
