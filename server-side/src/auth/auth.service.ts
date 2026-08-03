import {
	BadRequestException,
	Injectable,
	NotFoundException,
	UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UserService } from '../user/user.service'
import { PrismaService } from '../prisma.service'
import { AuthDto } from './dto/auth.dto'
import { VerifyEmailDto } from './dto/verify-email.dto'
import { ResendCodeDto } from './dto/resend-code.dto'
import { ForgotPasswordDto } from './dto/forgot-password.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { ConfigService } from '@nestjs/config/dist/config.service'
import { Response } from 'express'
import { hash, verify } from 'argon2'
import { EnumUserRole, User } from '@prisma/client'
import { MailService } from '../mail/mail.service'

const VERIFICATION_CODE_TTL_MINUTES = 15
const RESEND_COOLDOWN_SECONDS = 60

@Injectable()
export class AuthService {
	EXPIRE_DAY_REFRESH_TOKEN = 1
	REFRESH_TOKEN_NAME = 'refreshToken'

	constructor(
		private jwt: JwtService,
		private userService: UserService,
		private prisma: PrismaService,
		private configService: ConfigService,
		private mailService: MailService
	) {}

	async login(dto: AuthDto) {
		const user = await this.validateUser(dto)

		const tokens = this.issueToken(user.id)

		return { user: this.sanitizeUser(user), ...tokens }
	}

	/**
	 * Регистрация в два шага: здесь только сохраняем данные и отправляем код
	 * на почту — реальный User создаётся в verifyEmail() после подтверждения.
	 */
	async register(dto: AuthDto) {
		const oldUser = await this.userService.getByEmail(dto.email)

		if (oldUser) {
			throw new BadRequestException(
				'Пользователь с такой почтой уже существует'
			)
		}

		const existingPending = await this.prisma.emailVerification.findUnique({
			where: { email: dto.email }
		})
		if (existingPending) {
			this.assertNotOnCooldown(existingPending.lastSentAt)
		}

		const code = this.generateCode()
		const passwordHash = await hash(dto.password)

		await this.prisma.emailVerification.upsert({
			where: { email: dto.email },
			create: {
				email: dto.email,
				name: dto.name,
				password: passwordHash,
				code,
				expiresAt: this.codeExpiry(),
				lastSentAt: new Date()
			},
			update: {
				name: dto.name,
				password: passwordHash,
				code,
				expiresAt: this.codeExpiry(),
				lastSentAt: new Date()
			}
		})

		await this.mailService.sendVerificationCode(dto.email, code)

		return { email: dto.email }
	}

	async resendCode(dto: ResendCodeDto) {
		const pending = await this.prisma.emailVerification.findUnique({
			where: { email: dto.email }
		})

		if (!pending) {
			throw new BadRequestException(
				'Заявка на регистрацию не найдена — начните регистрацию заново'
			)
		}
		this.assertNotOnCooldown(pending.lastSentAt)

		const code = this.generateCode()
		await this.prisma.emailVerification.update({
			where: { email: dto.email },
			data: { code, expiresAt: this.codeExpiry(), lastSentAt: new Date() }
		})

		await this.mailService.sendVerificationCode(dto.email, code)

		return { email: dto.email }
	}

	async verifyEmail(dto: VerifyEmailDto) {
		const pending = await this.prisma.emailVerification.findUnique({
			where: { email: dto.email }
		})

		if (!pending) {
			throw new BadRequestException(
				'Заявка на регистрацию не найдена — начните регистрацию заново'
			)
		}

		if (pending.expiresAt < new Date()) {
			throw new BadRequestException('Код истёк — запросите новый')
		}

		if (pending.code !== dto.code) {
			throw new BadRequestException('Неверный код подтверждения')
		}

		const user = await this.prisma.user.create({
			data: {
				email: pending.email,
				name: pending.name || undefined,
				password: pending.password,
				role: EnumUserRole.USER
			}
		})

		await this.prisma.emailVerification.delete({ where: { email: dto.email } })

		const tokens = this.issueToken(user.id)

		return { user: this.sanitizeUser(user), ...tokens }
	}

	/**
	 * Не раскрываем, существует ли email в базе — иначе эндпоинт превращается
	 * в способ проверить, зарегистрирован человек или нет (user enumeration).
	 * При отсутствии пользователя тихо ничего не делаем, ответ тот же.
	 */
	async forgotPassword(dto: ForgotPasswordDto) {
		const user = await this.userService.getByEmail(dto.email)

		if (user && user.password) {
			const existingPending = await this.prisma.passwordReset.findUnique({
				where: { email: dto.email }
			})
			if (existingPending) {
				this.assertNotOnCooldown(existingPending.lastSentAt)
			}

			const code = this.generateCode()

			await this.prisma.passwordReset.upsert({
				where: { email: dto.email },
				create: { email: dto.email, code, expiresAt: this.codeExpiry(), lastSentAt: new Date() },
				update: { code, expiresAt: this.codeExpiry(), lastSentAt: new Date() }
			})

			await this.mailService.sendPasswordResetCode(dto.email, code)
		}

		return { email: dto.email }
	}

	async resetPassword(dto: ResetPasswordDto) {
		const pending = await this.prisma.passwordReset.findUnique({
			where: { email: dto.email }
		})

		if (!pending) {
			throw new BadRequestException(
				'Запрос на сброс пароля не найден — запросите код заново'
			)
		}

		if (pending.expiresAt < new Date()) {
			throw new BadRequestException('Код истёк — запросите новый')
		}

		if (pending.code !== dto.code) {
			throw new BadRequestException('Неверный код подтверждения')
		}

		const user = await this.userService.getByEmail(dto.email)
		if (!user) {
			throw new NotFoundException('Пользователь не найден')
		}

		const updatedUser = await this.prisma.user.update({
			where: { id: user.id },
			data: { password: await hash(dto.newPassword) }
		})

		await this.prisma.passwordReset.delete({ where: { email: dto.email } })

		const tokens = this.issueToken(updatedUser.id)

		return { user: this.sanitizeUser(updatedUser), ...tokens }
	}

	private assertNotOnCooldown(lastSentAt: Date) {
		const elapsedSeconds = (Date.now() - lastSentAt.getTime()) / 1000
		const remaining = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsedSeconds)
		if (remaining > 0) {
			throw new BadRequestException(
				`Подождите ${remaining} сек. перед повторной отправкой`
			)
		}
	}

	private generateCode() {
		return String(Math.floor(100000 + Math.random() * 900000))
	}

	private codeExpiry() {
		return new Date(Date.now() + VERIFICATION_CODE_TTL_MINUTES * 60 * 1000)
	}

	async getNewTokens(refreshToken: string) {
		const result = await this.jwt.verifyAsync<{ id: string }>(refreshToken)

		if (!result) throw new UnauthorizedException('Невалидный токен')

		const user = await this.userService.getById(result.id)
		if (!user) {
			throw new UnauthorizedException('Пользователь не найден')
		}

		const tokens = this.issueToken(user.id)

		// userService.getById уже возвращает пользователя без пароля
		return { user, ...tokens }
	}

	issueToken(userId: string) {
		const data = { id: userId }

		const accessToken = this.jwt.sign(data, {
			expiresIn: '1h'
		})
		const refreshToken = this.jwt.sign(data, {
			expiresIn: '7d'
		})
		return { accessToken, refreshToken }
	}

	private async validateUser(dto: AuthDto) {
		const user = await this.userService.getByEmail(dto.email)
		if (!user) throw new NotFoundException('Пользователь не найден')

		if (!user.password) {
			throw new UnauthorizedException(
				'Вход по паролю недоступен для этого аккаунта'
			)
		}

		const isPasswordValid = await verify(user.password, dto.password)
		if (!isPasswordValid) {
			throw new UnauthorizedException('Неверный пароль')
		}

		return user
	}

	private sanitizeUser(user: User) {
		const { password: _password, ...safeUser } = user
		return safeUser
	}

	async validateOAuthUser(req: {
		user: { email?: string; name?: string; picture?: string }
	}) {
		if (!req.user?.email) {
			throw new UnauthorizedException(
				'Email не получен от OAuth провайдера'
			)
		}
		let user = await this.userService.getByEmail(req.user.email)

		if (!user) {
			user = await this.prisma.user.create({
				data: {
					email: req.user.email,
					name: req.user.name,
					picture: req.user.picture
				},
				include: {
					orders: true
				}
			})
		}
		const tokens = this.issueToken(user.id)

		return { user: this.sanitizeUser(user), ...tokens }
	}

	addRefreshTokenToResponse(res: Response, refreshToken: string) {
		const expiresIn = new Date()
		expiresIn.setDate(expiresIn.getDate() + this.EXPIRE_DAY_REFRESH_TOKEN)

		res.cookie(this.REFRESH_TOKEN_NAME, refreshToken, {
			httpOnly: true,
			domain: this.configService.getOrThrow<string>('SERVER_DOMAIN'),
			expires: expiresIn,
			secure: true,
			sameSite: 'none'
		})
	}
	removeRefreshTokenFromResponse(res: Response) {
		res.cookie(this.REFRESH_TOKEN_NAME, '', {
			httpOnly: true,
			domain: this.configService.getOrThrow<string>('SERVER_DOMAIN'),
			expires: new Date(0),
			secure: true,
			sameSite: 'none'
		})
	}
}
