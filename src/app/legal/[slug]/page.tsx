import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LEGAL_DOCS, type LegalDocKey } from '@/lib/legal'

export function generateStaticParams() {
  return Object.keys(LEGAL_DOCS).map(slug => ({ slug }))
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = LEGAL_DOCS[slug as LegalDocKey]
  if (!doc) notFound()

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#FAF8FF',
      fontFamily: 'var(--font-nunito)',
      padding: '24px 16px 48px',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Link
          href="/"
          style={{
            display: 'inline-block', marginBottom: 20,
            fontSize: 13, color: '#7B6FAA', textDecoration: 'none',
            padding: '8px 14px', borderRadius: 10, background: '#F0EEFF',
          }}
        >
          ← На главную
        </Link>

        <div style={{
          background: '#fff',
          border: '1px solid #EDE8FF',
          borderRadius: 20,
          padding: '28px 24px',
        }}>
          <h1 style={{
            margin: '0 0 20px',
            fontFamily: 'var(--font-unbounded)',
            fontSize: 18,
            fontWeight: 700,
            color: '#2D1F6E',
            lineHeight: 1.35,
          }}>
            {doc.title}
          </h1>

          <div style={{
            fontSize: 14,
            color: '#3D2B8A',
            lineHeight: 1.75,
            whiteSpace: 'pre-wrap',
          }}>
            {doc.content}
          </div>
        </div>
      </div>
    </div>
  )
}
