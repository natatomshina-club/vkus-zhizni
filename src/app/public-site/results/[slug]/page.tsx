import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import PublicNav from '@/components/public/PublicNav'
import PublicFooter from '@/components/public/PublicFooter'
import { createSupabasePublic } from '@/lib/supabase/public'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://byykvsjamtcklwtnjkpf.supabase.co'

/** Service client — no cookies import, safe for SSG/ISR pages */
function createStoryClient() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  const supabase = createSupabasePublic()
  const { data } = await supabase
    .from('results_stories')
    .select('slug')
    .eq('published', true)
  return (data ?? []).map((r: { slug: string }) => ({ slug: r.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const supabase = createStoryClient()
  const { data: story } = await supabase
    .from('results_stories')
    .select('seo_title, seo_description, published')
    .eq('slug', slug)
    .single()

  if (!story) return { title: 'История — Вкус Жизни' }

  const base: Metadata = {
    title: story.seo_title ?? 'История — Вкус Жизни',
    description: story.seo_description ?? undefined,
    alternates: { canonical: `https://nata-tomshina.ru/results/${slug}` },
    openGraph: {
      title: story.seo_title ?? 'История — Вкус Жизни',
      description: story.seo_description ?? undefined,
      url: `https://nata-tomshina.ru/results/${slug}`,
      type: 'article',
    },
  }

  if (!story.published) {
    base.robots = { index: false, follow: false }
  }

  return base
}

interface Story {
  slug: string
  name: string
  age_label: string | null
  metric_main: string | null
  metric_label: string | null
  tag_label: string | null
  photo_before_url: string | null
  photo_after_url: string | null
  summary_quote: string | null
  check_items: string[]
  content_html: string | null
  published: boolean
}

interface RelatedStory {
  id: string
  slug: string
  name: string
  metric_main: string | null
  metric_label: string | null
  tag_label: string | null
  summary_quote: string | null
  check_items: string[]
  photo_before_url: string | null
  photo_after_url: string | null
}

export default async function StoryPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createStoryClient()
  const { data: story } = await supabase
    .from('results_stories')
    .select('slug, name, age_label, metric_main, metric_label, tag_label, photo_before_url, photo_after_url, summary_quote, check_items, content_html, published')
    .eq('slug', slug)
    .single()

  if (!story) notFound()

  const s = story as Story

  const { data: relatedRaw } = await supabase
    .from('results_stories')
    .select('id, slug, name, metric_main, metric_label, tag_label, summary_quote, check_items, photo_before_url, photo_after_url')
    .eq('published', true)
    .neq('slug', slug)

  const relatedStories: RelatedStory[] = ((relatedRaw ?? []) as RelatedStory[])
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)

  return (
    <div className="public-theme st-page">
      <PublicNav />

      <nav className="st-breadcrumbs">
        <Link href="/">Главная</Link>
        <span className="st-breadcrumbs__sep">/</span>
        <Link href="/results">Истории преображения</Link>
        <span className="st-breadcrumbs__sep">/</span>
        <span>{s.metric_main ? `${s.name}, ${s.metric_main} кг` : s.name}</span>
      </nav>

      <section className="st-hero">
        {s.tag_label && (
          <span className="st-hero__tag">{s.tag_label}</span>
        )}
        {s.summary_quote && (
          <blockquote className="st-hero__quote">{s.summary_quote}</blockquote>
        )}
        <div className="st-hero__meta">
          {s.name}{s.age_label ? `, ${s.age_label}` : ''}
        </div>
        {(s.metric_main || s.metric_label) && (
          <div className="st-hero__metric">
            {s.metric_main && (
              <span className="st-hero__result">{s.metric_main}</span>
            )}
            {s.metric_label && (
              <span className="st-hero__result-label">{s.metric_label}</span>
            )}
          </div>
        )}
      </section>

      {(s.photo_before_url || s.photo_after_url) && (
        <div className="st-photos">
          {s.photo_before_url && (
            <div className="st-photos__item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.photo_before_url}
                alt={`${s.name} — до`}
                loading="lazy"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span className="st-photos__label">До</span>
            </div>
          )}
          {s.photo_after_url && (
            <div className="st-photos__item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.photo_after_url}
                alt={`${s.name} — после`}
                loading="lazy"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span className="st-photos__label">После</span>
            </div>
          )}
        </div>
      )}

      {Array.isArray(s.check_items) && s.check_items.length > 0 && (
        <div className="st-results">
          <div className="st-results__title">Результаты</div>
          <ul className="st-results__list">
            {s.check_items.map((item: string, i: number) => (
              <li key={i} className="st-results__item">
                <span className="st-results__check">
                  <svg viewBox="0 0 12 12" aria-hidden="true">
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.content_html && (
        <div
          className="st-body"
          dangerouslySetInnerHTML={{ __html: s.content_html }}
        />
      )}

      {relatedStories.length >= 1 && (
        <section className="st-related">
          <h2 className="st-related__title">Читать другие истории</h2>
          <div className="st-related__grid">
            {relatedStories.map(r => (
              <article key={r.id} className="rs-card">
                {(r.photo_before_url || r.photo_after_url) && (
                  <div className="rs-card__photos">
                    {r.photo_before_url && (
                      <div className="rs-card__photo">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.photo_before_url} alt={`${r.name} — до`} loading="lazy" />
                        <div className="rs-card__photo-label rs-card__photo-label--before">До</div>
                      </div>
                    )}
                    {r.photo_after_url && (
                      <div className="rs-card__photo">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.photo_after_url} alt={`${r.name} — после`} loading="lazy" />
                        <div className="rs-card__photo-label rs-card__photo-label--after">После</div>
                      </div>
                    )}
                  </div>
                )}
                <div className="rs-card__body">
                  <header className="rs-card__header">
                    <div className="rs-card__identity">
                      <h3 className="rs-card__name">{r.name}</h3>
                      {r.tag_label && <span className="rs-card__tag">{r.tag_label}</span>}
                    </div>
                    {(r.metric_main || r.metric_label) && (
                      <div className="rs-card__result">
                        {r.metric_main && <div className="rs-card__result-num">{r.metric_main}</div>}
                        {r.metric_label && <div className="rs-card__result-label">{r.metric_label}</div>}
                      </div>
                    )}
                  </header>
                  {r.summary_quote && (
                    <blockquote className="rs-card__quote">{r.summary_quote}</blockquote>
                  )}
                  {Array.isArray(r.check_items) && r.check_items.length > 0 && (
                    <ul className="rs-card__checks">
                      {r.check_items.map((item, i) => (
                        <li key={i} className="rs-card__check">✓ {item}</li>
                      ))}
                    </ul>
                  )}
                  <Link href={`/results/${r.slug}`} className="rs-card__more">
                    Читать историю полностью →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="st-back">
        <Link href="/results" className="st-back__link">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Все истории
        </Link>
      </div>

      <PublicFooter />
    </div>
  )
}
