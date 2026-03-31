import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createServiceClient()
  const { data: member } = await admin.from('members').select('role').eq('email', user.email!).single()
  return member?.role === 'admin' ? admin : null
}

export async function POST(req: NextRequest) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as {
    section_id: string
    title: string
    description?: string
    format: string
    content_url?: string
    duration_label?: string
    sort_order?: number
    is_published?: boolean
    attachments?: { name: string; url: string }[]
  }

  const { section_id, title, format } = body
  if (!section_id || !title?.trim() || !format) {
    return NextResponse.json({ error: 'section_id, title and format are required' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('body_materials')
    .insert({
      section_id,
      title: title.trim(),
      description: body.description || null,
      format,
      content_url: body.content_url || null,
      duration_label: body.duration_label || null,
      sort_order: body.sort_order ?? 0,
      is_published: body.is_published ?? true,
      attachments: body.attachments ?? [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ material: data })
}
