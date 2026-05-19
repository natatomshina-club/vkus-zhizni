import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabasePublic } from '@/lib/supabase/public'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import { UnifiedHero } from '@/components/public/article/UnifiedHero'
import { AuthorCard } from '@/components/public/article/AuthorCard'
import { SILO_CONFIG, POHUDENIE_GROUPS, isSiloCategory, getArticleUrl } from '@/lib/silo-config'

const GROUP_THEMES: Record<string, string> = {
  'По возрасту и состоянию': 'rose',
  'По подходу': 'green',
  'По срокам и результатам': 'blue',
  'Решение проблем': 'orange',
  'Начало пути': 'cream',
}
import type { SubcategoryData } from '@/lib/silo-config'

const BASE = 'https://nata-tomshina.ru'

interface BlogPost {
  id: string; slug: string; title: string; excerpt: string | null
  cover_image_url: string | null; published_at: string | null
  category: string | null; subcategory: string | null
}

async function getHubData(category: string): Promise<{
  content_html: string | null; is_ready: boolean; is_indexed: boolean
  meta_title: string | null; meta_description: string | null
} | null> {
  const supabase = createSupabasePublic()
  const { data } = await supabase
    .from('blog_hubs')
    .select('content_html, is_ready, is_indexed, meta_title, meta_description')
    .eq('category', category)
    .maybeSingle()
  return data ?? null
}

export async function generateStaticParams() {
  return Object.keys(SILO_CONFIG).map(k => ({ category: k }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> }
): Promise<Metadata> {
  const { category } = await params
  if (!isSiloCategory(category)) return { title: 'Не найдено' }
  const cat = SILO_CONFIG[category]
  const catExt = cat as typeof cat & { pillarTitle?: string; pillarDescription?: string }
  const hubData = await getHubData(category)
  const title = hubData?.meta_title || catExt.pillarTitle || `${cat.label} — Блог Натальи Томшиной`
  const description = hubData?.meta_description || catExt.pillarDescription || cat.description
  const canonicalUrl = `${BASE}/blog/${category}/`
  const noIndex = !(hubData?.is_ready && hubData?.is_indexed)
  return {
    title,
    description,
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
    alternates: { canonical: canonicalUrl },
    openGraph: { title, description, url: canonicalUrl, locale: 'ru_RU', type: 'website' },
  }
}

export const revalidate = 60

export default async function BlogCategoryPage(
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params

  if (!isSiloCategory(category)) notFound()
  const cat = SILO_CONFIG[category]
  const catExt = cat as typeof cat & {
    pillarH1?: string; pillarTitle?: string; pillarDescription?: string
    subcategoriesData?: SubcategoryData[]
  }

  const h1 = catExt.pillarH1 ?? cat.label
  const canonicalUrl = `${BASE}/blog/${category}/`
  const isPohudenie = category === 'pohudenie'

  const hubData = await getHubData(category)
  const supabase = createSupabasePublic()
  const isReady = hubData?.is_ready ?? false
  const contentHtml = hubData?.content_html ?? ''
  const splitIdx = contentHtml.indexOf('<!-- SUBCATEGORIES_PLACEHOLDER -->')
  const partBefore = splitIdx >= 0 ? contentHtml.slice(0, splitIdx) : contentHtml
  const partAfter = splitIdx >= 0 ? contentHtml.slice(splitIdx + '<!-- SUBCATEGORIES_PLACEHOLDER -->'.length) : ''

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image_url, published_at, category, subcategory')
    .eq('is_published', true)
    .eq('category', category)
    .order('published_at', { ascending: false })

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': canonicalUrl,
        name: h1,
        description: catExt.pillarDescription ?? cat.description,
        url: canonicalUrl,
        inLanguage: 'ru',
        breadcrumb: { '@id': `${canonicalUrl}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: `${BASE}/` },
          { '@type': 'ListItem', position: 2, name: 'Блог', item: `${BASE}/blog` },
          { '@type': 'ListItem', position: 3, name: cat.label },
        ],
      },
    ],
  }

  const subDataMap = new Map<string, SubcategoryData>(
    (catExt.subcategoriesData ?? []).map(s => [s.slug, s])
  )

  return (
    <div style={{ background: 'var(--color-bg-page)', minHeight: '100vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
      <PublicNav currentPage="/blog" />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 5% 0' }}>
        <Breadcrumbs items={[{ label: 'Главная', href: '/' }, { label: 'Блог', href: '/blog' }, { label: cat.label }]} />
      </div>

      <UnifiedHero
        variant="pillar"
        category={cat.label}
        title={catExt.pillarH1 ?? cat.label}
        excerpt={catExt.pillarDescription ?? cat.description}
      />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 5%' }}>

        {/* Hub pillar content — before subcategories */}
        {isReady && partBefore && (
          <div className="blog-content hub-content" dangerouslySetInnerHTML={{ __html: partBefore }} />
        )}
        {!isReady && (
          <div className="placeholder-block" style={{ marginBottom: 40 }}>
            <h3>✍️ Полный гид в разработке</h3>
            <p>Нутрициолог Наталья Томшина готовит подробный экспертный материал по этой теме для женщин 35–60 лет. Скоро здесь появится полный лонгрид с практическими рекомендациями.</p>
          </div>
        )}

        {/* Subcategory grid — grouped for pohudenie, simple grid for others */}
        {isPohudenie ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40, marginBottom: 48 }}>
            {POHUDENIE_GROUPS.map(group => (
              <div key={group.label}>
                <p style={{
                  fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em',
                  color: 'var(--color-text-secondary)', margin: '0 0 16px',
                }}>
                  {group.label}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
                  {group.slugs.map(slug => {
                    const label = (cat.subcategories as Record<string, string>)[slug]
                    const sub = subDataMap.get(slug)
                    return (
                      <Link key={slug} href={`/blog/${category}/${slug}`} className="subcat-card" data-theme={GROUP_THEMES[group.label] ?? 'green'}>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 110, height: '100%' }}>
                          <div>
                            <p style={{
                              fontFamily: 'var(--font-serif-display)', fontSize: 12, fontWeight: 700,
                              color: 'var(--color-text-primary)', margin: '0 0 6px', lineHeight: 1.4,
                            }}>
                              {sub?.isUsp ? '⭐ ' : ''}{label}
                            </p>
                            {sub?.description && (
                              <p style={{
                                fontSize: 12, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5,
                                overflow: 'hidden', display: '-webkit-box',
                                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                              }}>
                                {sub.description}
                              </p>
                            )}
                          </div>
                          <span style={{ color: 'var(--color-accent)', fontSize: 12, marginTop: 10, display: 'block' }}>Читать →</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16, marginBottom: 48 }}>
            {Object.entries(cat.subcategories).map(([key, label]) => (
              <Link key={key} href={`/blog/${category}/${key}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'var(--color-bg-surface)', border: '1.5px solid var(--color-accent-border)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <p style={{ fontFamily: 'var(--font-serif-display)', fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.4 }}>{label as string}</p>
                  <span style={{ color: 'var(--color-accent)', fontSize: 14, flexShrink: 0 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Hub pillar content — after subcategories */}
        {isReady && partAfter && (
          <div className="blog-content hub-content" dangerouslySetInnerHTML={{ __html: partAfter }} style={{ marginBottom: 48 }} />
        )}

        {/* Articles */}
        {(posts ?? []).length > 0 && (
          <>
            <h2 style={{ fontFamily: 'var(--font-serif-display)', fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 24 }}>Все статьи раздела</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 24 }}>
              {(posts ?? []).map((post: BlogPost) => (
                <Link key={post.id} href={getArticleUrl(post)} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                  <article style={{ background: 'var(--color-bg-surface)', borderRadius: 20, overflow: 'hidden', border: '1.5px solid var(--color-accent-border)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {post.cover_image_url && (
                      <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.cover_image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ padding: '20px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {post.subcategory && (cat.subcategories as Record<string, string>)[post.subcategory] && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8, display: 'block' }}>
                          {(cat.subcategories as Record<string, string>)[post.subcategory]}
                        </span>
                      )}
                      <h2 style={{ fontFamily: 'var(--font-serif-display)', fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 8px', lineHeight: 1.4 }}>{post.title}</h2>
                      {post.excerpt && <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '0 0 16px', lineHeight: 1.6, flex: 1 }}>{post.excerpt}</p>}
                      <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: 0 }}>
                        {post.published_at ? new Date(post.published_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </>
        )}

        <div style={{ maxWidth: 'var(--content-mid)', margin: '48px auto 0' }}>
          <AuthorCard variant="full" />
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
