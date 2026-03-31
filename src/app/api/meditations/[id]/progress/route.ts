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
    .from('meditation_progress')
    .select('*')
    .eq('meditation_id', id)
    .eq('member_id', user.id)
    .maybeSingle()

  return NextResponse.json({ progress: data ?? null })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const admin = createServiceClient()

  const { data, error } = await admin
    .from('meditation_progress')
    .upsert({
      meditation_id: id,
      member_id: user.id,
      last_position_seconds: body.last_position_seconds ?? 0,
      completed: body.completed ?? false,
      listened_at: new Date().toISOString(),
    }, { onConflict: 'member_id,meditation_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ progress: data })
}
