import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()

  const { data: member } = await admin
    .from('members')
    .select('id')
    .eq('email', user.email)
    .single()
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const { data: completions } = await admin
    .from('marathon_task_completions')
    .select('day_number, completed_at')
    .eq('marathon_id', id)
    .eq('member_id', member.id)

  return NextResponse.json({ completions: completions ?? [] })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log('[complete] START', id)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    console.log('[complete] user:', user.email)

    const body = await req.json().catch(() => ({}))
    const day_number = typeof body?.day_number === 'number' ? body.day_number : null
    if (!day_number) return NextResponse.json({ error: 'day_number обязателен' }, { status: 400 })

    console.log('[complete] day_number:', day_number)

    const admin = createServiceClient()

    const { data: member, error: memberError } = await admin
      .from('members')
      .select('id')
      .eq('email', user.email)
      .single()

    console.log('[complete] member lookup:', { member, memberError })

    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const upsertData = { marathon_id: id, member_id: member.id, day_number, completed_at: new Date().toISOString() }
    console.log('[complete] upsert data:', upsertData)

    const { error } = await admin
      .from('marathon_task_completions')
      .upsert(upsertData, { onConflict: 'marathon_id,member_id,day_number', ignoreDuplicates: true })

    if (error) {
      console.error('[complete] upsert error:', error)
      console.error('[complete] upsert error full:', JSON.stringify(error, null, 2))
      return NextResponse.json({ ok: false, error: error.message, details: error }, { status: 500 })
    }

    console.log('[complete] SUCCESS')
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[complete] CATCH:', e)
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
