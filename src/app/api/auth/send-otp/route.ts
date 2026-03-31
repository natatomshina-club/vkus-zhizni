import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Use anon key — signInWithOtp works with anon key from server side
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

    const { error } = await supabaseAnon.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })

    if (error) {
      console.error('send-otp error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('send-otp exception:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
