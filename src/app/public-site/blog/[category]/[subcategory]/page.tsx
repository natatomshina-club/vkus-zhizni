import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabasePublic } from '@/lib/supabase/public'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import RelatedSubcategories from '@/components/public/RelatedSubcategories'
import { UnifiedHero } from '@/components/public/article/UnifiedHero'
import { AuthorCard } from '@/components/public/article/AuthorCard'
import { Disclaimer } from '@/components/public/article/Disclaimer'
import { SILO_CONFIG, isSiloCategory, getArticleUrl } from '@/lib/silo-config'
import type { SubcategoryData } from '@/lib/silo-config'

interface BlogPost {
  id: string; slug: string; title: string; excerpt: string | null
  cover_image_url: string | null; published_at: string | null
  category: string | null; subcategory: string | null
}

interface SubHubData {
  content_html: string | null
  is_ready: boolean
  is_indexed: boolean
  meta_title: string | null
  meta_description: string | null
}

const BASE = 'https://nata-tomshina.ru'
const MARKER = '<!-- ARTICLES_PLACEHOLDER -->'

async function getSubHubData(category: string, subcategory: string): Promise<SubHubData | null> {
  const supabase = createSupabasePublic()
  const { data } = await supabase
    .from('blog_subcategory_hubs')
    .select('content_html, is_ready, is_indexed, meta_title, meta_description')
    .eq('category', category)
    .eq('subcategory', subcategory)
    .maybeSingle()
  return data ?? null
}

export async function generateStaticParams() {
  const params: { category: string; subcategory: string }[] = []
  for (const [catKey, cat] of Object.entries(SILO_CONFIG)) {
    for (const subKey of Object.keys(cat.subcategories)) {
      params.push({ category: catKey, subcategory: subKey })
    }
  }
  return params
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string; subcategory: string }> }
): Promise<Metadata> {
  const { category, subcategory } = await params
  if (!isSiloCategory(category)) return { title: 'Не найдено' }

  const cat = SILO_CONFIG[category]
  const subLabel = (cat.subcategories as Record<string, string>)[subcategory]
  if (!subLabel) return { title: 'Не найдено' }

  const subData = (cat as { subcategoriesData?: SubcategoryData[] }).subcategoriesData
    ?.find(s => s.slug === subcategory)

  const hubData = await getSubHubData(category, subcategory)

  const title = hubData?.meta_title
    ?? (subData ? `${subData.h1} | Вкус Жизни` : `${subLabel} — ${cat.label} | Блог Натальи Томшиной`)

  const description = hubData?.meta_description
    ?? subData?.description
    ?? `Статьи о ${subLabel.toLowerCase()} — советы нутрициолога Натальи Томшиной для женщин 40+.`

  const canonicalUrl = `${BASE}/blog/${category}/${subcategory}/`
  const noIndex = !(hubData?.is_ready && hubData?.is_indexed)

  return {
    title,
    description,
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Вкус Жизни — блог нутрициолога',
      locale: 'ru_RU',
      type: 'website',
    },
  }
}

export const revalidate = 60

export default async function SubcategoryPage(
  { params }: { params: Promise<{ category: string; subcategory: string }> }
) {
  const { category, subcategory } = await params

  if (!isSiloCategory(category)) notFound()
  const cat = SILO_CONFIG[category]
  const subLabel = (cat.subcategories as Record<string, string>)[subcategory]
  if (!subLabel) notFound()

  const subData = (cat as { subcategoriesData?: SubcategoryData[] }).subcategoriesData
    ?.find(s => s.slug === subcategory) ?? null

  const allSubcategoriesData = (cat as { subcategoriesData?: SubcategoryData[] }).subcategoriesData ?? []

  const supabase = createSupabasePublic()
  const [{ data: posts }, hubData] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, cover_image_url, published_at, category, subcategory')
      .eq('is_published', true)
      .eq('category', category)
      .eq('subcategory', subcategory)
      .order('published_at', { ascending: false }),
    getSubHubData(category, subcategory),
  ])

  const h1 = subData?.h1 ?? subLabel
  const description = subData?.description ?? `Статьи о ${subLabel.toLowerCase()} — советы нутрициолога Натальи Томшиной для женщин 40+.`
  const canonicalUrl = `${BASE}/blog/${category}/${subcategory}/`

  const isReady = hubData?.is_ready ?? false
  const noIndex = !(hubData?.is_ready && hubData?.is_indexed)

  const contentHtml = hubData?.content_html ?? ''
  const markerIdx = contentHtml.indexOf(MARKER)
  const contentBefore = markerIdx >= 0 ? contentHtml.slice(0, markerIdx) : (isReady ? contentHtml : '')
  const contentAfter = markerIdx >= 0 ? contentHtml.slice(markerIdx + MARKER.length) : ''

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Блог', href: '/blog' },
    { label: cat.label, href: `/blog/${category}` },
    { label: subLabel },
  ]

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': canonicalUrl,
        name: h1,
        description,
        url: canonicalUrl,
        inLanguage: 'ru',
        breadcrumb: { '@id': `${canonicalUrl}#breadcrumb` },
        author: {
          '@type': 'Person',
          name: 'Наталья Томшина',
          jobTitle: 'нутрициолог',
          url: `${BASE}/about`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: `${BASE}/` },
          { '@type': 'ListItem', position: 2, name: 'Блог', item: `${BASE}/blog` },
          { '@type': 'ListItem', position: 3, name: cat.label, item: `${BASE}/blog/${category}` },
          { '@type': 'ListItem', position: 4, name: subLabel },
        ],
      },
    ],
  }

  return (
    <div style={{ background: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />

      <PublicNav currentPage="/blog" />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 5% 0' }}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      <UnifiedHero
        variant="hub"
        category={cat.label}
        subcategory={h1}
        title={h1}
        excerpt={description}
      />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 5%' }}>

        {/* Related subcategory pills (only relevant neighbours, not all 19) */}
        {subData && subData.relatedSubcategories.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
            {subData.relatedSubcategories.map(slug => {
              const label = (cat.subcategories as Record<string, string>)[slug]
              if (!label) return null
              return (
                <Link
                  key={slug}
                  href={`/blog/${category}/${slug}`}
                  style={{
                    fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 100,
                    border: '1.5px solid var(--color-accent-border)',
                    background: 'transparent',
                    color: 'var(--color-text-secondary)',
                    textDecoration: 'none', whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        )}

        {/* Hub content — before articles */}
        {isReady && contentBefore && (
          <div className="blog-content hub-content" dangerouslySetInnerHTML={{ __html: contentBefore }} />
        )}

        {/* Placeholder when not ready */}
        {!isReady && (
          <div style={{
            background: 'var(--color-bg-muted)', border: '2px solid var(--color-accent-border)', borderRadius: 20,
            padding: '28px 32px', marginBottom: 40,
          }}>
            <p style={{
              fontFamily: 'var(--font-serif-display)', fontSize: 14, fontWeight: 700,
              color: 'var(--color-accent)', margin: '0 0 10px',
            }}>
              ✍️ Скоро здесь появится полный гид
            </p>
            <p style={{ fontSize: 15, color: 'var(--color-text-primary)', margin: '0 0 14px', lineHeight: 1.7 }}>
              Нутрициолог Наталья Томшина готовит подробный материал по теме «{subLabel}».
              Здесь будут практические рекомендации, основанные на реальном опыте работы с женщинами 35–60 лет.
            </p>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
              {description}
            </p>
          </div>
        )}

        {/* Articles grid */}
        {(posts ?? []).length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 24, marginBottom: 48 }}>
            {(posts ?? []).map((post: BlogPost) => (
              <Link key={post.id} href={getArticleUrl(post)} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                <article style={{
                  background: 'var(--color-bg-surface)', borderRadius: 20, overflow: 'hidden',
                  border: '1.5px solid var(--color-accent-border)', flex: 1, display: 'flex', flexDirection: 'column',
                }}>
                  {post.cover_image_url && (
                    <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.cover_image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: '20px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{
                      fontFamily: 'var(--font-serif-display)', fontSize: 15, fontWeight: 700,
                      color: 'var(--color-text-primary)', margin: '0 0 8px', lineHeight: 1.4,
                    }}>
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 16px', lineHeight: 1.6, flex: 1 }}>
                        {post.excerpt}
                      </p>
                    )}
                    <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: 0 }}>
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
                        : ''}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* Hub content — after articles */}
        {isReady && contentAfter && (
          <div className="blog-content hub-content" dangerouslySetInnerHTML={{ __html: contentAfter }} style={{ marginBottom: 48 }} />
        )}

        <Disclaimer />
        <AuthorCard variant="full" />

        {/* Related subcategories */}
        {allSubcategoriesData.length > 0 && (
          <RelatedSubcategories
            current={subcategory}
            category={category}
            allSubcategoriesData={allSubcategoriesData}
          />
        )}

      </div>

      <PublicFooter />

    </div>
  )
}
