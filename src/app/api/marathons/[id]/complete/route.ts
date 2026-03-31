import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()
  const { data: completions } = await admin
    .from('marathon_task_completions')
    .select('day_number, completed_at')
    .eq('marathon_id', id)
    .eq('member_id', user.id)

  return NextResponse.json({ completions: completions ?? [] })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const day_number = typeof body?.day_number === 'number' ? body.day_number : null
  if (!day_number) return NextResponse.json({ error: 'day_number обязателен' }, { status: 400 })

  const admin = createServiceClient()

  // Check if already completed
  const { data: existing } = await admin
    .from('marathon_task_completions')
    .select('id')
    .eq('marathon_id', id)
    .eq('member_id', user.id)
    .eq('day_number', day_number)
    .maybeSingle()

  if (existing) return NextResponse.json({ ok: true, already: true })

  const { error } = await admin.from('marathon_task_completions').insert({
    marathon_id: id,
    member_id: user.id,
    day_number,
    completed_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
