import { IsEmail, IsNotEmpty, IsString, Length, MaxLength, MinLength } from 'class-validator'

export class ResetPasswordDto {
	@IsEmail({}, { message: 'Введите корректный email' })
	@IsNotEmpty({ message: 'Почта обязательна' })
	email: string

	@IsString({ message: 'Код обязателен' })
	@Length(6, 6, { message: 'Код должен состоять из 6 цифр' })
	code: string

	@IsString({ message: 'Пароль обязателен' })
	@MinLength(6, { message: 'Пароль должен быть не меньше 6 символов' })
	@MaxLength(128, { message: 'Пароль слишком длинный' })
	newPassword: string
}
