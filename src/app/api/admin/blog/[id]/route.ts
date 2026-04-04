import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return null
  return user
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  console.log('[blog PATCH] id:', id, '| body keys:', Object.keys(body), '| content length:', body.content?.length ?? 'not sent')
  const supabase = createServiceClient()

  const now = new Date().toISOString()
  const updates: Record<string, unknown> = { updated_at: now }

  if ('title' in body) updates.title = body.title
  if ('slug' in body) updates.slug = body.slug
  if ('excerpt' in body) updates.excerpt = body.excerpt || null
  if ('content' in body) updates.content = body.content || null
  if ('cover_image_url' in body) updates.cover_image_url = body.cover_image_url || null
  if ('meta_title' in body) updates.meta_title = body.meta_title || null
  if ('meta_description' in body) updates.meta_description = body.meta_description || null
  if ('category' in body) updates.category = body.category || null
  if ('widget_type' in body) updates.widget_type = body.widget_type || null
  if ('is_published' in body) {
    updates.is_published = body.is_published
    if (body.is_published && !body.keep_published_at) {
      updates.published_at = now
    } else if (!body.is_published) {
      updates.published_at = null
    }
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[blog PATCH] Supabase error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  console.log('[blog PATCH] Saved OK — content length in DB:', (data as Record<string, unknown>)?.content ? String((data as Record<string, unknown>).content).length : 0)
  return NextResponse.json({ post: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const supabase = createServiceClient()

  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
