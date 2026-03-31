'use client'
import { useState } from 'react'

export default function EmailGate() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/public/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Ошибка')
      setStep('otp')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/public/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Ошибка')
      // Reload page — server will now see the cookie
      window.location.reload()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#FAF8FF',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px',
    }}>
      {/* Logo */}
      <a href="/" style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, color: '#3D2B8A', textDecoration: 'none', marginBottom: 40 }}>
        Вкус<span style={{ color: '#4CAF78' }}>Жизни</span>
      </a>

      <div style={{
        width: '100%', maxWidth: 460,
        background: '#fff', borderRadius: 24,
        border: '1.5px solid #EDE8FF',
        boxShadow: '0 8px 40px rgba(61,43,138,0.08)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #2E1A6E 0%, #3D2B8A 100%)',
          padding: '32px 32px 28px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎁</div>
          <h1 style={{
            fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 700,
            color: '#fff', margin: '0 0 8px',
          }}>
            Бесплатный мини-курс
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            «Волшебный пендель» — 7 уроков Натальи Томшиной
          </p>
        </div>

        <div style={{ padding: '32px' }}>
          {step === 'email' ? (
            <form onSubmit={submitEmail}>
              <p style={{ fontSize: 15, color: '#7B6FAA', marginBottom: 20, margin: '0 0 20px' }}>
                Введите email — мы отправим код для входа. Никакого спама.
              </p>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3D2B8A', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%', padding: '12px 16px',
                  border: '1.5px solid #EDE8FF', borderRadius: 12,
                  fontSize: 15, color: '#3D2B8A',
                  outline: 'none', marginBottom: 16,
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-nunito)',
                }}
              />
              {error && <p style={{ color: '#FF6B6B', fontSize: 13, marginBottom: 12, margin: '0 0 12px' }}>{error}</p>}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  background: '#4CAF78', color: '#fff',
                  fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 600,
                  border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Отправляем...' : 'Получить код →'}
              </button>
              <p style={{ fontSize: 12, color: '#9B8FCC', marginTop: 12, textAlign: 'center', margin: '12px 0 0' }}>
                Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
              </p>
            </form>
          ) : (
            <form onSubmit={submitOtp}>
              <p style={{ fontSize: 15, color: '#7B6FAA', marginBottom: 20, margin: '0 0 20px' }}>
                Мы отправили 6-значный код на <strong style={{ color: '#3D2B8A' }}>{email}</strong>. Проверьте почту (и папку «Спам»).
              </p>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3D2B8A', marginBottom: 6 }}>
                Код подтверждения
              </label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                required
                maxLength={6}
                style={{
                  width: '100%', padding: '14px 16px',
                  border: '1.5px solid #EDE8FF', borderRadius: 12,
                  fontSize: 24, color: '#3D2B8A', letterSpacing: 8,
                  textAlign: 'center', outline: 'none', marginBottom: 16,
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-unbounded)',
                }}
              />
              {error && <p style={{ color: '#FF6B6B', fontSize: 13, marginBottom: 12, margin: '0 0 12px' }}>{error}</p>}
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                style={{
                  width: '100%', padding: '14px',
                  background: '#4CAF78', color: '#fff',
                  fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 600,
                  border: 'none', borderRadius: 12, cursor: (loading || otp.length < 6) ? 'not-allowed' : 'pointer',
                  opacity: (loading || otp.length < 6) ? 0.6 : 1,
                }}
              >
                {loading ? 'Проверяем...' : 'Войти в курс →'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setOtp(''); setError('') }}
                style={{ display: 'block', width: '100%', marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#7B6FAA' }}
              >
                ← Изменить email
              </button>
            </form>
          )}
        </div>
      </div>

      <p style={{ marginTop: 24, fontSize: 13, color: '#9B8FCC', textAlign: 'center' }}>
        Уже есть доступ к клубу?{' '}
        <a href="/auth" style={{ color: '#7C5CFC', textDecoration: 'none', fontWeight: 600 }}>Войти →</a>
      </p>
    </div>
  )
}
