'use client'

import { useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function VerifyForm() {
  const router = useRouter()
  const params = useSearchParams()
  const email = params.get('email') ?? ''

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)
    if (digit && index < 5) inputs.current[index + 1]?.focus()
    if (next.every(d => d) && next.join('').length === 6) {
      submitOtp(next.join(''))
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  async function submitOtp(code: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/partner/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Неверный код')
        setOtp(['', '', '', '', '', ''])
        inputs.current[0]?.focus()
        return
      }
      router.replace('/partner/dashboard')
    } catch {
      setError('Ошибка подключения. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#FAF8FF', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0EEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 16px' }}>📬</div>
              <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, color: '#3D2B8A', margin: '0 0 8px' }}>Введите код</h1>
              <p style={{ fontSize: 14, color: '#7B6FAA', margin: 0, lineHeight: 1.55 }}>
                Отправили 6-значный код на<br />
                <strong style={{ color: '#3D2B8A' }}>{email}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  disabled={loading}
                  style={{
                    width: 48, height: 56, textAlign: 'center',
                    fontFamily: 'var(--font-unbounded)', fontSize: 22, fontWeight: 700,
                    color: '#2D1F6E', background: digit ? '#F0EEFF' : '#FAF8FF',
                    border: `2px solid ${digit ? '#7C5CFC' : '#EDE8FF'}`,
                    borderRadius: 12, outline: 'none',
                  }}
                />
              ))}
            </div>

            {error && (
              <p style={{ fontSize: 13, color: '#CC3333', textAlign: 'center', margin: '0 0 14px' }}>{error}</p>
            )}

            {loading && (
              <p style={{ textAlign: 'center', fontSize: 14, color: '#7B6FAA' }}>Проверяем…</p>
            )}

            <p style={{ textAlign: 'center', fontSize: 13, color: '#9B8FCC', marginTop: 16 }}>
              Нет письма?{' '}
              <Link href="/partner/login" style={{ color: '#7C5CFC', fontWeight: 600, textDecoration: 'none' }}>
                Запросить снова
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PartnerVerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  )
}
