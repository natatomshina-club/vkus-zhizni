import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { signFreeToken } from '@/lib/jwt'

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json() as { email?: string; otp?: string }
    if (!email || !otp) {
      return NextResponse.json({ error: 'email и otp обязательны' }, { status: 400 })
    }

    const normalEmail = email.toLowerCase().trim()
    const supabase = createServiceClient()

    const { data } = await supabase
      .from('email_otps')
      .select('otp, expires_at')
      .eq('email', normalEmail)
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
    await supabase.from('email_otps').delete().eq('email', normalEmail)

    // Register as subscriber with source='racion'
    try {
      const { data: subRow } = await supabase
        .from('subscribers')
        .upsert(
          {
            email: normalEmail,
            source: 'racion',
            status: 'active',
            tags: ['racion', 'lead_magnet'],
            lead_magnet_sent_at: new Date().toISOString(),
          },
          { onConflict: 'email', ignoreDuplicates: true }
        )
        .select('id')
        .maybeSingle()

      // Start welcome_leads sequence for new subscriber
      if (subRow?.id) {
        const { data: existingProgress } = await supabase
          .from('subscriber_sequence_progress')
          .select('id')
          .eq('subscriber_id', subRow.id)
          .eq('series', 'welcome_leads')
          .maybeSingle()

        if (!existingProgress) {
          await supabase.from('subscriber_sequence_progress').insert({
            subscriber_id: subRow.id,
            series: 'welcome_leads',
            current_step: 0,
            next_send_at: new Date().toISOString(),
            completed: false,
          })
        }
      }
    } catch (e) {
      console.warn('racion subscriber upsert warning:', e)
    }

    const token = await signFreeToken(normalEmail)

    const response = NextResponse.json({ ok: true })
    response.cookies.set('racion_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    return response
  } catch (err) {
    console.error('racion/verify-otp error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
