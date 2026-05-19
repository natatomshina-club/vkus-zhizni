import nodemailer from 'nodemailer'
import { baseEmailTemplate } from './email-templates/base'

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  from?: string
  /** Pass true when html is already a full email document (no wrapping needed) */
  raw?: boolean
}

const DEFAULT_FROM = 'Вкус Жизни <noreply@nata-tomshina.ru>'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.beget.com',
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true,
  auth: {
    user: process.env.SMTP_USER ?? 'noreply@nata-tomshina.ru',
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: params.from ?? DEFAULT_FROM,
      to: params.to,
      subject: params.subject,
      html: params.raw ? params.html : baseEmailTemplate(params.html),
    })
    return true
  } catch (e) {
    console.error('[mailer] exception:', e)
    return false
  }
}
