'use client'

import { useRouter } from 'next/navigation'

function PresentationViewer({ url }: { url: string }) {
  const router = useRouter()
  const proxyUrl = url ? `/api/webinars/presentation?url=${encodeURIComponent(url)}` : ''

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
      </div>

      {proxyUrl && (
        <iframe
          src={proxyUrl}
          style={{ flex: 1, width: '100%', border: 'none', display: 'block' }}
          allow="fullscreen"
        />
      )}
    </div>
  )
}

export default async function PresentationViewerPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>
}) {
  const { url } = await searchParams
  if (!url) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', flexDirection: 'column', gap: 12, fontFamily: 'var(--font-nunito)' }}>
        <span style={{ fontSize: 40 }}>🎬</span>
        <p style={{ fontSize: 15, color: 'var(--muted)' }}>Презентация недоступна</p>
      </div>
    )
  }
  return <PresentationViewer url={url} />
}
