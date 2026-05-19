'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function FavoritesStat({ dbCount }: { dbCount: number }) {
  const [total, setTotal] = useState(dbCount)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('saved_sauces')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) setTotal(dbCount + parsed.length)
    } catch {}
  }, [dbCount])

  return (
    <Link
      href="/dashboard/favorites"
      className="rounded-2xl p-4 block transition-transform active:scale-95"
      style={{ background: 'var(--ora)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none">🍳</span>
        <span
          className="px-2 py-0.5 rounded-lg font-bold"
          style={{
            background: 'rgba(255,255,255,0.2)', color: '#fff',
            fontFamily: 'var(--font-unbounded)',
            fontSize: 'clamp(10px, 3vw, 14px)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: '100%', display: 'block',
          }}
        >
          {total}
        </span>
      </div>
      <p className="text-xs mt-2.5 font-medium" style={{ color: '#fff', opacity: 0.8, fontFamily: 'var(--font-nunito)' }}>
        рецептов
      </p>
    </Link>
  )
}
