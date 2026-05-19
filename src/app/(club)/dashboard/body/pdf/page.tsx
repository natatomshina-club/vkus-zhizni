'use client'

import { useRouter } from 'next/navigation'

function PdfViewer({ url }: { url: string }) {
  const router = useRouter()

  const viewerUrl = url
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
    : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', background: '#fff',
        borderBottom: '1px solid #EDE8FF', flexShrink: 0, zIndex: 1,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            fontSize: 13, color: '#7B6FAA', background: '#F0EEFF',
            border: 'none', borderRadius: 10, padding: '6px 12px',
            cursor: 'pointer', fontFamily: 'var(--font-nunito)',
          }}
        >
          ← Назад
        </button>
        {url && (
          <a
            href={url}
            download
            style={{
              fontSize: 13, color: '#C26A00', background: '#FFF5E8',
              borderRadius: 10, padding: '6px 12px',
              textDecoration: 'none', fontFamily: 'var(--font-nunito)', fontWeight: 700,
              marginLeft: 'auto',
            }}
          >
            Скачать ↓
          </a>
        )}
      </div>

      {viewerUrl && (
        <iframe
          src={viewerUrl}
          style={{ flex: 1, width: '100%', border: 'none', display: 'block' }}
        />
      )}
    </div>
  )
}

export default async function PdfViewerPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>
}) {
  const { url } = await searchParams
  if (!url) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', flexDirection: 'column', gap: 12, fontFamily: 'var(--font-nunito)' }}>
        <span style={{ fontSize: 40 }}>📎</span>
        <p style={{ fontSize: 15, color: 'var(--muted)' }}>Файл недоступен</p>
      </div>
    )
  }
  return <PdfViewer url={url} />
}
