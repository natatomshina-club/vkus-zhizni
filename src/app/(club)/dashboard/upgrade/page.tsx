'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Script from 'next/script'

const PLANS = [
  {
    id: 'month' as const,
    name: 'Месяц',
    price: 1500,
    priceLabel: '1 500',
    period: '₽ в месяц · автопродление',
    save: ' ',
    badge: '⭐ Популярный',
    featured: true,
    items: [
      'Все материалы клуба',
      'Марафоны включены',
      'Вебинары',
      'Медитации',
      'Личные вопросы Наташе',
      'Умная кухня (10 запросов/день)',
    ],
    btn: 'Оформить на месяц — 1 500 ₽',
  },
  {
    id: 'halfyear' as const,
    name: '💎 Полгода',
    price: 6000,
    priceLabel: '6 000',
    period: '₽ за 6 месяцев',
    save: 'Экономия 3 000 ₽',
    badge: null,
    featured: false,
    items: [
      'Всё из тарифа «Месяц»',
      '6 марафонов',
      'Приоритет в чате',
      'Вебинары и курсы (на выбор)',
    ],
    btn: 'Оформить на полгода — 6 000 ₽',
  },
]

const RECURRENT: Record<string, { period: number; interval: string; amount: number }> = {
  month: { period: 1, interval: 'Month', amount: 1500 },
}

export default function UpgradePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email)
      setLoading(false)
    })
  }, [])

  function startPayment(planId: 'month' | 'halfyear') {
    if (!email) return
    const plan = PLANS.find(p => p.id === planId)!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const widget = new (window as any).cp.CloudPayments()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: any = {
      publicTerminalId: process.env.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID,
      description: 'Доступ в клуб «Вкус Жизни»',
      amount: plan.price,
      currency: 'RUB',
      paymentSchema: 'Single',
      culture: 'ru-RU',
      skin: 'modern',
      autoClose: 3,
      successRedirectUrl: `https://club.nata-tomshina.ru/auth?email=${encodeURIComponent(email)}&from=payment`,
      failRedirectUrl: 'https://club.nata-tomshina.ru/dashboard/upgrade?error=true',
      userInfo: { accountId: email, email },
      metadata: { plan: planId },
    }
    if (RECURRENT[planId]) params.recurrent = RECURRENT[planId]
    widget.start(params)
  }

  return (
    <>
      <Script src="https://widget.cloudpayments.ru/bundles/cloudpayments.js" strategy="afterInteractive" />

      <div style={{
        maxWidth: 680, margin: '0 auto',
        padding: '24px 16px 96px',
        fontFamily: 'var(--font-nunito)',
      }}>
        {/* Header */}
        <button
          onClick={() => router.back()}
          style={{
            background: '#F0EEFF', border: 'none', borderRadius: 10,
            padding: '7px 14px', fontSize: 13, color: 'var(--muted)',
            cursor: 'pointer', marginBottom: 20, fontFamily: 'var(--font-nunito)',
          }}
        >
          ← Назад
        </button>

        <h1 style={{
          fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 800,
          color: 'var(--text)', marginBottom: 6,
        }}>
          Полный доступ
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>
          Выберите тариф — оплата прямо здесь
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
            Загрузка...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PLANS.map(plan => (
              <div
                key={plan.id}
                style={{
                  background: '#fff',
                  border: `2px solid ${plan.featured ? 'var(--pur)' : '#EDE8FF'}`,
                  borderRadius: 24, overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: 16, right: 16,
                    background: 'var(--pur)', color: '#fff',
                    fontSize: 11, fontWeight: 700,
                    padding: '4px 12px', borderRadius: 20,
                  }}>
                    {plan.badge}
                  </div>
                )}

                <div style={{
                  background: plan.featured ? 'linear-gradient(135deg, var(--pur) 0%, #9B7CFF 100%)' : 'var(--bg)',
                  padding: '20px 22px',
                }}>
                  <p style={{
                    fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: plan.featured ? 'rgba(255,255,255,0.7)' : 'var(--muted)',
                    margin: '0 0 6px',
                  }}>
                    {plan.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                    <span style={{
                      fontFamily: 'var(--font-unbounded)', fontSize: 36, fontWeight: 800,
                      color: plan.featured ? '#fff' : 'var(--text)', lineHeight: 1,
                    }}>
                      {plan.priceLabel}
                    </span>
                    <span style={{ fontSize: 14, color: plan.featured ? 'rgba(255,255,255,0.7)' : 'var(--muted)' }}>
                      ₽
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: plan.featured ? 'rgba(255,255,255,0.65)' : 'var(--muted)', margin: '0 0 2px' }}>
                    {plan.period}
                  </p>
                  {plan.save.trim() && (
                    <p style={{
                      fontSize: 12, fontWeight: 700,
                      color: plan.featured ? '#A8E6CF' : '#2D6A4F',
                      margin: 0,
                    }}>
                      {plan.save}
                    </p>
                  )}
                </div>

                <div style={{ padding: '16px 22px 20px' }}>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 18px' }}>
                    {plan.items.map(item => (
                      <li key={item} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        fontSize: 13, color: 'var(--text)',
                        padding: '5px 0',
                        borderBottom: '1px solid var(--border)',
                      }}>
                        <span style={{ color: '#2D6A4F', fontWeight: 700, flexShrink: 0 }}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => startPayment(plan.id)}
                    disabled={!email}
                    style={{
                      width: '100%',
                      background: plan.featured
                        ? 'linear-gradient(135deg, var(--pur) 0%, #9B7CFF 100%)'
                        : 'linear-gradient(135deg, #2A9D5C 0%, #52C98D 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 14,
                      padding: '14px',
                      fontSize: 14, fontWeight: 800,
                      cursor: email ? 'pointer' : 'not-allowed',
                      opacity: email ? 1 : 0.6,
                      fontFamily: 'var(--font-nunito)',
                    }}
                  >
                    {plan.btn}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p style={{
          textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 20,
        }}>
          Email для доступа: <strong>{email || '...'}</strong>
          <br />
          Оплачивая, вы соглашаетесь с{' '}
          <a href="/legal/oferta" style={{ color: 'var(--pur)' }}>офертой</a>
        </p>
      </div>
    </>
  )
}
