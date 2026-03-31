import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email?: string }
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Укажите email' }, { status: 400 })
    }
    const cleanEmail = email.trim().toLowerCase()

    const supabase = createServiceClient()

    // Only active affiliates can log in
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id, name')
      .eq('email', cleanEmail)
      .eq('status', 'active')
      .single()

    if (!affiliate) {
      // Don't reveal whether email exists — generic message
      return NextResponse.json({ ok: true })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    await supabase
      .from('affiliates')
      .update({ otp_code: otp, otp_expires_at: expiresAt })
      .eq('id', affiliate.id)

    const firstName = (affiliate.name as string).split(' ')[0]

    await resend.emails.send({
      from: 'Вкус Жизни <hello@nata-tomshina.ru>',
      to: cleanEmail,
      subject: 'Код для входа в кабинет партнёра',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;">
          <h2 style="font-size:22px;color:#3D2B8A;margin:0 0 12px;">Привет, ${firstName}!</h2>
          <p style="color:#7B6FAA;margin:0 0 28px;font-size:15px;line-height:1.65;">
            Ваш код для входа в партнёрский кабинет «Вкус Жизни»:
          </p>
          <div style="font-size:42px;font-weight:700;color:#3D2B8A;letter-spacing:10px;text-align:center;padding:24px;background:#F0EEFF;border-radius:16px;margin-bottom:28px;">
            ${otp}
          </div>
          <p style="font-size:13px;color:#9B8FCC;margin:0;">
            Код действует 15 минут. Если вы не запрашивали вход — просто проигнорируйте это письмо.
          </p>
          <hr style="border:none;border-top:1px solid #EDE8FF;margin:24px 0;">
          <p style="font-size:13px;color:#9B8FCC;margin:0;">Наталья Томшина · Клуб «Вкус Жизни»</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[partner/send-otp]', err)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
