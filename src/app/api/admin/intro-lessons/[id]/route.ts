import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { extractKinescopeId } from '@/lib/kinescope'

export async function PATCH(
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
  const body = await req.json() as {
    title?: string
    video_url?: string
    bonus_video_url?: string
    text_content?: string
    is_visible?: boolean
  }

  const update: Record<string, unknown> = {}
  if (body.title !== undefined) update.title = body.title
  if (body.text_content !== undefined) update.text_content = body.text_content
  if (body.is_visible !== undefined) update.is_visible = body.is_visible
  if ((body as { sort_order?: number }).sort_order !== undefined) update.sort_order = (body as { sort_order?: number }).sort_order
  if (body.video_url !== undefined) {
    const vid = body.video_url ? extractKinescopeId(body.video_url) : null
    update.video_url = vid ? `https://kinescope.io/${vid}` : null
  }
  if (body.bonus_video_url !== undefined) {
    const bid = body.bonus_video_url ? extractKinescopeId(body.bonus_video_url) : null
    update.bonus_video_url = bid ? `https://kinescope.io/${bid}` : null
  }

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('intro_lessons')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lesson: data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: member } = await supabase
    .from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const admin = createServiceClient()
  const { error } = await admin.from('intro_lessons').delete().eq('id', id)

  if (error) {
    console.error('[intro-lessons DELETE]', JSON.stringify(error))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
