import Link from 'next/link'
import type { SubcategoryData } from '@/lib/silo-config'

interface Props {
  current: string
  category: string
  allSubcategoriesData: SubcategoryData[]
}

export default function RelatedSubcategories({ current, category, allSubcategoriesData }: Props) {
  const currentData = allSubcategoriesData.find(s => s.slug === current)
  if (!currentData || currentData.relatedSubcategories.length === 0) return null

  const related = currentData.relatedSubcategories
    .map(slug => allSubcategoriesData.find(s => s.slug === slug))
    .filter((s): s is SubcategoryData => s !== undefined)
    .slice(0, 4)

  if (related.length === 0) return null

  return (
    <div style={{ marginTop: 48 }}>
      <div style={{
        fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
        color: 'var(--color-text-secondary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
      }}>
        Читайте также в разделе Похудение
        <span style={{ flex: 1, height: 1.5, background: 'var(--color-accent-border)', borderRadius: 2, display: 'block' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {related.map(sub => (
          <Link
            key={sub.slug}
            href={`/blog/${category}/${sub.slug}`}
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              background: 'var(--color-bg-surface)', border: '1.5px solid var(--color-accent-border)', borderRadius: 16,
              padding: '16px 20px', transition: 'border-color 0.2s',
            }}>
              <p style={{
                fontFamily: 'var(--font-unbounded)', fontSize: 13, fontWeight: 700,
                color: 'var(--color-text-primary)', margin: '0 0 6px', lineHeight: 1.4,
              }}>
                {sub.title}
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
                {sub.description}
              </p>
              <p style={{ fontSize: 11, color: 'var(--color-accent)', margin: 0, fontWeight: 700 }}>
                Читать →
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
