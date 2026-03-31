'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createSupabasePublic } from '@/lib/supabase/public'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import { BLOG_CATEGORIES } from '@/lib/blog-categories'

interface BlogPost {
  id: string; slug: string; title: string; excerpt: string | null
  cover_image_url: string | null; published_at: string | null; category: string | null
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  useEffect(() => {
    const supabase = createSupabasePublic()
    supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, cover_image_url, published_at, category')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        setPosts((data ?? []) as BlogPost[])
        setLoading(false)
      })
  }, [])

  const visible = activeCategory === 'all'
    ? posts
    : posts.filter(p => p.category === activeCategory)

  const categoryLabel = BLOG_CATEGORIES.find(c => c.value === activeCategory)?.label

  return (
    <div style={{ background: '#FAF8FF', minHeight: '100vh' }}>
      <PublicNav currentPage="/blog" />

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg, #1A0E4E 0%, #3D2B8A 100%)', padding: '48px 5% 52px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Блог' }]} />
          <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(24px,4vw,40px)', fontWeight: 700, color: '#fff', margin: '12px 0 8px' }}>Блог</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.6)', margin: 0 }}>Статьи о питании для гормонального баланса и здоровом образе жизни</p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ background: '#fff', borderBottom: '1.5px solid #EDE8FF', position: 'sticky', top: 65, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 5%', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
          <button
            onClick={() => setActiveCategory('all')}
            style={{ fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 100, border: '1.5px solid', whiteSpace: 'nowrap', cursor: 'pointer',
              borderColor: activeCategory === 'all' ? '#3D2B8A' : '#EDE8FF',
              background: activeCategory === 'all' ? '#3D2B8A' : 'transparent',
              color: activeCategory === 'all' ? '#fff' : '#7B6FAA',
            }}
          >
            Все статьи
          </button>
          {BLOG_CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setActiveCategory(value)}
              style={{ fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 100, border: '1.5px solid', whiteSpace: 'nowrap', cursor: 'pointer',
                borderColor: activeCategory === value ? '#3D2B8A' : '#EDE8FF',
                background: activeCategory === value ? '#3D2B8A' : 'transparent',
                color: activeCategory === value ? '#fff' : '#7B6FAA',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* POSTS */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 5%' }}>
        {activeCategory !== 'all' && (
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, color: '#3D2B8A', marginBottom: 28 }}>
            {categoryLabel}
          </h2>
        )}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#7B6FAA' }}>Загрузка...</div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
            <p style={{ color: '#7B6FAA', fontSize: 16 }}>Статей в этой рубрике пока нет</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 24 }}>
            {visible.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                <article style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1.5px solid #EDE8FF', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {post.cover_image_url && (
                    <div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
                      <Image src={post.cover_image_url} alt={post.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" />
                    </div>
                  )}
                  <div style={{ padding: '20px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {post.category && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#7C5CFC', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8, display: 'block' }}>
                        {BLOG_CATEGORIES.find(c => c.value === post.category)?.label ?? post.category}
                      </span>
                    )}
                    <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#3D2B8A', margin: '0 0 8px', lineHeight: 1.4 }}>
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p style={{ fontSize: 14, color: '#7B6FAA', margin: '0 0 16px', lineHeight: 1.6, flex: 1 }}>{post.excerpt}</p>
                    )}
                    <p style={{ fontSize: 12, color: '#B0A8D4', margin: 0 }}>{formatDate(post.published_at)}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>

      <PublicFooter />
    </div>
  )
}
