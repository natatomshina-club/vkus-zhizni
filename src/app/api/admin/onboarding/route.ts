import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const admin = createServiceClient()
  const { data: member } = await admin.from('members').select('role').eq('email', user.email!).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

// GET /api/admin/onboarding?section=about&device=mobile
export async function GET(req: NextRequest) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { searchParams } = new URL(req.url)
  const section = searchParams.get('section')
  const device = searchParams.get('device') ?? 'mobile'

  const admin = createServiceClient()
  let query = admin
    .from('onboarding_content')
    .select('id, section, screen, device, video_url, description, sort_order, title, cover_url')
    .eq('device', device)
    .order('sort_order', { ascending: true })

  if (section) query = query.eq('section', section)

  const { data, error: dbErr } = await query
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

// PATCH /api/admin/onboarding
// Body: { section, screen, device, video_url?, description?, sort_order?, title?, cover_url? }
export async function PATCH(req: NextRequest) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { section, screen, device, video_url, description, sort_order, title, cover_url } = body as {
    section: string
    screen: string
    device: string
    video_url?: string | null
    description?: string | null
    sort_order?: number
    title?: string | null
    cover_url?: string | null
  }

  if (!section || !screen || !device) {
    return NextResponse.json({ error: 'section, screen, device обязательны' }, { status: 400 })
  }

  // Build update object with only explicitly provided fields
  const updateData: Record<string, unknown> = {
    section,
    screen,
    device,
    updated_at: new Date().toISOString(),
  }
  if ('video_url' in body) updateData.video_url = video_url ?? null
  if ('description' in body) updateData.description = description ?? null
  if ('sort_order' in body) updateData.sort_order = sort_order ?? 0
  if ('title' in body) updateData.title = title ?? null
  if ('cover_url' in body) updateData.cover_url = cover_url ?? null

  const admin = createServiceClient()
  const { data, error: dbErr } = await admin
    .from('onboarding_content')
    .upsert(updateData, { onConflict: 'section,screen,device' })
    .select('id, section, screen, device, video_url, description, sort_order, title, cover_url')
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

// DELETE /api/admin/onboarding
// Body: { section, screen, device }
export async function DELETE(req: NextRequest) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => null)
  const { section, screen, device } = (body ?? {}) as { section?: string; screen?: string; device?: string }

  if (!section || !screen || !device) {
    return NextResponse.json({ error: 'section, screen, device обязательны' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { error: dbErr } = await admin
    .from('onboarding_content')
    .delete()
    .eq('section', section)
    .eq('screen', screen)
    .eq('device', device)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
