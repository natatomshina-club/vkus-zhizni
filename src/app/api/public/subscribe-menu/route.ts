import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/mailer'
import { baseEmailTemplate } from '@/lib/email-templates/base'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { email } = await request.json() as { email?: string }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Некорректный email' }, { status: 400 })
    }

    const hdrs = await headers()
    const ip =
      hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      hdrs.get('x-real-ip') ??
      'unknown'
    const userAgent = hdrs.get('user-agent') ?? ''

    const supabase = createServiceClient()

    const { error: dbError } = await supabase
      .from('subscribers')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          source: 'menu-racion',
          ip,
          user_agent: userAgent,
          email_sent: false,
        },
        { onConflict: 'email' }
      )

    if (dbError) {
      console.error('[subscribe-menu] DB error:', dbError)
      return NextResponse.json({ error: 'Ошибка. Попробуйте ещё раз.' }, { status: 500 })
    }

    sendMenuEmail(email.toLowerCase().trim()).catch(err =>
      console.error('[subscribe-menu] email error:', err)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[subscribe-menu] error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

async function sendMenuEmail(email: string) {
  const supabase = createServiceClient()

  const content = `
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#1a2c1a;font-weight:700;margin:0 0 14px;">
      Ваше меню на неделю готово
    </h2>
    <p style="color:#5a6e5a;font-size:16px;line-height:1.6;margin:0 0 10px;">
      Готовое меню на 7 дней: завтрак, обед и ужин с рецептами и списком покупок.
      Три приёма пищи, без подсчёта калорий и взвешивания.
    </p>
    <p style="color:#5a6e5a;font-size:16px;line-height:1.6;margin:0 0 24px;">
      Распечатайте и положите на холодильник — или откройте на телефоне прямо на кухне.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="https://nata-tomshina.ru/pdf/racion-7-dney.pdf"
         style="display:inline-block;background:#3a7c3e;color:#fff;font-size:16px;font-weight:700;padding:18px 44px;border-radius:50px;text-decoration:none;letter-spacing:0.02em;">
        Скачать меню (PDF) →
      </a>
    </div>
    <p style="color:#8a9e8a;font-size:14px;line-height:1.6;margin:0 0 4px;">
      Страница со скачиванием также открылась в браузере — можно вернуться в любое время.
    </p>
  `

  const sent = await sendEmail({
    to: email,
    subject: 'Ваше меню на неделю готово',
    html: baseEmailTemplate(content, 'Меню на 7 дней + список покупок — забирайте'),
  })

  if (sent) {
    await supabase
      .from('subscribers')
      .update({ email_sent: true, email_sent_at: new Date().toISOString() })
      .eq('email', email)
  } else {
    await supabase
      .from('subscribers')
      .update({ email_error: 'send_failed' })
      .eq('email', email)
  }
}
