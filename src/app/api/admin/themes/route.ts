import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function GET() {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const admin = createServiceClient()
  const { data } = await admin
    .from('seasonal_themes')
    .select('*')
    .order('start_date', { ascending: true })

  return NextResponse.json({ themes: data ?? [] })
}

export async function POST(req: Request) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => null)
  if (!body?.slug || !body?.title || !body?.start_date || !body?.end_date) {
    return NextResponse.json({ error: 'slug, title, start_date, end_date обязательны' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { data, error: insErr } = await admin
    .from('seasonal_themes')
    .insert({
      slug: body.slug,
      title: body.title,
      emoji: body.emoji ?? '✨',
      particle_type: body.particle_type ?? 'stars',
      accent_color: body.accent_color ?? '#7C5CFC',
      accent_light: body.accent_light ?? '#F0EEFF',
      start_date: body.start_date,
      end_date: body.end_date,
      is_forced: false,
    })
    .select()
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  return NextResponse.json({ theme: data }, { status: 201 })
}

export async function PATCH(req: Request) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : null
  if (!id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 })

  const admin = createServiceClient()

  // If forcing this theme on, unforce all others first
  if (body.is_forced === true) {
    await admin.from('seasonal_themes').update({ is_forced: false }).neq('id', id)
  }

  const updates: Record<string, unknown> = {}
  if (typeof body.is_forced === 'boolean') updates.is_forced = body.is_forced
  if (typeof body.title === 'string') updates.title = body.title
  if (typeof body.emoji === 'string') updates.emoji = body.emoji
  if (typeof body.particle_type === 'string') updates.particle_type = body.particle_type
  if (typeof body.accent_color === 'string') updates.accent_color = body.accent_color
  if (typeof body.accent_light === 'string') updates.accent_light = body.accent_light
  if (typeof body.start_date === 'string') updates.start_date = body.start_date
  if (typeof body.end_date === 'string') updates.end_date = body.end_date

  const { data, error: upErr } = await admin
    .from('seasonal_themes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  return NextResponse.json({ theme: data })
}

export async function DELETE(req: Request) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id обязателен' }, { status: 400 })

  const admin = createServiceClient()
  const { error: delErr } = await admin.from('seasonal_themes').delete().eq('id', id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
