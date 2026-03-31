import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin' && member?.role !== 'curator') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const admin = createServiceClient()
  const { data: days, error: dbErr } = await admin
    .from('marathon_days')
    .select('*')
    .eq('marathon_id', id)
    .order('day_number', { ascending: true })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ days: days ?? [] })
}

// Bulk upsert days
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => ({}))
  const days = Array.isArray(body?.days) ? body.days : []

  if (days.length === 0) return NextResponse.json({ error: 'days обязательны' }, { status: 400 })

  const admin = createServiceClient()

  const records = days.map((d: Record<string, unknown>) => ({
    marathon_id: id,
    day_number: d.day_number,
    task_title: d.task_title ?? null,
    task_text: d.task_text ?? null,
    coach_comment: d.coach_comment ?? null,
    ration_text: d.ration_text ?? null,
  }))

  const { data, error: upsertErr } = await admin
    .from('marathon_days')
    .upsert(records, { onConflict: 'marathon_id,day_number' })
    .select()

  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  return NextResponse.json({ days: data ?? [] })
}
