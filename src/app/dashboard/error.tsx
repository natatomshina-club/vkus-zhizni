'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)', fontFamily: 'var(--font-nunito)' }}
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center gap-6">

        {/* Illustration */}
        <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="80" cy="80" r="72" fill="#F0EEFF" />
          {/* Broken page/document */}
          <rect x="50" y="38" width="60" height="76" rx="8" fill="white" stroke="#DDD5FF" strokeWidth="2"/>
          {/* Page lines */}
          <line x1="62" y1="56" x2="98" y2="56" stroke="#EDE8FF" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="62" y1="64" x2="90" y2="64" stroke="#EDE8FF" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="62" y1="72" x2="94" y2="72" stroke="#EDE8FF" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Crack / broken line */}
          <path d="M62 82 L74 78 L70 90 L82 86 L78 98 L90 94" stroke="#7C5CFC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2"/>
          {/* Warning badge */}
          <circle cx="100" cy="104" r="18" fill="#7C5CFC"/>
          <text x="100" y="111" textAnchor="middle" fill="white" fontSize="18" fontWeight="700" fontFamily="system-ui">!</text>
          {/* Decorative dots */}
          <circle cx="36" cy="56" r="3" fill="#A8E6CF"/>
          <circle cx="124" cy="44" r="2" fill="#FFD93D"/>
          <circle cx="38" cy="108" r="2" fill="#FF9F43" opacity="0.6"/>
        </svg>

        {/* Text */}
        <div className="flex flex-col gap-2">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}
          >
            Не удалось загрузить страницу
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Попробуйте ещё раз или напишите Наташе,<br />если проблема повторяется
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={reset}
            className="w-full flex items-center justify-center py-3.5 rounded-2xl text-white text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
          >
            Попробовать снова
          </button>
          <a
            href="/dashboard/channel"
            className="w-full flex items-center justify-center py-3.5 rounded-2xl text-sm font-semibold transition-colors hover:opacity-80"
            style={{
              background: 'var(--card)',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-nunito)',
            }}
          >
            ✉️ Написать Наташе
          </a>
        </div>

      </div>
    </div>
  )
}
