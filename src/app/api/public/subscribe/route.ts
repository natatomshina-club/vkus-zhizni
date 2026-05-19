import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/mailer'
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
          ip,
          user_agent: userAgent,
          email_sent: false,
        },
        { onConflict: 'email' }
      )

    if (dbError) {
      console.error('[subscribe] DB error:', dbError)
      return NextResponse.json({ error: 'Ошибка. Попробуйте ещё раз.' }, { status: 500 })
    }

    // Non-blocking email with course access link
    sendAccessEmail(email.toLowerCase().trim()).catch(err =>
      console.error('[subscribe] email error:', err)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[subscribe] error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

async function sendAccessEmail(email: string) {
  const supabase = createServiceClient()

  const sent = await sendEmail({
    to: email,
    subject: 'Ваш доступ к курсу «Волшебный пендель»',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; background: #fff;">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-family: Georgia, serif; font-size: 22px; color: #2c5f2e; font-weight: 600;">Наталья Томшина</span>
        </div>
        <h2 style="font-family: Georgia, serif; font-size: 24px; color: #1a2c1a; font-weight: 700; margin: 0 0 16px;">
          Ваш бесплатный курс готов
        </h2>
        <p style="color: #5a6e5a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
          Курс «Волшебный пендель» — 7 уроков о том, почему диеты не работают и что делать прямо сейчас.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://nata-tomshina.ru/free-kurs"
             style="display: inline-block; background: #3a7c3e; color: #fff; font-size: 16px; font-weight: 700; padding: 18px 44px; border-radius: 50px; text-decoration: none; letter-spacing: 0.02em;">
            Открыть курс →
          </a>
        </div>
        <p style="color: #8a9e8a; font-size: 13px; line-height: 1.6; margin: 0 0 8px;">
          Доступ постоянный — возвращайтесь в любое время.
        </p>
        <hr style="border: none; border-top: 1px solid #e8f0e8; margin: 24px 0;" />
        <p style="font-size: 12px; color: #a0b0a0; margin: 0;">
          Наталья Томшина · Клуб «Вкус Жизни»
        </p>
      </div>
    `,
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
