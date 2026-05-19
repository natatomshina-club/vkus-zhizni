import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/mailer'

export async function POST(request: Request) {
  try {
    const { email } = await request.json() as { email?: string }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Некорректный email' }, { status: 400 })
    }

    const normalEmail = email.toLowerCase().trim()
    const supabase = createServiceClient()

    // Rate limit: не чаще 1 раза в 2 минуты
    const { data: existing } = await supabase
      .from('email_otps')
      .select('expires_at')
      .eq('email', normalEmail)
      .single()

    if (existing) {
      const expiresAt = new Date(existing.expires_at)
      const twoMinutesFromNow = new Date(Date.now() + 13 * 60 * 1000) // expires_at = now+15, rate limit = within 13 min
      if (expiresAt > twoMinutesFromNow) {
        return NextResponse.json({ error: 'Подождите 2 минуты перед повторной отправкой' }, { status: 429 })
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    const { error: dbError } = await supabase.from('email_otps').upsert({
      email: normalEmail,
      otp,
      expires_at: expiresAt,
    }, { onConflict: 'email' })

    if (dbError) {
      return NextResponse.json({ error: 'Ошибка сохранения кода. Попробуйте ещё раз.' }, { status: 500 })
    }

    const sent = await sendEmail({
      to: email,
      subject: 'Ваш код для получения рациона',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #FFFAF5;">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="font-weight: 700; font-size: 20px; color: #3D2817;">Вкус<span style="color: #7A9F3F;">Жизни</span></span>
          </div>
          <h2 style="font-size: 20px; color: #3D2817; margin-bottom: 12px;">Код подтверждения</h2>
          <p style="color: #7B6555; margin-bottom: 28px;">Введите этот код, чтобы получить персональный рацион на 7 дней:</p>
          <div style="font-size: 40px; font-weight: 700; color: #3D2817; letter-spacing: 8px; margin-bottom: 28px; text-align: center; padding: 20px; background: #FFF0E8; border-radius: 16px; border: 1.5px solid #F4E6DC;">
            ${otp}
          </div>
          <p style="font-size: 13px; color: #9B8570;">Код действует 15 минут. Если вы не запрашивали рацион — просто проигнорируйте это письмо.</p>
          <hr style="border: none; border-top: 1px solid #F4E6DC; margin: 28px 0;" />
          <p style="font-size: 13px; color: #9B8570;">Наталья Томшина · Клуб «Вкус Жизни»</p>
        </div>
      `,
    })

    if (!sent) {
      return NextResponse.json({ error: 'Не удалось отправить письмо. Проверьте email и попробуйте ещё раз.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('racion/send-otp error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
