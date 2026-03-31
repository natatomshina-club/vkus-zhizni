import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* empty body is ok */ }
  console.log('Onboarding complete received:', JSON.stringify(body))
  console.log('Updating member by email:', user.email)

  // Service role обходит RLS — обновляем по email
  const admin = createServiceClient()
  const { error } = await admin
    .from('members')
    .update({ tour_completed: true })
    .eq('email', user.email)

  console.log('Update result:', { error: error ? error.message : null })

  if (error) {
    console.error('Onboarding complete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
