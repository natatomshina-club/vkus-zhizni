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
    .from('marathon_measurements')
    .select('*')
    .eq('marathon_id', id)
    .eq('member_id', user.id)
    .maybeSingle()

  return NextResponse.json({ measurement: data ?? null })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const admin = createServiceClient()

  const record: Record<string, unknown> = {
    marathon_id: id,
    member_id: user.id,
  }
  if (typeof body.weight_start === 'number') {
    record.weight_start = body.weight_start
    record.start_recorded_at = new Date().toISOString()
  }
  if (typeof body.weight_end === 'number') {
    record.weight_end = body.weight_end
    record.end_recorded_at = new Date().toISOString()
  }

  const { data, error } = await admin
    .from('marathon_measurements')
    .upsert(record, { onConflict: 'marathon_id,member_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ measurement: data })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const admin = createServiceClient()

  const updates: Record<string, unknown> = {}
  if (typeof body.weight_start === 'number') {
    updates.weight_start = body.weight_start
    updates.start_recorded_at = new Date().toISOString()
  }
  if (typeof body.weight_end === 'number') {
    updates.weight_end = body.weight_end
    updates.end_recorded_at = new Date().toISOString()
  }

  const { data, error } = await admin
    .from('marathon_measurements')
    .upsert({ marathon_id: id, member_id: user.id, ...updates }, { onConflict: 'marathon_id,member_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ measurement: data })
}
