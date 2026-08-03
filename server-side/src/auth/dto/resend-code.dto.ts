import { IsEmail, IsNotEmpty } from 'class-validator'

export class ResendCodeDto {
	@IsEmail({}, { message: 'Введите корректный email' })
	@IsNotEmpty({ message: 'Почта обязательна' })
	email: string
}
