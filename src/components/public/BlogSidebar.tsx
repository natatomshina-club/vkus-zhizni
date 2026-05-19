'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BLOG_CATEGORIES } from '@/lib/blog-categories'

type LeadStep = 'email' | 'otp' | 'success'

function LeadMagnetBanner() {
  const [step, setStep] = useState<LeadStep>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submitEmail() {
    if (!email.includes('@')) { setError('Введите корректный email'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/public/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Ошибка'); return }
      setStep('otp')
    } catch { setError('Ошибка сети') }
    finally { setLoading(false) }
  }

  async function submitOtp() {
    if (otp.length < 4) { setError('Введите код'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/public/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Неверный код'); return }
      setStep('success')
    } catch { setError('Ошибка сети') }
    finally { setLoading(false) }
  }

  const inp: React.CSSProperties = { width: '100%', border: '1.5px solid var(--color-accent-border)', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--font-nunito)', fontSize: 14, color: 'var(--color-text-primary)', background: 'var(--color-bg-page)', outline: 'none' }
  const btn: React.CSSProperties = { display: 'block', width: '100%', background: 'var(--color-bg-dark)', color: 'var(--color-hero-text)', fontFamily: 'var(--font-unbounded)', fontSize: 12, fontWeight: 700, padding: 11, borderRadius: 10, textAlign: 'center', border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1 }

  return (
    <div style={{ background: 'var(--color-bg-surface)', border: '1.5px solid var(--color-accent-border)', borderRadius: 16, padding: '22px 20px' }}>
      <span style={{ fontSize: 28, marginBottom: 10, display: 'block' }}>🎁</span>
      <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.3, marginBottom: 8 }}>Бесплатный мини-курс</div>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.55, marginBottom: 14 }}>«Волшебный пендель» — 7 уроков о том, почему диеты не работают и что делать прямо завтра</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {['Объяснение про инсулин и грелин', 'Волшебный завтрак — рецепт', 'Пример рациона на неделю'].map(item => (
          <div key={item} style={{ fontSize: 12, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
            <span style={{ color: 'var(--color-cta-bg)', fontWeight: 700, flexShrink: 0 }}>✓</span>{item}
          </div>
        ))}
      </div>

      {step === 'email' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input type="email" style={inp} placeholder="Ваш email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitEmail()} />
          {error && <div style={{ fontSize: 12, color: 'var(--color-error-text)' }}>{error}</div>}
          <button style={btn} onClick={submitEmail} disabled={loading}>{loading ? 'Отправляем...' : 'Получить бесплатно →'}</button>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textAlign: 'center' }}>Без спама · Отписка в 1 клик</div>
        </div>
      )}
      {step === 'otp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Код отправлен на <strong style={{ color: 'var(--color-text-primary)' }}>{email}</strong></div>
          <input type="text" style={{ ...inp, letterSpacing: 8, fontSize: 20, textAlign: 'center' }} placeholder="_ _ _ _ _ _" value={otp} maxLength={6} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} onKeyDown={e => e.key === 'Enter' && submitOtp()} />
          {error && <div style={{ fontSize: 12, color: 'var(--color-error-text)' }}>{error}</div>}
          <button style={btn} onClick={submitOtp} disabled={loading}>{loading ? 'Проверяем...' : 'Получить доступ →'}</button>
          <button style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setStep('email'); setError('') }}>Изменить email</button>
        </div>
      )}
      {step === 'success' && (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
          <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>Доступ открыт!</div>
          <a href="/free" style={{ display: 'block', background: 'var(--color-cta-bg)', color: 'var(--color-hero-text)', fontFamily: 'var(--font-unbounded)', fontSize: 12, fontWeight: 700, padding: 11, borderRadius: 10, textDecoration: 'none', textAlign: 'center' }}>Перейти к урокам →</a>
        </div>
      )}
    </div>
  )
}

function MarathonBanner() {
  return (
    <div style={{ background: 'linear-gradient(135deg, var(--color-accent-forest) 0%, var(--color-cta-bg) 100%)', borderRadius: 16, padding: '20px 20px' }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>🏃</div>
      <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700, color: 'var(--color-hero-text)', lineHeight: 1.25, marginBottom: 4 }}>Марафон апреля</div>
      <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 12, fontWeight: 600, color: 'rgba(var(--color-white-rgb),.85)', lineHeight: 1.3, marginBottom: 8 }}>«Снижаем инсулин»</div>
      <div style={{ fontSize: 12, color: 'rgba(var(--color-white-rgb),.7)', marginBottom: 16 }}>Старт: 1 апреля · 14 дней</div>
      <Link href="/marathon" style={{ display: 'block', background: 'var(--color-bg-surface)', color: 'var(--color-accent-forest)', fontFamily: 'var(--font-unbounded)', fontSize: 12, fontWeight: 700, padding: '10px', borderRadius: 10, textDecoration: 'none', textAlign: 'center' }}>
        Узнать подробнее →
      </Link>
    </div>
  )
}

interface CategoryCount { category: string; count: number }

interface BlogSidebarProps {
  categoryCounts?: CategoryCount[]
  activeCategory?: string | null
}

export default function BlogSidebar({ categoryCounts = [], activeCategory }: BlogSidebarProps) {
  const [showLeadFirst] = useState(() => Math.random() > 0.5)

  const banners = showLeadFirst
    ? [<LeadMagnetBanner key="lead" />, <MarathonBanner key="marathon" />]
    : [<MarathonBanner key="marathon" />, <LeadMagnetBanner key="lead" />]

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {banners}

      {/* Rubricator */}
      <div style={{ background: 'var(--color-bg-surface)', border: '1.5px solid var(--color-accent-border)', borderRadius: 16, padding: '20px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-text-secondary)', marginBottom: 14 }}>Рубрики</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {BLOG_CATEGORIES.map(({ value, label }) => {
            const count = categoryCounts.find(c => c.category === value)?.count ?? 0
            const isActive = activeCategory === value
            return (
              <Link
                key={value}
                href={`/blog?category=${value}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 10, textDecoration: 'none', background: isActive ? 'var(--color-accent-border)' : 'transparent', transition: '.15s' }}
              >
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>{label}</span>
                {count > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }}>{count}</span>}
              </Link>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
