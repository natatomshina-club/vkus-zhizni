import type { MetadataRoute } from 'next'
import { createSupabasePublic } from '@/lib/supabase/public'
import { SILO_CONFIG, getArticleUrl } from '@/lib/silo-config'

const BASE = 'https://nata-tomshina.ru'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = []

  // Static pages
  const staticPages: { path: string; priority: number }[] = [
    { path: '', priority: 1 },
    { path: '/blog', priority: 0.8 },
    { path: '/metabolicheskoe-pohudenie', priority: 0.9 },
    { path: '/club', priority: 0.95 },
    { path: '/results', priority: 0.9 },
    { path: '/obuchenie', priority: 0.6 },
    { path: '/obuchenie/kursy', priority: 0.6 },
  ]
  for (const { path, priority } of staticPages) {
    urls.push({ url: `${BASE}${path}`, changeFrequency: 'weekly', priority })
  }

  // Fetch hub indexing flags from DB
  const supabase2 = createSupabasePublic()
  const { data: hubs } = await supabase2
    .from('blog_hubs')
    .select('category, is_ready, is_indexed')
  const hubMap = new Map<string, { is_ready: boolean; is_indexed: boolean }>(
    (hubs ?? []).map((h: { category: string; is_ready: boolean; is_indexed: boolean }) => [h.category, h])
  )

  // SILO category hubs
  for (const [catKey] of Object.entries(SILO_CONFIG)) {
    const hub = hubMap.get(catKey)
    if (hub?.is_ready && hub?.is_indexed) {
      urls.push({ url: `${BASE}/blog/${catKey}`, changeFrequency: 'weekly', priority: 0.85 })
    }
  }

  // Subcategory hubs — from DB, only is_ready + is_indexed
  const { data: subHubs } = await supabase2
    .from('blog_subcategory_hubs')
    .select('category, subcategory, updated_at')
    .eq('is_ready', true)
    .eq('is_indexed', true)
  for (const h of (subHubs ?? [])) {
    urls.push({ url: `${BASE}/blog/${h.category}/${h.subcategory}`, changeFrequency: 'weekly', priority: 0.8 })
  }

  // Blog articles
  const supabase = createSupabasePublic()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, category, subcategory, published_at')
    .eq('is_published', true)

  for (const post of (posts ?? [])) {
    urls.push({
      url: `${BASE}${getArticleUrl(post)}`,
      lastModified: post.published_at ? new Date(post.published_at) : undefined,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  // Results stories
  const { data: stories } = await supabase
    .from('results_stories')
    .select('slug, updated_at')
    .eq('published', true)

  for (const story of (stories ?? [])) {
    urls.push({
      url: `${BASE}/results/${story.slug}`,
      lastModified: new Date(story.updated_at),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  }

  return urls
}
