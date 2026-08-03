import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator'

export class VerifyEmailDto {
	@IsEmail({}, { message: 'Введите корректный email' })
	@IsNotEmpty({ message: 'Почта обязательна' })
	email: string

	@IsString({ message: 'Код обязателен' })
	@Length(6, 6, { message: 'Код должен состоять из 6 цифр' })
	code: string
}
