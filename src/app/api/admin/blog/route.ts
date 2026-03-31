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

export async function GET(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const PAGE_SIZE = 100
  const page = Math.max(0, parseInt(new URL(request.url).searchParams.get('page') ?? '0', 10) || 0)
  const from = page * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  const supabase = createServiceClient()
  const { data, error, count } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, content, cover_image_url, is_published, published_at, meta_title, meta_description, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data, total: count ?? 0, page, page_size: PAGE_SIZE })
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const supabase = createServiceClient()

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      slug: body.slug,
      title: body.title,
      excerpt: body.excerpt || null,
      content: body.content || null,
      cover_image_url: body.cover_image_url || null,
      meta_title: body.meta_title || null,
      meta_description: body.meta_description || null,
      is_published: body.is_published ?? false,
      published_at: body.is_published ? now : null,
      updated_at: now,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}
