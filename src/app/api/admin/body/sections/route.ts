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

export async function GET() {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: sections, error } = await admin
    .from('body_sections')
    .select(`
      id, title, emoji, sort_order, is_active,
      body_materials(id, title, description, format, content_url, duration_label, sort_order, is_published, views_count, created_at, attachments)
    `)
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sections: sections ?? [] })
}

export async function POST(req: NextRequest) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, emoji, sort_order } = await req.json() as { title: string; emoji?: string; sort_order?: number }
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

  const { data, error } = await admin
    .from('body_sections')
    .insert({ title: title.trim(), emoji: emoji || '📁', sort_order: sort_order ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ section: data })
}
