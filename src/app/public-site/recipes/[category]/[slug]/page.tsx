import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabasePublic } from '@/lib/supabase/public'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import HorizontalBanner from '@/components/public/HorizontalBanner'
import { RECIPES_CONFIG } from '@/lib/silo-config'

interface Recipe {
  id: string; slug: string; title: string; excerpt: string | null
  content: string | null; cover_image_url: string | null; published_at: string | null
  meta_title: string | null; meta_description: string | null; category: string | null
}

async function getRecipe(slug: string): Promise<Recipe | null> {
  const supabase = createSupabasePublic()
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  return data as Recipe | null
}

export async function generateStaticParams() {
  const supabase = createSupabasePublic()
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, category')
    .eq('is_published', true)
    .in('category', Object.keys(RECIPES_CONFIG))
  return (data ?? []).map((r: { slug: string; category: string }) => ({
    category: r.category,
    slug: r.slug,
  }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string; slug: string }> }
): Promise<Metadata> {
  const { category, slug } = await params
  const recipe = await getRecipe(slug)
  if (!recipe) return { title: 'Рецепт не найден' }
  const canonicalUrl = `https://nata-tomshina.ru/recipes/${category}/${slug}`
  return {
    title: recipe.meta_title ?? recipe.title,
    description: recipe.meta_description ?? recipe.excerpt ?? undefined,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: recipe.meta_title ?? recipe.title,
      description: recipe.meta_description ?? recipe.excerpt ?? undefined,
      url: canonicalUrl,
      type: 'article',
      ...(recipe.cover_image_url ? { images: [{ url: recipe.cover_image_url }] } : {}),
    },
  }
}

export const revalidate = 60

export default async function RecipePage(
  { params }: { params: Promise<{ category: string; slug: string }> }
) {
  const { category, slug } = await params
  const cat = RECIPES_CONFIG[category as keyof typeof RECIPES_CONFIG]
  const recipe = await getRecipe(slug)
  if (!recipe) notFound()

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Рецепты', href: '/recipes' },
    ...(cat ? [{ label: cat.label, href: `/recipes/${category}` }] : []),
    { label: recipe.title },
  ]

  const recipeUrl = `/recipes/${category}/${slug}`

  return (
    <div style={{ background: '#FFFAF5', minHeight: '100vh', overflowX: 'hidden' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Recipe',
          name: recipe.title,
          description: recipe.excerpt ?? '',
          image: recipe.cover_image_url ?? '',
          datePublished: recipe.published_at ?? '',
          author: {
            '@type': 'Person',
            name: 'Наталья Томшина',
            url: 'https://nata-tomshina.ru/about',
          },
          publisher: {
            '@type': 'Organization',
            name: 'Наталья Томшина',
            url: 'https://nata-tomshina.ru',
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://nata-tomshina.ru${recipeUrl}`,
          },
        })}}
      />
      <PublicNav currentPage="/blog" />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
        <Breadcrumbs items={breadcrumbs} />
        <HorizontalBanner />

        <article style={{ marginTop: 32 }}>
          {recipe.cover_image_url && (
            <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 32, aspectRatio: '16/9' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={recipe.cover_image_url} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          {cat && (
            <Link href={`/recipes/${category}`} style={{ fontSize: 12, fontWeight: 700, color: '#2D7A3A', textTransform: 'uppercase', letterSpacing: '.06em', textDecoration: 'none', display: 'inline-block', marginBottom: 12 }}>
              {cat.emoji} {cat.label}
            </Link>
          )}

          <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(20px,4vw,32px)', fontWeight: 700, color: '#1A3A1A', margin: '0 0 12px', lineHeight: 1.3 }}>
            {recipe.title}
          </h1>

          {recipe.excerpt && (
            <p style={{ fontSize: 16, color: '#5A7A5A', margin: '0 0 32px', lineHeight: 1.7 }}>{recipe.excerpt}</p>
          )}

          {recipe.content && (
            <div
              style={{ fontFamily: 'var(--font-nunito)', fontSize: 16, lineHeight: 1.8, color: '#1A3A1A' }}
              className="recipe-content"
              dangerouslySetInnerHTML={{ __html: recipe.content }}
            />
          )}

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', background: '#E8F5E8', border: '1.5px solid #C8E6C9', borderRadius: 16, padding: '20px 24px', margin: '40px 0 32px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/natalia.png" alt="Наталья Томшина" width={64} height={64} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            <div>
              <p style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#1A3A1A', margin: '0 0 2px' }}>Наталья Томшина</p>
              <p style={{ fontSize: 12, color: '#2D7A3A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 8px' }}>нутрициолог</p>
              <p style={{ fontSize: 14, color: '#3A5A3A', margin: 0, lineHeight: 1.6 }}>
                Нутрициолог с практическим опытом более 10 лет. Рецепты для гормонального баланса без сахара и быстрых углеводов.
              </p>
            </div>
          </div>
        </article>
      </div>

      <div style={{ marginTop: 64 }}>
        <PublicFooter />
      </div>

      <style>{`
        .recipe-content h2 { color:#1A3A1A; font-family:var(--font-unbounded); font-size:20px; margin:32px 0 14px; }
        .recipe-content h3 { color:#1A3A1A; font-family:var(--font-unbounded); font-size:16px; margin:24px 0 10px; }
        .recipe-content p { line-height:1.8; color:#1A3A1A; margin-bottom:14px; }
        .recipe-content ul { list-style:none; padding-left:0; margin:16px 0; }
        .recipe-content ul li { padding:6px 0 6px 28px; position:relative; border-bottom:1px solid #E8F5E8; color:#1A3A1A; line-height:1.7; }
        .recipe-content ul li::before { content:'✓'; position:absolute; left:0; color:#2D7A3A; font-weight:700; }
        .recipe-content ol { padding-left:0; list-style:none; counter-reset:step; margin:16px 0; }
        .recipe-content ol li { counter-increment:step; padding:10px 0 10px 44px; position:relative; border-bottom:1px solid #E8F5E8; color:#1A3A1A; line-height:1.7; }
        .recipe-content ol li::before { content:counter(step); position:absolute; left:0; width:30px; height:30px; background:#2D7A3A; color:#fff; border-radius:50%; text-align:center; line-height:30px; font-weight:700; font-size:13px; top:8px; }
        .recipe-content strong { color:#2D7A3A; }
        .recipe-content img { max-width:100%; border-radius:16px; margin:20px 0; }
      `}</style>
    </div>
  )
}
