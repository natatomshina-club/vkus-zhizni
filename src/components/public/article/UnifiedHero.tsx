type Variant = 'article' | 'pillar' | 'hub'

type Props = {
  variant: Variant
  category?: string
  subcategory?: string
  readingTimeMin?: number
  title: string
  excerpt?: string | null
  authorName?: string
  authorRole?: string | null
  publishedAt?: string | null
  updatedAt?: string | null
}

const PILL_LABELS: Record<Variant, string> = {
  article: 'Статья',
  pillar: 'Путеводитель',
  hub: 'Раздел',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function UnifiedHero(props: Props) {
  const showMeta =
    props.variant === 'article' &&
    (Boolean(props.authorName) || Boolean(props.publishedAt))

  return (
    <section className="unified-hero">
      <div className="unified-hero__glow" aria-hidden />

      <div className="unified-hero__inner">
        <div className="article-pill">
          <span>● {PILL_LABELS[props.variant]}</span>
          {props.readingTimeMin ? (
            <>
              <span className="article-pill__sep">·</span>
              <span>{props.readingTimeMin} мин чтения</span>
            </>
          ) : null}
          {props.category ? (
            <>
              <span className="article-pill__sep">•</span>
              <span>{props.category}</span>
            </>
          ) : null}
          {props.subcategory ? (
            <>
              <span className="article-pill__sep">•</span>
              <span>{props.subcategory}</span>
            </>
          ) : null}
        </div>

        <h1
          className="unified-hero__title"
          dangerouslySetInnerHTML={{ __html: props.title }}
        />

        {props.excerpt ? (
          <p className="unified-hero__lead">{props.excerpt}</p>
        ) : null}

        {showMeta ? (
          <div className="unified-hero__meta">
            {props.authorName ? (
              <span className="unified-hero__author">
                {props.authorName}
                {props.authorRole ? `, ${props.authorRole}` : ''}
              </span>
            ) : null}
            {props.publishedAt ? (
              <span className="unified-hero__date">
                {formatDate(props.publishedAt)}
              </span>
            ) : null}
            {props.updatedAt && props.updatedAt !== props.publishedAt ? (
              <span className="unified-hero__updated">
                Обновлено: {formatDate(props.updatedAt)}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  )
}
