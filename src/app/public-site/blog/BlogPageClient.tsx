'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createSupabasePublic } from '@/lib/supabase/public'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import { BLOG_CATEGORIES } from '@/lib/blog-categories'
import { SILO_CONFIG, getArticleUrl } from '@/lib/silo-config'

interface BlogPost {
  id: string; slug: string; title: string; excerpt: string | null
  cover_image_url: string | null; published_at: string | null
  category: string | null; subcategory: string | null
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogPageClient() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  useEffect(() => {
    const supabase = createSupabasePublic()
    supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, cover_image_url, published_at, category, subcategory')
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
    <div style={{ background: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <PublicNav currentPage="/blog" />

      {/* HERO */}
      <div className="bl-hero">
        <div className="bl-hero__inner">
          <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Блог' }]} />
          <div className="bl-kicker">— Блог</div>
          <h1 className="bl-hero__title">Статьи о питании<br />и гормональном балансе</h1>
          <p className="bl-hero__lead">От нутрициолога Натальи Томшиной — о том, как питание влияет на здоровье, вес и самочувствие женщины</p>
        </div>
      </div>

      {/* SILO CATEGORY CARDS */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 5% 0' }}>
        <h2 className="bl-sections__heading">Разделы блога</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 48 }}>
          {Object.entries(SILO_CONFIG).map(([key, cat]) => (
            <Link key={key} href={`/blog/${key}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'var(--color-bg-surface)', border: '1.5px solid var(--color-border)', borderRadius: 16, padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 32 }}>{cat.emoji}</span>
                <p style={{ fontFamily: 'var(--font-serif-display)', fontSize: 13, fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>{cat.label}</p>
                <p style={{ fontSize: 12, color: 'var(--color-green)', margin: 0, fontFamily: 'var(--font-sans)', fontWeight: 700 }}>Читать →</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bl-filter-bar">
        <div className="bl-filter-bar__inner">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`bl-filter-pill${activeCategory === 'all' ? ' bl-filter-pill--active' : ''}`}
          >
            Все статьи
          </button>
          {BLOG_CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveCategory(value)}
              className={`bl-filter-pill${activeCategory === value ? ' bl-filter-pill--active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* POSTS */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 5%' }}>
        {activeCategory !== 'all' && (
          <h2 className="bl-active-heading">{categoryLabel}</h2>
        )}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-ink-soft)' }}>Загрузка...</div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
            <p style={{ color: 'var(--color-ink-soft)', fontSize: 16 }}>Статей в этой рубрике пока нет</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 24 }}>
            {visible.map(post => (
              <Link key={post.id} href={getArticleUrl(post)} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                <article style={{ background: 'var(--color-bg-surface)', borderRadius: 20, overflow: 'hidden', border: '1.5px solid var(--color-border)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {post.cover_image_url && (
                    <div style={{ aspectRatio: '16/9', overflow: 'hidden', position: 'relative' }}>
                      <Image src={post.cover_image_url} alt={post.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" />
                    </div>
                  )}
                  <div style={{ padding: '20px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {post.category && (
                      <span className="bl-category-label">
                        {BLOG_CATEGORIES.find(c => c.value === post.category)?.label ?? post.category}
                      </span>
                    )}
                    <h2 className="bl-card__title">{post.title}</h2>
                    {post.excerpt && (
                      <p style={{ fontSize: 14, color: 'var(--color-ink-soft)', margin: '0 0 16px', lineHeight: 1.6, flex: 1 }}>{post.excerpt}</p>
                    )}
                    <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: 0 }}>{formatDate(post.published_at)}</p>
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
