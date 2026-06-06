'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Plan = 'trial' | 'month' | 'halfyear'
type Step = 'plan' | 'email' | 'otp'

const PLANS = [
  {
    id: 'trial' as Plan,
    name: '🌱 Попробовать',
    price: '149',
    period: '₽ за 7 дней · полный доступ',
    save: 'Потом 1 500 ₽/мес',
    badge: null,
    featured: false,
    items: ['Вводные курсы', 'Умная кухня с рецептами', 'Дневник питания', 'Трекер замеров', 'Чат для общения'],
    btn: 'Начать за 149 ₽',
  },
  {
    id: 'month' as Plan,
    name: 'Месяц',
    price: '1 500',
    period: '₽ в месяц · автопродление',
    save: ' ',
    badge: '⭐ Популярный',
    featured: true,
    items: ['Всё из тарифа «Пробный»', 'Марафоны включены', 'Вебинары', 'Медитации', 'Личные вопросы Наташе'],
    btn: 'Вступить на месяц',
  },
  {
    id: 'halfyear' as Plan,
    name: '💎 Полгода',
    price: '6 000',
    period: '₽ за 6 месяцев',
    save: 'Экономия 3 000 ₽',
    badge: null,
    featured: false,
    items: ['Всё включено', '6 марафонов', 'Приоритет в чате', 'Вебинары и курсы (на выбор)'],
    btn: 'Вступить на полгода',
  },
]

const PLAN_AMOUNTS: Record<Plan, number> = { trial: 149, month: 1500, halfyear: 6000 }
const PLAN_RECURRENT: Record<Plan, null | { period: number; interval: string; amount: number; startDate?: string }> = {
  trial: {
    period: 1,
    interval: 'Month',
    amount: 1500,
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  month: { period: 1, interval: 'Month', amount: 1500 },
  halfyear: null,
}

function JoinContent() {
  const searchParams = useSearchParams()

  const urlPlan = searchParams.get('plan') as Plan | null
  const validPlans: Plan[] = ['trial', 'month', 'halfyear']
  const initialPlan: Plan = urlPlan && validPlans.includes(urlPlan) ? urlPlan : 'trial'

  const [step, setStep] = useState<Step>('plan')
  const [selectedPlan, setSelectedPlan] = useState<Plan>(initialPlan)
  const [email, setEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [payError, setPayError] = useState('')
  const [code, setCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)
  const [showLoginHint, setShowLoginHint] = useState(false)

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startCountdown() {
    if (countdownRef.current) clearInterval(countdownRef.current)
    setResendCountdown(60)
    countdownRef.current = setInterval(() => {
      setResendCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  // Обработка редиректа после оплаты
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      const emailParam = params.get('email')
      if (emailParam) {
        setEmail(decodeURIComponent(emailParam))
        setStep('otp')
      }
    }
    if (params.get('error') === 'true') {
      setStep('email')
      setPayError('Оплата не прошла. Попробуйте ещё раз.')
    }
  }, [])

  async function handleProceedToPayment(e: React.FormEvent) {
    e.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) return
    setEmailLoading(true)
    setPayError('')

    setEmailLoading(false)

    // Open CloudPayments widget
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const widget = new (window as any).cp.CloudPayments()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const intentParams: any = {
      publicTerminalId: process.env.NEXT_PUBLIC_CLOUDPAYMENTS_PUBLIC_ID,
      description: 'Доступ в клуб «Вкус Жизни»',
      amount: PLAN_AMOUNTS[selectedPlan],
      currency: 'RUB',
      paymentSchema: 'Single',
      culture: 'ru-RU',
      skin: 'modern',
      autoClose: 3,
      successRedirectUrl: `https://club.nata-tomshina.ru/auth?email=${encodeURIComponent(trimmedEmail)}&from=payment`,
      failRedirectUrl: `${window.location.origin}/join?error=true`,
      userInfo: {
        accountId: trimmedEmail,
        email: trimmedEmail,
      },
      metadata: { plan: selectedPlan },
    }

    // Read ref_code from cookie and save to server before opening widget
    const refCode = document.cookie.split('; ').find(r => r.startsWith('ref_code='))?.split('=')[1] ?? null
    console.log('[join] ref_code from cookie:', refCode)
    if (refCode) {
      await fetch('/api/join/save-ref', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, ref_code: refCode }),
      }).catch(() => null)
      console.log('[join] ref_code saved to server for:', trimmedEmail)
    }

    if (PLAN_RECURRENT[selectedPlan]) {
      intentParams.recurrent = PLAN_RECURRENT[selectedPlan]
    }

    widget.start(intentParams)
    setTimeout(() => setShowLoginHint(true), 4000)
  }

  async function handleVerifyOtp(token: string) {
    if (token.length < 6) return
    setOtpLoading(true)
    setOtpError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: 'email',
      })
      if (error) {
        setOtpError('Неверный код. Проверьте и попробуйте снова.')
        setCode('')
      } else {
        window.location.href = 'https://club.nata-tomshina.ru/dashboard'
      }
    } finally {
      setOtpLoading(false)
    }
  }

  function handleCodeChange(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
    if (otpError) setOtpError('')
    if (digits.length === 6) handleVerifyOtp(digits)
  }

  async function handleResendOtp() {
    if (resendCountdown > 0 || resendLoading) return
    setResendLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    })
    setResendLoading(false)
    startCountdown()
  }

  const planData = PLANS.find(p => p.id === selectedPlan)!

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #1A0E4E 0%, #3D2B8A 60%, #5B3FA8 100%)',
      fontFamily: 'var(--font-nunito)',
      padding: '48px 16px 80px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <a href="https://nata-tomshina.ru" style={{ textDecoration: 'none' }}>
          <p style={{ fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
            Вкус Жизни
          </p>
        </a>
        <div style={{
          display: 'inline-block', background: 'rgba(124,223,170,0.15)',
          border: '1px solid rgba(124,223,170,0.3)', color: '#7BDFAA',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          padding: '5px 16px', borderRadius: 100, marginTop: 8,
        }}>
          ВСТУПЛЕНИЕ В КЛУБ
        </div>
      </div>

      {/* Progress indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
        {(['plan', 'email', 'otp'] as Step[]).map((s, i) => (
          <div key={s} style={{
            width: step === s ? 28 : 8, height: 8, borderRadius: 4,
            background: step === s ? '#7BDFAA' : (
              ['plan', 'email', 'otp'].indexOf(step) > i ? 'rgba(124,223,170,0.5)' : 'rgba(255,255,255,0.2)'
            ),
            transition: 'all 0.3s',
          }} />
        ))}
      </div>

      {/* ── STEP 1: Plan selection ── */}
      {step === 'plan' && (
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h1 style={{
            fontFamily: 'var(--font-unbounded)', fontSize: 'clamp(20px,3.5vw,30px)',
            fontWeight: 700, color: '#fff', textAlign: 'center', margin: '0 0 8px',
          }}>
            Выбери свой формат
          </h1>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 15, margin: '0 0 32px' }}>
            Начните свой путь к здоровью и лёгкости
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}
            className="join-cards">
            {PLANS.map(plan => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                style={{
                  background: plan.featured ? '#fff' : 'rgba(255,255,255,0.08)',
                  border: selectedPlan === plan.id
                    ? `2px solid #7BDFAA`
                    : `1.5px solid ${plan.featured ? '#fff' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 28, padding: '28px 24px', position: 'relative',
                  textAlign: 'center', cursor: 'pointer',
                  transform: plan.featured ? 'scale(1.04)' : 'none',
                  transition: 'border-color 0.15s',
                  boxSizing: 'border-box' as const,
                }}
              >
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: '#4CAF78', color: '#fff', padding: '5px 18px', borderRadius: 16,
                    fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                  }}>{plan.badge}</div>
                )}
                {selectedPlan === plan.id && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#7BDFAA', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: '#1A0E4E', fontWeight: 800,
                  }}>✓</div>
                )}
                <p style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
                  color: plan.featured ? '#7B6FAA' : 'rgba(255,255,255,0.4)', margin: '0 0 10px',
                }}>{plan.name}</p>
                <p style={{
                  fontFamily: 'var(--font-unbounded)', fontSize: 40, fontWeight: 700,
                  color: plan.featured ? '#3D2B8A' : '#fff', lineHeight: 1, margin: '0 0 4px',
                }}>{plan.price}</p>
                <p style={{ fontSize: 12, color: plan.featured ? '#7B6FAA' : 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>{plan.period}</p>
                <p style={{
                  fontSize: 12, fontWeight: 600,
                  color: plan.featured ? '#2E7D50' : '#7BDFAA',
                  margin: '0 0 16px', minHeight: 18,
                }}>{plan.save}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left' }}>
                  {plan.items.map(item => (
                    <li key={item} style={{
                      fontSize: 12, color: plan.featured ? '#1A1230' : 'rgba(255,255,255,0.7)',
                      padding: '5px 0', borderBottom: `1px solid ${plan.featured ? '#EDE8FF' : 'rgba(255,255,255,0.07)'}`,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ color: '#4CAF78', fontWeight: 700, flexShrink: 0 }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={e => { e.stopPropagation(); setSelectedPlan(plan.id); setStep('email') }}
                  style={{
                    marginTop: 20, width: '100%', padding: '13px',
                    background: plan.id === 'trial' ? '#4CAF78' : '#7C5CFC',
                    color: '#fff', border: 'none', borderRadius: 14,
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'var(--font-nunito)',
                  }}
                >
                  {plan.id === 'trial' ? 'Начать за 149 ₽ →' : plan.id === 'month' ? 'Оформить за 1 500 ₽ →' : 'Оформить за 6 000 ₽ →'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 2: Email ── */}
      {step === 'email' && (
        <div style={{ maxWidth: 440, margin: '0 auto' }}>
          {/* Selected plan summary */}
          <div style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 16, padding: '14px 20px', marginBottom: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Выбранный тариф</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                {planData.name} — {planData.price} {planData.period.split(' ')[0]}
              </div>
            </div>
            <button
              onClick={() => setStep('plan')}
              style={{
                background: 'none', border: 'none', color: '#7BDFAA',
                fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-nunito)',
                textDecoration: 'underline',
              }}
            >
              Изменить
            </button>
          </div>

          {/* «Уже оплатили?» — появляется через 4 сек, выше формы */}
          {showLoginHint && <div style={{
            background: 'rgba(124,223,170,0.12)',
            border: '1.5px solid rgba(124,223,170,0.35)',
            borderRadius: 20,
            padding: '18px 22px',
            textAlign: 'center',
            marginBottom: 16,
          }}>
            <p style={{ fontSize: 14, color: '#7BDFAA', fontWeight: 600, margin: '0 0 10px' }}>
              ✅ Уже оплатили?
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 14px', lineHeight: 1.5 }}>
              Код для входа отправлен на вашу почту.
            </p>
            <a
              href={`https://club.nata-tomshina.ru/auth${email ? `?email=${encodeURIComponent(email.trim().toLowerCase())}&from=payment` : ''}`}
              style={{
                display: 'inline-block',
                background: '#4CAF78',
                color: '#fff',
                borderRadius: 100,
                padding: '11px 28px',
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                fontFamily: 'var(--font-nunito)',
              }}
            >
              Войти в клуб →
            </a>
          </div>}

          <div style={{
            background: '#fff', borderRadius: 28, padding: '32px 28px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700,
              color: '#3D2B8A', margin: '0 0 8px',
            }}>
              Укажите email для доступа
            </h2>
            <div style={{
              background: '#FFF8E1', border: '1.5px solid #FFD54F',
              borderRadius: 12, padding: '12px 16px', marginBottom: 20,
              fontSize: 13, color: '#5C3D00', lineHeight: 1.6,
            }}>
              ⚠️ <strong>Важно:</strong> введите правильный email — на него придёт
              код для входа в клуб сразу после оплаты
            </div>

            <form onSubmit={handleProceedToPayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setPayError('') }}
                required
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: 14,
                  border: '1.5px solid #EDE8FF', outline: 'none',
                  fontSize: 15, color: '#2D1F6E', background: '#FAF8FF',
                  boxSizing: 'border-box' as const, fontFamily: 'var(--font-nunito)',
                }}
              />
              {payError && (
                <p style={{ color: '#E53E3E', fontSize: 13, margin: 0 }}>{payError}</p>
              )}
              <button
                type="submit"
                disabled={emailLoading || !email}
                style={{
                  background: '#4CAF78', color: '#fff', border: 'none',
                  borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 700,
                  cursor: emailLoading ? 'not-allowed' : 'pointer', opacity: emailLoading ? 0.7 : 1,
                  fontFamily: 'var(--font-nunito)',
                }}
              >
                {emailLoading ? 'Загружаем...' : `Перейти к оплате ${planData.price} ₽ →`}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 16 }}>
            Оплачивая, вы соглашаетесь с условиями{' '}
            <a href="/legal/oferta" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}>
              оферты
            </a>
          </p>

        </div>
      )}

      {/* ── STEP 3: OTP after payment ── */}
      {step === 'otp' && (
        <div style={{ maxWidth: 440, margin: '0 auto' }}>
          <div style={{
            background: '#fff', borderRadius: 28, padding: '36px 28px', textAlign: 'center',
          }}>
            <>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <h2 style={{
                  fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700,
                  color: '#2D6A4F', margin: '0 0 8px',
                }}>
                  Оплата прошла успешно!
                </h2>
                <p style={{ fontSize: 14, color: '#7B6FAA', margin: '0 0 4px' }}>
                  Мы отправили код для входа на:
                </p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#3D2B8A', margin: '0 0 24px' }}>
                  {email}
                </p>

                <p style={{ fontSize: 13, color: '#7B6FAA', margin: '0 0 16px' }}>
                  Введите 6-значный код из письма:
                </p>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="000000"
                  value={code}
                  onChange={e => handleCodeChange(e.target.value)}
                  maxLength={6}
                  autoComplete="one-time-code"
                  autoFocus
                  style={{
                    width: '100%', textAlign: 'center',
                    fontFamily: 'var(--font-unbounded)', fontSize: 32, fontWeight: 700,
                    letterSpacing: '0.3em', padding: '16px 12px', borderRadius: 14,
                    border: `1.5px solid ${otpError ? '#E53E3E' : '#EDE8FF'}`,
                    outline: 'none', color: '#2D1F6E', background: '#FAF8FF',
                    boxSizing: 'border-box' as const, marginBottom: 12,
                  }}
                />

                {otpError && (
                  <p style={{ color: '#E53E3E', fontSize: 13, marginBottom: 12 }}>{otpError}</p>
                )}

                <button
                  onClick={() => handleVerifyOtp(code)}
                  disabled={otpLoading || code.length < 6}
                  style={{
                    width: '100%', background: '#7C5CFC', color: '#fff', border: 'none',
                    borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 700,
                    cursor: otpLoading || code.length < 6 ? 'not-allowed' : 'pointer',
                    opacity: otpLoading || code.length < 6 ? 0.5 : 1,
                    fontFamily: 'var(--font-nunito)', marginBottom: 16,
                  }}
                >
                  {otpLoading ? 'Проверяем...' : 'Войти в клуб →'}
                </button>

                <p style={{ fontSize: 12, color: '#9B8FCC', marginBottom: 8 }}>
                  Не получили письмо? Проверьте папку «Спам»
                </p>
                <button
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0 || resendLoading}
                  style={{
                    background: 'none', border: 'none', color: resendCountdown > 0 ? '#9B8FCC' : '#7C5CFC',
                    fontSize: 13, cursor: resendCountdown > 0 ? 'default' : 'pointer',
                    fontFamily: 'var(--font-nunito)', textDecoration: resendCountdown > 0 ? 'none' : 'underline',
                  }}
                >
                  {resendLoading ? 'Отправляем...' : resendCountdown > 0
                    ? `Отправить повторно через ${resendCountdown} с`
                    : 'Отправить повторно'}
                </button>
            </>
          </div>
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 28 }}>
        Уже есть доступ?{' '}
        <a href="https://club.nata-tomshina.ru/auth" style={{ color: '#9B7BFF', textDecoration: 'underline' }}>
          Войти →
        </a>
      </p>

      <style>{`
        @media (max-width: 700px) {
          .join-cards { grid-template-columns: 1fr !important; }
          .join-cards > div { transform: none !important; }
        }
      `}</style>
    </div>
  )
}

export default function JoinPage() {
  return (
    <>
      <Script
        src="https://widget.cloudpayments.ru/bundles/cloudpayments.js"
        strategy="afterInteractive"
      />
      <Suspense fallback={null}>
        <JoinContent />
      </Suspense>
    </>
  )
}
