import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabasePublic } from '@/lib/supabase/public'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import BlogSidebar from '@/components/public/BlogSidebar'
import BlogWidget from '@/components/public/BlogWidget'
import HorizontalBanner from '@/components/public/HorizontalBanner'
import { selectWidget } from '@/lib/widget-selector'
import { BLOG_CATEGORIES, getCategoryLabel } from '@/lib/blog-categories'

interface BlogPost {
  id: string; slug: string; title: string; excerpt: string | null
  content: string | null; cover_image_url: string | null; published_at: string | null
  meta_title: string | null; meta_description: string | null
  main_keyword?: string | null; cluster_name?: string | null
  category?: string | null; widget_type?: string | null
}

interface CategoryCount { category: string; count: number }

async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = createSupabasePublic()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) console.error('getPost error:', error.message, 'slug:', slug)
  return data as BlogPost | null
}

async function getCategoryCounts(): Promise<CategoryCount[]> {
  const supabase = createSupabasePublic()
  const { data } = await supabase
    .from('blog_posts')
    .select('category')
    .eq('is_published', true)
    .not('category', 'is', null)
  if (!data) return []
  const counts: Record<string, number> = {}
  for (const row of data) {
    if (row.category) counts[row.category] = (counts[row.category] ?? 0) + 1
  }
  return Object.entries(counts).map(([category, count]) => ({ category, count }))
}

async function getRelatedPosts(post: BlogPost): Promise<BlogPost[]> {
  const supabase = createSupabasePublic()
  if (post.category) {
    const { data: sameCategory } = await supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, cover_image_url, category')
      .eq('is_published', true)
      .eq('category', post.category)
      .neq('id', post.id)
      .limit(3)
    if (sameCategory && sameCategory.length >= 3) return sameCategory as BlogPost[]
    const existing = sameCategory ?? []
    if (existing.length < 3) {
      const existingIds = [post.id, ...existing.map((p: { id: string }) => p.id)]
      const { data: others } = await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, cover_image_url, category')
        .eq('is_published', true)
        .not('id', 'in', `(${existingIds.join(',')})`)
        .limit(3 - existing.length)
      return [...existing, ...(others ?? [])] as BlogPost[]
    }
    return existing as BlogPost[]
  }
  const { data } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image_url, category')
    .eq('is_published', true)
    .neq('id', post.id)
    .limit(3)
  return (data ?? []) as BlogPost[]
}

export async function generateStaticParams() {
  const supabase = createSupabasePublic()
  const { data } = await supabase.from('blog_posts').select('slug')
  return (data ?? []).map((p: { slug: string }) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Статья не найдена' }
  return {
    title: post.meta_title ?? post.title,
    description: post.meta_description ?? post.excerpt ?? undefined,
    openGraph: post.cover_image_url ? { images: [{ url: post.cover_image_url }] } : undefined,
  }
}

export const revalidate = 60

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [post, categoryCounts] = await Promise.all([getPost(slug), getCategoryCounts()])
  if (!post) notFound()

  const relatedPosts = await getRelatedPosts(post)

  // Widget: use explicit widget_type if set, otherwise auto-select
  const widgetType = post.widget_type === 'none'
    ? null
    : post.widget_type ?? selectWidget(post.main_keyword ?? '', post.cluster_name ?? post.title)

  const categoryLabel = getCategoryLabel(post.category)

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Блог', href: '/blog' },
    ...(post.category ? [{ label: categoryLabel, href: `/blog?category=${post.category}` }] : []),
    { label: post.title },
  ]

  return (
    <div style={{ background: '#FAF8FF', minHeight: '100vh' }}>
      <PublicNav currentPage="/blog" />

      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 24px' }}>
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} />

        {/* Horizontal banner */}
        <HorizontalBanner />

        {/* Two-column layout */}
        <div className="blog-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32, alignItems: 'start', marginTop: 32 }}>

          {/* Article */}
          <article>
            {post.cover_image_url && (
              <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 32, aspectRatio: '16/9' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.cover_image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            {post.category && (
              <Link href={`/blog?category=${post.category}`} style={{ fontSize: 12, fontWeight: 700, color: '#7C5CFC', textTransform: 'uppercase', letterSpacing: '.06em', textDecoration: 'none', display: 'inline-block', marginBottom: 12 }}>
                {categoryLabel}
              </Link>
            )}

            <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(20px,4vw,32px)', fontWeight: 700, color: '#3D2B8A', margin: '0 0 12px', lineHeight: 1.3 }}>
              {post.title}
            </h1>
            <p style={{ fontSize: 13, color: '#B0A8D4', margin: '0 0 36px' }}>{formatDate(post.published_at)}</p>

            {post.content && (
              <div
                style={{ fontFamily: 'var(--font-nunito)', fontSize: 16, lineHeight: 1.8, color: '#2D1F6E' }}
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            )}

            {/* Widget */}
            {widgetType && <BlogWidget type={widgetType} />}

            {/* Related posts */}
            {relatedPosts.length > 0 && (
              <div style={{ marginTop: 48 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#7B6FAA', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  Читайте также
                  <span style={{ flex: 1, height: 1.5, background: '#EDE8FF', borderRadius: 2, display: 'block' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {relatedPosts.map(related => (
                    <Link key={related.id} href={`/blog/${related.slug}`} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', gap: 16, background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 16, padding: 16, alignItems: 'flex-start' }}>
                        {related.cover_image_url && (
                          <div style={{ width: 80, height: 60, flexShrink: 0, borderRadius: 10, overflow: 'hidden' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={related.cover_image_url} alt={related.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 13, fontWeight: 700, color: '#3D2B8A', margin: '0 0 6px', lineHeight: 1.4 }}>{related.title}</h3>
                          {related.excerpt && (
                            <p style={{ fontSize: 12, color: '#7B6FAA', margin: 0, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {related.excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <div className="blog-sidebar-sticky" style={{ position: 'sticky', top: 88 }}>
            <BlogSidebar categoryCounts={categoryCounts} activeCategory={post.category} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 64 }}>
        <PublicFooter />
      </div>

      <style>{`
        .blog-content h2 { color:#3D2B8A; font-family:var(--font-unbounded); font-size:22px; margin:40px 0 16px; padding-bottom:8px; border-bottom:2px solid #EDE8FF; }
        .blog-content h3 { color:#3D2B8A; font-family:var(--font-unbounded); font-size:17px; margin:32px 0 12px; }
        .blog-content p { line-height:1.8; color:#3D2B8A; margin-bottom:16px; }
        .blog-content ul { list-style:none; padding-left:0; margin:20px 0; }
        .blog-content ul li { padding:8px 0 8px 32px; position:relative; border-bottom:1px solid #F0EEFF; line-height:1.7; color:#3D2B8A; }
        .blog-content ul li::before { content:'✦'; position:absolute; left:0; color:#7C5CFC; font-size:14px; top:10px; }
        .blog-content ol { list-style:none; counter-reset:item; padding-left:0; margin:20px 0; }
        .blog-content ol li { counter-increment:item; padding:10px 0 10px 48px; position:relative; border-bottom:1px solid #F0EEFF; line-height:1.7; color:#3D2B8A; }
        .blog-content ol li::before { content:counter(item); position:absolute; left:0; width:32px; height:32px; background:#7C5CFC; color:#fff; border-radius:50%; text-align:center; line-height:32px; font-weight:700; font-size:14px; top:8px; }
        .blog-content strong { color:#7C5CFC; }
        .blog-content a { color:#7C5CFC; }
        .blog-content blockquote { border-left:4px solid #7C5CFC; padding-left:20px; margin:24px 0; color:#7B6FAA; font-style:italic; }
        .blog-content img { max-width:100%; border-radius:16px; margin:24px 0; box-shadow:0 4px 20px rgba(0,0,0,.1); }
        .tip-block { background:#F0EEFF; border-left:4px solid #7C5CFC; border-radius:0 12px 12px 0; padding:16px 20px; margin:24px 0; display:flex; gap:12px; align-items:flex-start; font-family:var(--font-nunito); color:#3D2B8A; line-height:1.6; }
        .cta-button { background:linear-gradient(135deg,#4CAF78 0%,#3D9B65 100%); color:#fff !important; font-family:var(--font-nunito); font-size:18px; font-weight:800; text-decoration:none !important; padding:18px 40px; border-radius:50px; box-shadow:0 8px 24px rgba(76,175,120,.35); margin:32px auto; display:block; text-align:center; max-width:400px; }
        @media (max-width: 768px) {
          .blog-two-col { grid-template-columns: 1fr !important; }
          .blog-sidebar-sticky { position: static !important; }
        }
      `}</style>
    </div>
  )
}
