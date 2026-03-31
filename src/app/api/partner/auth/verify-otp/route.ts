import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { signPartnerToken, COOKIE_NAME, TTL_DAYS } from '@/lib/partner-auth'

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json() as { email?: string; otp?: string }
    if (!email?.trim() || !otp?.trim()) {
      return NextResponse.json({ error: 'Укажите email и код' }, { status: 400 })
    }
    const cleanEmail = email.trim().toLowerCase()
    const cleanOtp = otp.trim()

    const supabase = createServiceClient()

    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id, email, otp_code, otp_expires_at')
      .eq('email', cleanEmail)
      .eq('status', 'active')
      .single()

    if (!affiliate) {
      return NextResponse.json({ error: 'Неверный код' }, { status: 401 })
    }

    if (
      affiliate.otp_code !== cleanOtp ||
      !affiliate.otp_expires_at ||
      new Date(affiliate.otp_expires_at) < new Date()
    ) {
      return NextResponse.json({ error: 'Неверный или просроченный код' }, { status: 401 })
    }

    // Invalidate OTP
    await supabase
      .from('affiliates')
      .update({ otp_code: null, otp_expires_at: null })
      .eq('id', affiliate.id)

    const token = await signPartnerToken({ affiliate_id: affiliate.id, email: cleanEmail })

    const res = NextResponse.json({ ok: true })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: TTL_DAYS * 24 * 60 * 60,
    })
    return res
  } catch (err) {
    console.error('[partner/verify-otp]', err)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
