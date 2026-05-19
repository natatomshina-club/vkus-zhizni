'use client'

import { useRouter } from 'next/navigation'

export default function BackButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      style={{
        fontSize: 13, color: '#7B6FAA', background: '#F0EEFF',
        border: 'none', borderRadius: 10, padding: '6px 12px',
        cursor: 'pointer', fontFamily: 'var(--font-nunito)', display: 'inline-block', marginBottom: 24,
      }}
    >
      ← Назад
    </button>
  )
}
