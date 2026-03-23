import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const starts_at = typeof body?.starts_at === 'string' ? body.starts_at.trim() : ''
  const ends_at = typeof body?.ends_at === 'string' ? body.ends_at.trim() : ''
  const next_date = typeof body?.next_date === 'string' ? body.next_date.trim() || null : null

  if (!title) return NextResponse.json({ error: 'title обязателен' }, { status: 400 })
  if (title.length > 100) return NextResponse.json({ error: 'title max 100 символов' }, { status: 400 })
  if (!starts_at) return NextResponse.json({ error: 'starts_at обязателен' }, { status: 400 })
  if (!ends_at) return NextResponse.json({ error: 'ends_at обязателен' }, { status: 400 })
  if (new Date(ends_at) <= new Date(starts_at)) {
    return NextResponse.json({ error: 'ends_at должен быть позже starts_at' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('marathons')
    .insert({ title, starts_at, ends_at, next_date, status: 'active' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ marathon: data }, { status: 201 })
}
