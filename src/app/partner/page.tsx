'use client'

import { useState } from 'react'
import Link from 'next/link'

const STEPS = [
  { num: '01', icon: '🔗', title: 'Получаете ссылку', desc: 'После одобрения заявки вы получите персональную реферальную ссылку вида nata-tomshina.ru/?ref=ваш_код' },
  { num: '02', icon: '📣', title: 'Делитесь с аудиторией', desc: 'Рассказываете про клуб «Вкус Жизни» в блоге, сторис, Telegram-канале или лично друзьям' },
  { num: '03', icon: '💜', title: 'Человек вступает в клуб', desc: 'Новая участница переходит по вашей ссылке и оформляет подписку. Мы автоматически фиксируем реферала' },
  { num: '04', icon: '💸', title: 'Получаете выплату', desc: 'Комиссия начисляется сразу после платежа, выплата 1-го числа каждого месяца на карту' },
]

const ECONOMICS = [
  { event: 'Первый платёж участницы', percent: '20%', example: '300 ₽', note: 'от 1 500 ₽' },
  { event: 'Каждое продление подписки', percent: '10%', example: '150 ₽', note: 'от 1 500 ₽' },
]

export default function PartnerPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [promoText, setPromoText] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) { setError('Необходимо принять условия программы'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/partner/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), promo_text: promoText.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Ошибка отправки заявки'); return }
      setSuccess(true)
    } catch {
      setError('Не удалось отправить заявку. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#FAF8FF', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Minimal header — logo only */}
      <header style={{
        background: 'rgba(250,248,255,0.94)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1.5px solid #EDE8FF',
        padding: '14px 5%',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-unbounded)',
          fontSize: 15,
          fontWeight: 700,
          color: '#3D2B8A',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#4CAF78',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>🌿</span>
          Вкус Жизни
        </Link>
      </header>

      {/* HERO */}
      <section style={{
        background: 'linear-gradient(135deg, #1A0E4E 0%, #3D2B8A 55%, #5B3FA8 100%)',
        padding: '80px 5% 88px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(76,175,120,.07)', top: -200, right: -100, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#7BDFAA', marginBottom: 20 }}>
            <span style={{ display: 'block', width: 24, height: 2, background: '#7BDFAA', borderRadius: 2 }} />
            Партнёрская программа
            <span style={{ display: 'block', width: 24, height: 2, background: '#7BDFAA', borderRadius: 2 }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(26px, 4vw, 48px)', fontWeight: 700, color: '#fff', lineHeight: 1.15, margin: '0 0 20px' }}>
            Зарабатывай, рекомендуя клуб
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,.75)', lineHeight: 1.65, maxWidth: 560, margin: '0 auto 40px' }}>
            Рассказывайте подругам и подписчицам про «Вкус Жизни» — и получайте комиссию с каждой вступившей участницы
          </p>
          {/* Главная цифра */}
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,.1)', border: '1.5px solid rgba(255,255,255,.2)', borderRadius: 24, padding: '28px 48px', backdropFilter: 'blur(12px)' }}>
            <span style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 800, color: '#7BDFAA', lineHeight: 1 }}>300 ₽</span>
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,.7)', marginTop: 8 }}>за каждую новую участницу</span>
          </div>
        </div>
      </section>

      {/* КАК РАБОТАЕТ */}
      <section style={{ padding: '72px 5%' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(20px,3vw,30px)', fontWeight: 700, color: '#3D2B8A', margin: '0 0 48px', textAlign: 'center' }}>
            Как это работает
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {STEPS.map((s) => (
              <div key={s.num} style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 20, padding: '28px 24px', position: 'relative' }}>
                <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 13, fontWeight: 700, color: '#DDD5FF', marginBottom: 12 }}>{s.num}</div>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, color: '#3D2B8A', margin: '0 0 8px', lineHeight: 1.3 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#7B6FAA', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ЭКОНОМИКА */}
      <section style={{ padding: '0 5% 72px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(20px,3vw,30px)', fontWeight: 700, color: '#3D2B8A', margin: '0 0 32px', textAlign: 'center' }}>
            Сколько можно заработать
          </h2>

          {/* Таблица */}
          <div style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 20, overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 0 }}>
              {/* Header */}
              <div style={{ padding: '14px 24px', background: '#F0EEFF', fontFamily: 'var(--font-unbounded)', fontSize: 12, fontWeight: 700, color: '#7C5CFC' }}>Событие</div>
              <div style={{ padding: '14px 24px', background: '#F0EEFF', fontFamily: 'var(--font-unbounded)', fontSize: 12, fontWeight: 700, color: '#7C5CFC', textAlign: 'center' }}>%</div>
              <div style={{ padding: '14px 24px', background: '#F0EEFF', fontFamily: 'var(--font-unbounded)', fontSize: 12, fontWeight: 700, color: '#7C5CFC', textAlign: 'right' }}>Ваш доход</div>
              {/* Rows */}
              {ECONOMICS.map((row, i) => (
                <>
                  <div key={`e-${i}`} style={{ padding: '16px 24px', borderTop: '1px solid #EDE8FF', fontSize: 15, color: '#2D1F6E' }}>
                    {row.event}
                    <span style={{ display: 'block', fontSize: 12, color: '#9B8FCC', marginTop: 2 }}>{row.note}</span>
                  </div>
                  <div key={`p-${i}`} style={{ padding: '16px 24px', borderTop: '1px solid #EDE8FF', textAlign: 'center', fontFamily: 'var(--font-unbounded)', fontSize: 16, fontWeight: 700, color: '#7C5CFC' }}>{row.percent}</div>
                  <div key={`r-${i}`} style={{ padding: '16px 24px', borderTop: '1px solid #EDE8FF', textAlign: 'right', fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, color: '#4CAF78' }}>{row.example}</div>
                </>
              ))}
            </div>
          </div>

          {/* Условия */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { icon: '📅', label: 'Выплаты 1-го числа каждого месяца' },
              { icon: '💳', label: 'Минимальная сумма выплаты — 1 000 ₽' },
              { icon: '♾️', label: 'Комиссия за все продления без ограничений' },
            ].map((c) => (
              <div key={c.label} style={{ background: '#F0EEFF', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{c.icon}</span>
                <span style={{ fontSize: 14, color: '#3D2B8A', lineHeight: 1.5 }}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ФОРМА */}
      <section style={{ padding: '0 5% 96px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ background: '#fff', border: '1.5px solid #EDE8FF', borderRadius: 24, padding: '40px 36px' }}>
            <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 700, color: '#3D2B8A', margin: '0 0 8px', textAlign: 'center' }}>
              Подать заявку
            </h2>
            <p style={{ fontSize: 14, color: '#7B6FAA', textAlign: 'center', margin: '0 0 32px', lineHeight: 1.6 }}>
              Рассматриваем каждую заявку индивидуально. Ответим в течение 2 рабочих дней.
            </p>

            {success ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                <h3 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, color: '#3D2B8A', margin: '0 0 12px' }}>
                  Заявка получена!
                </h3>
                <p style={{ fontSize: 15, color: '#7B6FAA', lineHeight: 1.6, margin: 0 }}>
                  Рассмотрим в течение 2 дней и напишем на почту с дальнейшими инструкциями.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3D2B8A', marginBottom: 6 }}>Имя *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Как вас зовут"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #EDE8FF', fontSize: 15, color: '#2D1F6E', background: '#FAF8FF', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3D2B8A', marginBottom: 6 }}>Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #EDE8FF', fontSize: 15, color: '#2D1F6E', background: '#FAF8FF', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3D2B8A', marginBottom: 6 }}>Как планируете продвигать клуб? *</label>
                  <textarea
                    required
                    value={promoText}
                    onChange={e => setPromoText(e.target.value)}
                    placeholder="Расскажите об аудитории, каналах, формате рекомендаций..."
                    rows={4}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid #EDE8FF', fontSize: 15, color: '#2D1F6E', background: '#FAF8FF', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    style={{ marginTop: 3, flexShrink: 0, accentColor: '#7C5CFC', width: 18, height: 18 }}
                  />
                  <span style={{ fontSize: 13, color: '#7B6FAA', lineHeight: 1.5 }}>
                    Принимаю{' '}
                    <a href="/legal/affiliate" target="_blank" rel="noopener noreferrer" style={{ color: '#7C5CFC', fontWeight: 600, textDecoration: 'underline' }}>
                      условия партнёрской программы
                    </a>
                    {' '}и соглашаюсь на обработку персональных данных
                  </span>
                </label>

                {error && (
                  <div style={{ background: '#FFF0F0', border: '1px solid #FFD0D0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#CC3333' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: loading ? '#C4B8FF' : 'linear-gradient(135deg, #7C5CFC, #5B3FA8)', color: '#fff', fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 700, padding: '16px 24px', borderRadius: 100, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 6px 20px rgba(124,92,252,.35)', minHeight: 52 }}
                >
                  {loading ? 'Отправляем...' : 'Подать заявку →'}
                </button>
              </form>
            )}
          </div>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#9B8FCC', marginTop: 20 }}>
            Уже участник программы?{' '}
            <Link href="/partner/login" style={{ color: '#7C5CFC', fontWeight: 600, textDecoration: 'none' }}>Войти в кабинет →</Link>
          </p>
        </div>
      </section>

    </div>
  )
}
