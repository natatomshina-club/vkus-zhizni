import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const VALID_FORMATS = ['video', 'article', 'pdf', 'audio'] as const

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()
    const { data: member } = await admin
      .from('members')
      .select('role, subscription_status')
      .eq('email', user.email!)
      .single()

    const isAdmin = member?.role === 'admin'
    const isTrial = member?.subscription_status !== 'active'

    let query = admin
      .from('help_materials')
      .select('id, title, description, format, content_url, thumbnail_url, duration_label, sort_order, views_count, is_published, attachments')
      .order('sort_order')

    if (!isAdmin) query = query.eq('is_published', true)

    const { data, error } = await query

    if (error) {
      console.error('[help/materials GET]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const materials = (data ?? []).map((m, i) => {
      if (isAdmin || !isTrial || i < 3) return { ...m, locked: false }
      return { ...m, content_url: null, locked: true }
    })

    return NextResponse.json({ materials })
  } catch (e) {
    console.error('[help/materials GET]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()
    const { data: member } = await admin
      .from('members').select('role').eq('email', user.email!).single()
    if (member?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json() as Record<string, unknown>

    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const format = typeof body.format === 'string' ? body.format : ''

    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
    if (!(VALID_FORMATS as readonly string[]).includes(format)) {
      return NextResponse.json({ error: 'invalid format' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('help_materials')
      .insert({
        title,
        description: typeof body.description === 'string' ? body.description.trim() || null : null,
        format,
        content_url: typeof body.content_url === 'string' ? body.content_url.trim() || null : null,
        thumbnail_url: typeof body.thumbnail_url === 'string' ? body.thumbnail_url.trim() || null : null,
        duration_label: typeof body.duration_label === 'string' ? body.duration_label.trim() || null : null,
        is_published: body.is_published === true,
        sort_order: typeof body.sort_order === 'number' ? body.sort_order : 0,
        attachments: Array.isArray(body.attachments) ? body.attachments : [],
      })
      .select('id, title, description, format, content_url, thumbnail_url, duration_label, sort_order, views_count, is_published, attachments')
      .single()

    if (error) {
      console.error('[help/materials POST]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error('[help/materials POST]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
