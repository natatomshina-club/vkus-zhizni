'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    ym?: (id: number, action: string, goal: string) => void
  }
}

interface Props {
  buttonVariant?: 'green' | 'orange'
  size?: 'lg' | 'md'
  ymGoal?: string
}

export default function EmailForm({
  buttonVariant = 'green',
  size = 'lg',
  ymGoal = 'free_email_sent',
}: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const btnBg = buttonVariant === 'orange'
    ? 'var(--grad-orange-btn)'
    : 'var(--grad-green-btn, var(--color-green-base))'
  const btnShadow = buttonVariant === 'orange'
    ? '0 4px 20px rgba(247,125,39,0.35)'
    : '0 4px 20px rgba(99,186,108,0.35)'
  const padding = size === 'lg' ? '16px 28px' : '12px 22px'
  const fontSize = size === 'lg' ? 16 : 14

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed.includes('@')) {
      setError('Введите корректный email')
      inputRef.current?.focus()
      return
    }
    setLoading(true)
    setError('')
    try {
      await fetch('/api/public/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      window.ym?.(108262096, 'reachGoal', ymGoal)
      router.push('/free-kurs')
    } catch {
      setError('Не удалось открыть курс. Попробуйте ещё раз.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          ref={inputRef}
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          placeholder="Ваш email"
          required
          style={{
            flex: 1,
            minWidth: 180,
            padding,
            fontFamily: 'var(--font-body)',
            fontSize,
            border: `1.5px solid ${error ? 'var(--color-orange)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-white)',
            color: 'var(--color-ink)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding,
            fontFamily: 'var(--font-body)',
            fontSize,
            fontWeight: 700,
            color: '#fff',
            background: loading ? '#aaa' : btnBg,
            border: 'none',
            borderRadius: 'var(--radius-full)',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: btnShadow,
            whiteSpace: 'nowrap',
            transition: 'opacity 0.15s',
          }}
        >
          {loading ? 'Открываем...' : 'Открыть доступ'}
        </button>
      </div>
      {error && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          color: 'var(--color-orange)',
          margin: 'var(--space-2) 0 0',
        }}>
          {error}
        </p>
      )}
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        color: 'var(--color-ink-soft)',
        margin: 'var(--space-3) 0 0',
        textAlign: 'center',
      }}>
        Если письмо не пришло — проверьте папку «Спам».
      </p>
    </form>
  )
}
