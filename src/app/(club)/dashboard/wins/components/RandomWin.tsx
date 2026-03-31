'use client'

import { useState, useEffect } from 'react'
import type { Win } from './WinFeed'

interface Props {
  wins: Win[]
}

export default function RandomWin({ wins }: Props) {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (wins.length > 0) {
      setIdx(Math.floor(Math.random() * wins.length))
    }
  }, [wins.length])

  if (wins.length === 0) return null

  const win = wins[idx % wins.length]

  function next() {
    setVisible(false)
    setTimeout(() => {
      setIdx(i => (i + 1) % wins.length)
      setVisible(true)
    }, 180)
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #FFD93D, #FFC107)', borderRadius: 18, padding: 16 }}>
      <p style={{ color: '#5C4200', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, fontFamily: 'var(--font-nunito)' }}>
        Помнишь как ты...
      </p>

      <div style={{ transition: 'opacity 180ms ease', opacity: visible ? 1 : 0, minHeight: 48 }}>
        <p style={{ color: '#5C4200', fontSize: 15, fontWeight: 800, lineHeight: 1.5, fontFamily: 'var(--font-nunito)' }}>
          «{win.result}»
        </p>
      </div>

      <button
        type="button"
        onClick={next}
        disabled={wins.length < 2}
        className="mt-3 disabled:opacity-30"
        style={{
          background: 'rgba(0,0,0,0.10)',
          border: 'none',
          borderRadius: 9,
          padding: '7px 14px',
          fontSize: 12,
          fontWeight: 700,
          color: '#5C4200',
          cursor: 'pointer',
          fontFamily: 'var(--font-nunito)',
          touchAction: 'manipulation',
        }}
      >
        🔄 Другая победа
      </button>
    </div>
  )
}
