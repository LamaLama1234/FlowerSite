import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './strategies/jwt.strategy'
import { GoogleStrategy } from './strategies/google.strategy'
import { YandexStrategy } from './strategies/yandex.strategy'
import { UserModule } from '../user/user.module'
import { RolesGuard } from './guards/roles.guard'
import { OAuthExchangeService } from './oauth-exchange.service'
import { OAuthStateGuard } from './guards/oauth-state.guard'
import { GoogleOAuthInitGuard } from './guards/google-oauth-init.guard'
import { YandexOAuthInitGuard } from './guards/yandex-oauth-init.guard'

@Module({
	imports: [
		ConfigModule,
		UserModule,
		PassportModule.register({ defaultStrategy: 'jwt' }),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				secret: configService.getOrThrow<string>('JWT_SECRET'),
				signOptions: {
					expiresIn: '24h'
				}
			})
		})
	],
	controllers: [AuthController],
	providers: [
		AuthService,
		JwtStrategy,
		GoogleStrategy,
		YandexStrategy,
		RolesGuard,
		OAuthExchangeService,
		OAuthStateGuard,
		GoogleOAuthInitGuard,
		YandexOAuthInitGuard
	],
	exports: [AuthService, JwtModule]
})
export class AuthModule {}
