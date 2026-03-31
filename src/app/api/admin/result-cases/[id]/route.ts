import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  try {
    const admin = createServiceClient()
    const update: Record<string, unknown> = {}
    const fields = ['name','tag_badge','kg','kg_color','kg_period','stripe','before_text','after_text',
      'quote','extras','tags','video_url','is_published','featured','sort_order']
    for (const f of fields) {
      if (f in body) update[f] = body[f]
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error: dbErr } = await admin
      .from('result_cases')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (dbErr) {
      console.error('Update case error:', dbErr)
      return NextResponse.json({ error: dbErr.message }, { status: 500 })
    }
    return NextResponse.json({ case: data })
  } catch (err) {
    console.error('Update case error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id } = await params
  const admin = createServiceClient()
  const { error: dbErr } = await admin.from('result_cases').delete().eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
