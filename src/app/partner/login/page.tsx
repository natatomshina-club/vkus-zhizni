'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function PartnerLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await fetch('/api/partner/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      // Always show "sent" to avoid email enumeration
      setSent(true)
      router.push(`/partner/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`)
    } catch {
      setError('Не удалось отправить код. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#FAF8FF', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Minimal header */}
      <header style={{ background: 'rgba(250,248,255,0.94)', backdropFilter: 'blur(16px)', borderBottom: '1.5px solid #EDE8FF', padding: '14px 5%' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#3D2B8A', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#4CAF78', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🌿</span>
          Вкус Жизни
        </Link>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 5%' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 24, padding: '40px 36px' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0EEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 16px' }}>🤝</div>
              <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 700, color: '#3D2B8A', margin: '0 0 6px' }}>Кабинет партнёра</h1>
              <p style={{ fontSize: 14, color: '#7B6FAA', margin: 0, lineHeight: 1.55 }}>Введите email — пришлём код для входа</p>
            </div>

            {sent ? (
              <p style={{ textAlign: 'center', fontSize: 15, color: '#4CAF78', fontWeight: 600 }}>Код отправлен! Перенаправляем…</p>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Ваш email"
                  style={{ width: '100%', padding: '13px 16px', borderRadius: 12, border: '1.5px solid #EDE8FF', fontSize: 15, color: '#2D1F6E', background: '#FAF8FF', outline: 'none', boxSizing: 'border-box' }}
                />
                {error && <p style={{ fontSize: 13, color: '#CC3333', margin: 0 }}>{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: loading ? '#C4B8FF' : 'linear-gradient(135deg,#7C5CFC,#5B3FA8)', color: '#fff', fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, padding: '15px 24px', borderRadius: 100, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', minHeight: 50 }}
                >
                  {loading ? 'Отправляем…' : 'Получить код →'}
                </button>
              </form>
            )}
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#9B8FCC', marginTop: 20 }}>
            Ещё не партнёр?{' '}
            <Link href="/partner" style={{ color: '#7C5CFC', fontWeight: 600, textDecoration: 'none' }}>Подать заявку →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
