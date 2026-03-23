'use client'

import { useEffect } from 'react'

export default function GlobalError({
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
          <circle cx="80" cy="80" r="72" fill="#FFF3E6" />
          {/* Cloud with lightning */}
          <ellipse cx="80" cy="74" rx="34" ry="22" fill="white" stroke="#FFD93D" strokeWidth="2"/>
          <ellipse cx="58" cy="82" rx="18" ry="14" fill="white" stroke="#FFD93D" strokeWidth="2"/>
          <ellipse cx="100" cy="80" rx="16" ry="12" fill="white" stroke="#FFD93D" strokeWidth="2"/>
          {/* Lightning bolt */}
          <path d="M84 58 L74 80 H82 L72 102" stroke="#FF9F43" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Stars/sparks */}
          <circle cx="40" cy="52" r="3" fill="#FFD93D"/>
          <circle cx="120" cy="48" r="2" fill="#FF9F43"/>
          <circle cx="32" cy="100" r="2" fill="#FFD93D" opacity="0.6"/>
          <circle cx="126" cy="108" r="3" fill="#FF9F43" opacity="0.5"/>
          {/* Sad face on cloud */}
          <circle cx="72" cy="72" r="2.5" fill="#FF9F43"/>
          <circle cx="88" cy="72" r="2.5" fill="#FF9F43"/>
          <path d="M73 79 Q80 75 87 79" stroke="#FF9F43" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>

        {/* Text */}
        <div className="flex flex-col gap-2">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}
          >
            Что-то пошло не так
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Попробуйте обновить страницу или вернитесь в клуб
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={reset}
            className="w-full flex items-center justify-center py-3.5 rounded-2xl text-white text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
          >
            Обновить страницу
          </button>
          <a
            href="/dashboard"
            className="w-full flex items-center justify-center py-3.5 rounded-2xl text-sm font-semibold transition-colors hover:opacity-80"
            style={{
              background: 'var(--card)',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-nunito)',
            }}
          >
            Вернуться в клуб
          </a>
        </div>

      </div>
    </div>
  )
}
