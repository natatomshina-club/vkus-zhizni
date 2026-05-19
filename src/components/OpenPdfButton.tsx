'use client'

import { useRouter } from 'next/navigation'

export default function OpenPdfButton({ url }: { url: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(`/dashboard/body/pdf?url=${encodeURIComponent(url)}`)}
      style={{ background: '#F0EEFF', color: '#7C5CFC', fontWeight: 700, fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-nunito)' }}
    >
      Открыть →
    </button>
  )
}
