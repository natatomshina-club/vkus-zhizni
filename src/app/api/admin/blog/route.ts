import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const PAGE_SIZE = 100
  const page = Math.max(0, parseInt(new URL(request.url).searchParams.get('page') ?? '0', 10) || 0)
  const from = page * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  const supabase = createServiceClient()
  const { data, error, count } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, content, cover_image_url, is_published, published_at, meta_title, meta_description, category, subcategory, widget_type, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data, total: count ?? 0, page, page_size: PAGE_SIZE })
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

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
      category: body.category || null,
      subcategory: body.subcategory || null,
      widget_type: body.widget_type || null,
      main_keyword: body.main_keyword || null,
      cluster_name: body.cluster_name || null,
      updated_at: now,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}
