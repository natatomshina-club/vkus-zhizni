import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { title, url } = await req.json() as { title: string; url: string }

  if (!title?.trim() || !url?.trim()) {
    return NextResponse.json({ error: 'title and url required' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('intro_lesson_materials')
    .insert({ lesson_id: id, title: title.trim(), url: url.trim(), sort_order: 0 })
    .select('id, lesson_id, title, url, sort_order')
    .single()

  if (error) {
    console.error('[intro-lessons/materials POST]', JSON.stringify(error))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ material: data })
}
