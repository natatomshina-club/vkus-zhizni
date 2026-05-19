import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const VALID_FORMATS = ['video', 'article', 'pdf', 'audio']

async function getAdminClient(email: string) {
  const admin = createServiceClient()
  const { data: member } = await admin
    .from('members').select('role').eq('email', email).single()
  if (member?.role !== 'admin') return null
  return admin
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await getAdminClient(user.email!)
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json() as Record<string, unknown>
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (typeof body.title === 'string') updates.title = body.title.trim()
    if (typeof body.description === 'string') updates.description = body.description.trim() || null
    if (typeof body.format === 'string' && VALID_FORMATS.includes(body.format)) updates.format = body.format
    if (typeof body.content_url === 'string') updates.content_url = body.content_url.trim() || null
    if (typeof body.thumbnail_url === 'string') updates.thumbnail_url = body.thumbnail_url.trim() || null
    if (typeof body.duration_label === 'string') updates.duration_label = body.duration_label.trim() || null
    if (typeof body.is_published === 'boolean') updates.is_published = body.is_published
    if (typeof body.sort_order === 'number') updates.sort_order = body.sort_order
    if (Array.isArray(body.attachments)) updates.attachments = body.attachments

    const { data, error } = await admin
      .from('help_materials')
      .update(updates)
      .eq('id', id)
      .select('id, title, description, format, content_url, thumbnail_url, duration_label, sort_order, views_count, is_published, attachments')
      .single()

    if (error) {
      console.error('[help/materials PATCH]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e) {
    console.error('[help/materials PATCH]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await getAdminClient(user.email!)
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await admin.from('help_materials').delete().eq('id', id)

    if (error) {
      console.error('[help/materials DELETE]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[help/materials DELETE]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
