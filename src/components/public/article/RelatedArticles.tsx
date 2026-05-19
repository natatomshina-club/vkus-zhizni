import Link from 'next/link'
import { getArticleUrl } from '@/lib/silo-config'

interface RelatedPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  category: string | null
  subcategory: string | null
}

interface RelatedArticlesProps {
  posts: RelatedPost[]
}

// Cycling gradient fallbacks for posts without cover images
const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #2D5F3F 0%, #63BA6C 100%)',
  'linear-gradient(135deg, #F77D27 0%, #FFBA7F 100%)',
  'linear-gradient(135deg, #7A95A8 0%, #B8CDD9 100%)',
]

export default function RelatedArticles({ posts }: RelatedArticlesProps) {
  if (posts.length === 0) return null

  return (
    <div style={{ marginTop: 48 }}>
      <div style={{
        fontSize: 12, fontWeight: 700, letterSpacing: '.08em',
        textTransform: 'uppercase', color: 'var(--color-text-secondary)',
        marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
      }}>
        Читайте также
        <span style={{
          flex: 1, height: 1.5,
          background: 'var(--color-accent-border)',
          borderRadius: 2, display: 'block',
        }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {posts.map((post, index) => (
          <Link key={post.id} href={getArticleUrl(post)} style={{ textDecoration: 'none' }}>
            <div
              className="related-article-card"
              style={{
                display: 'flex', gap: 16,
                background: 'var(--color-bg-surface)',
                border: '1.5px solid var(--color-accent-border)',
                borderRadius: 16, padding: 16, alignItems: 'flex-start',
              }}
            >
              <div style={{
                width: 80, height: 60, flexShrink: 0,
                borderRadius: 10, overflow: 'hidden',
                background: FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length],
              }}>
                {post.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 13, fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  margin: '0 0 6px', lineHeight: 1.4,
                }}>
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p style={{
                    fontSize: 12, color: 'var(--color-text-secondary)',
                    margin: 0, lineHeight: 1.5, overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {post.excerpt}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
