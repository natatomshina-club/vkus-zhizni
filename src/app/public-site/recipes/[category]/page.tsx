import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabasePublic } from '@/lib/supabase/public'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import { RECIPES_CONFIG } from '@/lib/silo-config'

interface Recipe {
  id: string; slug: string; title: string; excerpt: string | null
  cover_image_url: string | null; published_at: string | null; category: string | null
}

export const dynamicParams = true
export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  return Object.keys(RECIPES_CONFIG).map(k => ({ category: k }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> }
): Promise<Metadata> {
  const { category } = await params
  const cat = RECIPES_CONFIG[category as keyof typeof RECIPES_CONFIG]
  if (!cat) return { title: 'Рецепты' }
  return {
    title: `${(cat as { title?: string; label: string }).title ?? cat.label} | Вкус Жизни`,
    description: cat.description,
  }
}

export const revalidate = 60

export default async function RecipeCategoryPage(
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params
  const cat = RECIPES_CONFIG[category as keyof typeof RECIPES_CONFIG]
  if (!cat) notFound()

  const supabase = createSupabasePublic()
  const { data: recipes } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image_url, published_at, category')
    .eq('is_published', true)
    .eq('category', category)
    .order('published_at', { ascending: false })

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Рецепты', href: '/recipes' },
    { label: cat.label },
  ]

  return (
    <div style={{ background: '#FFFAF5', minHeight: '100vh' }}>
      <PublicNav currentPage="/blog" />

      <div style={{ background: 'linear-gradient(135deg, #1A4E1A 0%, #2D7A3A 100%)', padding: '48px 5% 52px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Breadcrumbs items={breadcrumbs} dark />
          <div style={{ fontSize: 48, marginBottom: 12 }}>{cat.emoji}</div>
          <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(24px,4vw,40px)', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>{cat.label}</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.7)', margin: 0 }}>{cat.description}</p>
        </div>
      </div>

      {/* Category pills */}
      <div style={{ background: '#fff', borderBottom: '1.5px solid #C8E6C9' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '12px 5%', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
          <Link href="/recipes" style={{ fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 100, border: '1.5px solid #C8E6C9', whiteSpace: 'nowrap', textDecoration: 'none', background: 'transparent', color: '#2D7A3A' }}>
            Все рецепты
          </Link>
          {Object.entries(RECIPES_CONFIG).map(([key, c]) => (
            <Link
              key={key}
              href={`/recipes/${key}`}
              style={{ fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 100, border: '1.5px solid', whiteSpace: 'nowrap', textDecoration: 'none',
                borderColor: key === category ? '#2D7A3A' : '#C8E6C9',
                background: key === category ? '#2D7A3A' : 'transparent',
                color: key === category ? '#fff' : '#2D7A3A',
              }}
            >
              {c.emoji} {c.label}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 5%' }}>
        {(recipes ?? []).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{cat.emoji}</div>
            <p style={{ color: '#7B6555', fontSize: 16 }}>Рецепты в этой категории скоро появятся</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 24 }}>
            {(recipes ?? []).map((recipe: Recipe) => (
              <Link key={recipe.id} href={`/recipes/${category}/${recipe.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                <article style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1.5px solid #C8E6C9', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {recipe.cover_image_url ? (
                    <div style={{ aspectRatio: '4/3', overflow: 'hidden' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={recipe.cover_image_url} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ aspectRatio: '4/3', background: '#E8F5E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
                      {cat.emoji}
                    </div>
                  )}
                  <div style={{ padding: '16px 20px 20px', flex: 1 }}>
                    <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: '#1A3A1A', margin: '0 0 8px', lineHeight: 1.4 }}>{recipe.title}</h2>
                    {recipe.excerpt && <p style={{ fontSize: 13, color: '#5A7A5A', margin: 0, lineHeight: 1.6 }}>{recipe.excerpt}</p>}
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
