import * as Joi from 'joi'

// Проверяется один раз при старте (ConfigModule.forRoot в app.module.ts).
// Если чего-то не хватает или значение явно некорректно — приложение падает
// сразу с понятным списком проблем, а не через час на первом реальном
// запросе (например на попытке подписать JWT пустым секретом).
export const envValidationSchema = Joi.object({
	NODE_ENV: Joi.string()
		.valid('development', 'production', 'test')
		.default('development'),

	DATABASE_URL: Joi.string().uri().required(),

	CLIENT_URL: Joi.string().uri().required(),
	SERVER_URL: Joi.string().uri().required(),
	SERVER_DOMAIN: Joi.string().required(),

	JWT_SECRET: Joi.string().min(16).required(),

	GOOGLE_CLIENT_ID: Joi.string().required(),
	GOOGLE_CLIENT_SECRET: Joi.string().required(),
	YANDEX_CLIENT_ID: Joi.string().required(),
	YANDEX_CLIENT_SECRET: Joi.string().required(),

	YOOKASSA_SHOP_ID: Joi.string().required(),
	YOOKASSA_SECRET_KEY: Joi.string().required(),

	TELEGRAM_BOT_TOKEN: Joi.string().required(),

	RESEND_API_KEY: Joi.string().required(),
	RESEND_FROM_EMAIL: Joi.string().default('GreenArt <onboarding@resend.dev>')
})
