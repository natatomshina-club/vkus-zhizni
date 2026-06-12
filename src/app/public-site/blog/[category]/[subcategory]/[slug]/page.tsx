import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createSupabasePublic } from '@/lib/supabase/public'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import BlogSidebar from '@/components/public/BlogSidebar'
import BlogWidget from '@/components/public/BlogWidget'
import HorizontalBanner from '@/components/public/HorizontalBanner'
import { UnifiedHero } from '@/components/public/article/UnifiedHero'
import { AuthorCard } from '@/components/public/article/AuthorCard'
import { Disclaimer } from '@/components/public/article/Disclaimer'
import RelatedArticles from '@/components/public/article/RelatedArticles'
import { selectWidget } from '@/lib/widget-selector'
import { SILO_CONFIG, isSiloCategory, getArticleUrl } from '@/lib/silo-config'

interface BlogPost {
  id: string; slug: string; title: string; excerpt: string | null
  content: string | null; cover_image_url: string | null; published_at: string | null
  updated_at: string | null
  meta_title: string | null; meta_description: string | null
  main_keyword?: string | null; cluster_name?: string | null
  category: string | null; subcategory: string | null; widget_type?: string | null
}

function countWords(html: string | null): number {
  if (!html) return 0
  return html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
}

interface FaqItem { question: string; answer: string }
function parseFaq(html: string | null): FaqItem[] {
  if (!html) return []
  const blockMatch = html.match(/<div[^>]+class="[^"]*faq-block[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<(?!div)|$)/i)
  if (!blockMatch) return []
  const block = blockMatch[1]
  const items: FaqItem[] = []
  const itemRe = /<div[^>]+class="[^"]*faq-item[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
  let itemMatch
  while ((itemMatch = itemRe.exec(block)) !== null) {
    const inner = itemMatch[1]
    const qMatch = inner.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i)
    const aMatch = inner.match(/<(?:p|div)[^>]*>([\s\S]*?)<\/(?:p|div)>/i)
    if (qMatch && aMatch) {
      items.push({
        question: qMatch[1].replace(/<[^>]+>/g, '').trim(),
        answer: aMatch[1].replace(/<[^>]+>/g, '').trim(),
      })
    }
  }
  return items
}

async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = createSupabasePublic()
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  return data as BlogPost | null
}

async function getRelatedPosts(post: BlogPost): Promise<BlogPost[]> {
  const supabase = createSupabasePublic()
  const FIELDS = 'id, slug, title, excerpt, cover_image_url, category, subcategory'
  const results: BlogPost[] = []
  const excludeIds = [post.id]

  // Step 1: same subcategory
  if (post.subcategory && results.length < 3) {
    const { data } = await supabase
      .from('blog_posts')
      .select(FIELDS)
      .eq('is_published', true)
      .eq('subcategory', post.subcategory)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('published_at', { ascending: false })
      .limit(3 - results.length)
    for (const p of (data ?? [])) { results.push(p as BlogPost); excludeIds.push(p.id) }
  }

  // Step 2: same category (excluding already found)
  if (post.category && results.length < 3) {
    const { data } = await supabase
      .from('blog_posts')
      .select(FIELDS)
      .eq('is_published', true)
      .eq('category', post.category)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('published_at', { ascending: false })
      .limit(3 - results.length)
    for (const p of (data ?? [])) { results.push(p as BlogPost); excludeIds.push(p.id) }
  }

  // Step 3: any published posts
  if (results.length < 3) {
    const { data } = await supabase
      .from('blog_posts')
      .select(FIELDS)
      .eq('is_published', true)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('published_at', { ascending: false })
      .limit(3 - results.length)
    for (const p of (data ?? [])) { results.push(p as BlogPost) }
  }

  return results
}

export async function generateStaticParams() {
  const supabase = createSupabasePublic()
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, category, subcategory')
    .eq('is_published', true)
    .not('subcategory', 'is', null)

  return (data ?? [])
    .filter((p: { category: string | null; subcategory: string | null }) => p.category && p.subcategory)
    .map((p: { slug: string; category: string; subcategory: string }) => ({
      category: p.category,
      subcategory: p.subcategory,
      slug: p.slug,
    }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string; subcategory: string; slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Статья не найдена' }
  const canonicalUrl = `https://nata-tomshina.ru/blog/${post.category}/${post.subcategory}/${post.slug}/`
  return {
    title: post.meta_title ?? post.title,
    description: post.meta_description ?? post.excerpt ?? undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.meta_title ?? post.title,
      description: post.meta_description ?? post.excerpt ?? undefined,
      url: canonicalUrl,
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      images: post.cover_image_url
        ? [{ url: post.cover_image_url, width: 1200, height: 630, alt: post.title }]
        : undefined,
    },
  }
}

export const revalidate = 60

function calcReadingTime(html: string | null): number {
  if (!html) return 0
  const text = html.replace(/<[^>]+>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export default async function SiloArticlePage(
  { params }: { params: Promise<{ category: string; subcategory: string; slug: string }> }
) {
  const { category, subcategory, slug } = await params

  if (!isSiloCategory(category)) notFound()
  const cat = SILO_CONFIG[category]
  const subLabel = (cat.subcategories as Record<string, string>)[subcategory]

  const post = await getPost(slug)
  if (!post) notFound()

  const relatedPosts = await getRelatedPosts(post)
  const articleUrl = getArticleUrl(post)

  const widgetType = post.widget_type === 'none'
    ? null
    : post.widget_type ?? selectWidget(post.main_keyword ?? '', post.cluster_name ?? post.title)

  const readingTimeMin = calcReadingTime(post.content)
  const wordCount = countWords(post.content)
  const faqItems = parseFaq(post.content)

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Блог', href: '/blog' },
    { label: cat.label, href: `/blog/${category}` },
    ...(subLabel ? [{ label: subLabel, href: `/blog/${category}/${subcategory}` }] : []),
    { label: post.title },
  ]

  return (
    <div style={{ background: 'var(--color-bg-page)', minHeight: '100vh', overflowX: 'hidden', width: '100%' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'BlogPosting',
              headline: post.meta_title ?? post.title,
              description: post.meta_description ?? post.excerpt ?? '',
              image: post.cover_image_url
                ? { '@type': 'ImageObject', url: post.cover_image_url, width: 1200, height: 630 }
                : undefined,
              datePublished: post.published_at ?? '',
              dateModified: post.updated_at ?? post.published_at ?? '',
              wordCount: wordCount || undefined,
              articleSection: post.cluster_name ?? (cat.label || undefined),
              keywords: post.main_keyword ?? undefined,
              inLanguage: 'ru-RU',
              author: {
                '@type': 'Person',
                name: 'Наталья Томшина',
                jobTitle: 'Интегративный нутрициолог',
                url: 'https://nata-tomshina.ru/about',
                image: 'https://nata-tomshina.ru/images/natalia.jpg',
                sameAs: [
                  'https://t.me/NataTomshina',
                  'https://instagram.com/nata.tomshina',
                  'https://youtube.com/@natatomshina',
                ],
              },
              publisher: {
                '@type': 'Organization',
                name: 'Клуб «Вкус Жизни»',
                url: 'https://nata-tomshina.ru',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://nata-tomshina.ru/images/logo.png',
                  width: 240,
                  height: 60,
                },
              },
              mainEntityOfPage: { '@type': 'WebPage', '@id': `https://nata-tomshina.ru${articleUrl}` },
              isPartOf: { '@type': 'Blog', '@id': 'https://nata-tomshina.ru/blog' },
              speakable: {
                '@type': 'SpeakableSpecification',
                cssSelector: ['.article-lede', '.kratko-block'],
              },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: breadcrumbs.map((b, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                name: b.label,
                item: 'href' in b ? `https://nata-tomshina.ru${b.href}` : undefined,
              })),
            },
            ...(faqItems.length > 0 ? [{
              '@type': 'FAQPage',
              mainEntity: faqItems.map(({ question, answer }) => ({
                '@type': 'Question',
                name: question,
                acceptedAnswer: { '@type': 'Answer', text: answer },
              })),
            }] : []),
          ],
        })}}
      />
      <PublicNav currentPage="/blog" />

      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box', width: '100%', overflowX: 'hidden' }}>
        <Breadcrumbs items={breadcrumbs} />
        <HorizontalBanner />

        <div className="blog-two-col" style={{ display: 'grid', gap: 32, alignItems: 'start', marginTop: 32 }}>
          <article>
            <UnifiedHero
              variant="article"
              category={cat.label}
              subcategory={subLabel ?? undefined}
              readingTimeMin={readingTimeMin}
              title={post.title}
              excerpt={post.excerpt}
              authorName="Наталья Томшина"
              authorRole="нутрициолог"
              publishedAt={post.published_at}
              updatedAt={post.updated_at}
            />

            {post.cover_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.cover_image_url}
                alt={post.title}
                style={{ width: '100%', aspectRatio: '1200/630', objectFit: 'cover', borderRadius: 12, marginBottom: 32, display: 'block' }}
                loading="eager"
              />
            )}

            {post.content && (
              <div
                style={{ fontFamily: 'var(--font-nunito)', fontSize: 16, lineHeight: 1.8, color: 'var(--color-text-primary)' }}
                className="blog-content"
                dangerouslySetInnerHTML={{
                  __html: post.content.replace(
                    /https:\/\/club\.nata-tomshina\.ru\/join/g,
                    '/club'
                  ),
                }}
              />
            )}

            {widgetType && <BlogWidget type={widgetType} />}

            <Disclaimer />
            <AuthorCard variant="full" />

            <RelatedArticles posts={relatedPosts} />
          </article>

          <div className="blog-sidebar-sticky" style={{ position: 'sticky', top: 88 }}>
            <BlogSidebar categoryCounts={[]} activeCategory={post.category} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 64 }}><PublicFooter /></div>

    </div>
  )
}
