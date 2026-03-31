import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { signFreeToken } from '@/lib/jwt'

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json() as { email?: string; otp?: string }
    if (!email || !otp) {
      return NextResponse.json({ error: 'email и otp обязательны' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data } = await supabase
      .from('email_otps')
      .select('otp, expires_at')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!data) {
      return NextResponse.json({ error: 'Код не найден. Запросите новый.' }, { status: 400 })
    }
    if (data.otp !== otp.trim()) {
      return NextResponse.json({ error: 'Неверный код' }, { status: 400 })
    }
    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Код истёк. Запросите новый.' }, { status: 400 })
    }

    // Clean up OTP
    await supabase.from('email_otps').delete().eq('email', email.toLowerCase().trim())

    // Track as subscriber
    try {
      await supabase
        .from('subscribers')
        .upsert(
          {
            email: email.toLowerCase().trim(),
            source: 'website_free',
            status: 'active',
            tags: ['free_minicourse'],
            lead_magnet_sent_at: new Date().toISOString(),
          },
          { onConflict: 'email', ignoreDuplicates: true }
        )
    } catch (e) {
      console.warn('subscribers upsert warning:', e)
    }

    // Issue JWT token
    const token = await signFreeToken(email.toLowerCase().trim())

    const response = NextResponse.json({ ok: true })
    response.cookies.set('free_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
    return response
  } catch (error) {
    console.error('Verify-email route error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
