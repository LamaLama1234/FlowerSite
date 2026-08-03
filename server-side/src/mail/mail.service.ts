import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { Resend } from 'resend'

@Injectable()
export class MailService {
	private readonly logger = new Logger(MailService.name)
	private readonly resend = new Resend(process.env.RESEND_API_KEY)
	private readonly from = process.env.RESEND_FROM_EMAIL || 'GreenArt <onboarding@resend.dev>'

	async sendVerificationCode(email: string, code: string) {
		await this.sendCodeEmail(
			email,
			`Код подтверждения: ${code} — GreenArt`,
			code,
			'Ваш код подтверждения почты:',
			'Если вы не запрашивали регистрацию — просто проигнорируйте это письмо.'
		)
	}

	async sendPasswordResetCode(email: string, code: string) {
		await this.sendCodeEmail(
			email,
			`Код для сброса пароля: ${code} — GreenArt`,
			code,
			'Код для восстановления пароля:',
			'Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо, пароль останется прежним.'
		)
	}

	private async sendCodeEmail(
		email: string,
		subject: string,
		code: string,
		intro: string,
		footer: string
	) {
		const { error } = await this.resend.emails.send({
			from: this.from,
			to: email,
			subject,
			html: this.renderCodeEmail(code, intro, footer)
		})

		if (error) {
			this.logger.error(`Не удалось отправить письмо на ${email}: ${error.message}`)
			throw new ServiceUnavailableException(
				'Не удалось отправить письмо. Попробуйте позже.'
			)
		}
	}

	private renderCodeEmail(code: string, intro: string, footer: string) {
		return `
			<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 420px; margin: 0 auto; padding: 32px 24px; background: #fbf6ea;">
				<h1 style="color: #16665a; font-size: 22px; margin: 0 0 12px;">GreenArt</h1>
				<p style="color: #444; font-size: 15px; line-height: 1.5;">
					${intro}
				</p>
				<div style="font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #7a5f32; background: #fff; border: 1px dashed #d9bc77; border-radius: 12px; padding: 16px; text-align: center; margin: 16px 0;">
					${code}
				</div>
				<p style="color: #888; font-size: 13px;">
					Код действует 15 минут. ${footer}
				</p>
			</div>
		`
	}
}
