import { IsEmail, IsNotEmpty } from 'class-validator'

export class ForgotPasswordDto {
	@IsEmail({}, { message: 'Введите корректный email' })
	@IsNotEmpty({ message: 'Почта обязательна' })
	email: string
}
