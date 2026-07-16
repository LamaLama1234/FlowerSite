import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './filters/all-exceptions.filter'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	app.use(
		helmet({
			// Товарные изображения из /uploads грузятся клиентом с другого
			// origin через обычный <img>, поэтому дефолтный same-origin CORP
			// их бы заблокировал.
			crossOriginResourcePolicy: { policy: 'cross-origin' }
		})
	)
	app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true, // <-- Это позволит автоматически преобразовывать типы из DTO
    forbidNonWhitelisted: true
  	}))
	app.useGlobalFilters(new AllExceptionsFilter())

	app.use(cookieParser())
	app.enableCors({
		origin: [process.env.CLIENT_URL ?? 'http://localhost:3000'],
		credentials: true,
		exposedHeaders: 'set-cookie'
	})

		// В проде вся карта API (включая admin-роуты) не должна быть публично видна
		if (process.env.NODE_ENV !== 'production') {
			const config = new DocumentBuilder()
				.setTitle('GreenArt API')
				.setDescription('API documentation')
				.setVersion('1.0')
				.build()

			const document = SwaggerModule.createDocument(app, config)

			SwaggerModule.setup('api/docs', app, document)
		}

	await app.listen(5001)
}

void bootstrap()
