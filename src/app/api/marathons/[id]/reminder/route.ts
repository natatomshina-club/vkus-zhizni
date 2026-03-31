import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()
  const { data } = await admin
    .from('marathon_reminders')
    .select('id')
    .eq('marathon_id', id)
    .eq('member_id', user.id)
    .maybeSingle()

  return NextResponse.json({ registered: !!data })
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()

  const { data: existing } = await admin
    .from('marathon_reminders')
    .select('id')
    .eq('marathon_id', id)
    .eq('member_id', user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ ok: true, already: true })

  const { error } = await admin.from('marathon_reminders').insert({
    marathon_id: id,
    member_id: user.id,
    reminder_sent: false,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
