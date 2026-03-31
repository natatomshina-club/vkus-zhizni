import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, ref_code } = await req.json() as { email: string; ref_code: string }

    if (!email || !ref_code) {
      return NextResponse.json({ ok: false, error: 'Missing email or ref_code' }, { status: 400 })
    }

    const trimmedEmail = email.trim().toLowerCase()

    // Verify affiliate is active before saving
    const { data: affiliate } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('ref_code', ref_code)
      .eq('status', 'active')
      .single()

    if (!affiliate) {
      console.log('[save-ref] affiliate not found or inactive for ref_code:', ref_code)
      return NextResponse.json({ ok: true }) // silent — don't expose affiliate status
    }

    // Upsert into pending_refs (TTL cleanup handled separately)
    const { error } = await supabaseAdmin
      .from('pending_refs')
      .upsert({ email: trimmedEmail, ref_code }, { onConflict: 'email' })

    if (error) {
      console.error('[save-ref] upsert error:', error.message)
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    console.log('[save-ref] saved ref_code:', ref_code, 'for email:', trimmedEmail)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[save-ref] error:', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
