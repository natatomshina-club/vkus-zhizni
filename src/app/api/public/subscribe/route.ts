import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email } = await request.json() as { email?: string }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Некорректный email' }, { status: 400 })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min

    const supabase = createServiceClient()

    // Upsert OTP record
    const { error: dbError } = await supabase.from('email_otps').upsert({
      email: email.toLowerCase().trim(),
      otp,
      expires_at: expiresAt,
    }, { onConflict: 'email' })

    if (dbError) {
      console.error('email_otps upsert error:', dbError)
      return NextResponse.json({ error: 'Ошибка сохранения кода. Попробуйте ещё раз.' }, { status: 500 })
    }

    // Send email
    const { error: emailError } = await resend.emails.send({
      from: 'Наталья Томшина <hello@nata-tomshina.ru>',
      to: email,
      subject: 'Ваш код для входа в мини-курс',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
          <h2 style="font-size: 22px; color: #3D2B8A; margin-bottom: 12px;">Код подтверждения</h2>
          <p style="color: #7B6FAA; margin-bottom: 28px;">Введите этот код, чтобы получить доступ к бесплатному мини-курсу «Волшебный пендель»:</p>
          <div style="font-size: 40px; font-weight: 700; color: #3D2B8A; letter-spacing: 8px; margin-bottom: 28px; text-align: center; padding: 20px; background: #F0EEFF; border-radius: 16px;">
            ${otp}
          </div>
          <p style="font-size: 13px; color: #9B8FCC;">Код действует 15 минут. Если вы не запрашивали доступ — просто проигнорируйте это письмо.</p>
          <hr style="border: none; border-top: 1px solid #EDE8FF; margin: 28px 0;" />
          <p style="font-size: 13px; color: #9B8FCC;">Наталья Томшина · Клуб «Вкус Жизни»</p>
        </div>
      `,
    })

    if (emailError) {
      console.error('Resend error:', emailError)
      return NextResponse.json({ error: 'Не удалось отправить письмо. Проверьте email и попробуйте ещё раз.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Subscribe route error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
