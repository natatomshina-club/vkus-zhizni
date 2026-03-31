'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type CheckStatus = 'not_found' | 'blocked' | 'send_error' | 'rate_limited' | 'verify_error' | null

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code' | 'activating'>('email')
  const [loading, setLoading] = useState(false)
  const [checkStatus, setCheckStatus] = useState<CheckStatus>(null)
  const [resendCountdown, setResendCountdown] = useState(0)
  const [fromPayment, setFromPayment] = useState(false)
  const submittingRef = useRef(false)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const codeInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Clear any existing session so user can re-authenticate cleanly
  useEffect(() => {
    createClient().auth.signOut()
  }, [])

  // Предзаполнение email после редиректа из оплаты
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailFromUrl = params.get('email')
    const isFromPayment = params.get('from') === 'payment'
    if (emailFromUrl && isFromPayment) {
      setEmail(decodeURIComponent(emailFromUrl))
      setFromPayment(true)
      setStep('code')
    }
  }, [])

  useEffect(() => {
    if (step === 'code') {
      codeInputRef.current?.focus()
    }
  }, [step])

  useEffect(() => () => {
    if (countdownRef.current) clearInterval(countdownRef.current)
  }, [])

  function startCountdown() {
    if (countdownRef.current) clearInterval(countdownRef.current)
    setResendCountdown(60)
    countdownRef.current = setInterval(() => {
      setResendCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current) return
    submittingRef.current = true
    setLoading(true)
    setCheckStatus(null)

    try {
      const res = await fetch('/api/auth/check-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()

      if (data.status !== 'ok') {
        setCheckStatus(data.status as CheckStatus)
        return
      }

      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: false,
          // No emailRedirectTo — we use OTP code, not magic link
        },
      })

      if (error) {
        setCheckStatus('send_error')
        return
      }

      setStep('code')
      startCountdown()
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  async function submitCode(token: string) {
    if (token.length < 6) return
    if (submittingRef.current) return

    // Сбрасываем ошибку и включаем loading ДО await — никакого промежуточного рендера с ошибкой
    setCheckStatus(null)
    setLoading(true)
    submittingRef.current = true

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: 'email',
      })

      if (error) {
        setCheckStatus('verify_error')
        setCode('')
        return
      }

      // Синхронизировать members.id с auth.users.id (если расходятся)
      fetch('/api/auth/sync-member-id', { method: 'POST' }).catch(() => null)

      if (fromPayment) {
        // Дать вебхуку время обновить subscription_status в БД перед редиректом
        setStep('activating')
        setTimeout(() => router.replace('/dashboard'), 4000)
      } else {
        router.replace('/dashboard')
      }
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  function handleVerifyCode(e?: React.FormEvent) {
    e?.preventDefault()
    submitCode(code)
  }

  function handleCodeChange(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
    if (checkStatus) setCheckStatus(null)
  }

  async function handleResend() {
    if (resendCountdown > 0 || loading) return
    setLoading(true)
    setCheckStatus(null)
    setCode('')
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    })
    setLoading(false)
    startCountdown()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1
            className="text-2xl font-bold tracking-tight mb-1"
            style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--pur)' }}
          >
            Вкус Жизни
          </h1>
          <p
            className="text-sm"
            style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)', opacity: 0.6 }}
          >
            Клуб стройных и здоровых
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-white/60 p-8">

          {/* ── STEP activating: после оплаты ── */}
          {step === 'activating' && (
            <div className="text-center py-4">
              <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
              <h2
                className="text-xl font-semibold mb-2"
                style={{ fontFamily: 'var(--font-unbounded)', color: '#2D6A4F' }}
              >
                Добро пожаловать!
              </h2>
              <p
                className="text-sm mb-6"
                style={{ fontFamily: 'var(--font-nunito)', color: 'var(--muted)' }}
              >
                Активируем ваш доступ в клуб...
              </p>
              <div
                style={{
                  width: 40, height: 40, border: '3px solid #EDE8FF',
                  borderTop: '3px solid var(--pur)', borderRadius: '50%',
                  margin: '0 auto',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* ── STEP 1: email ── */}
          {step === 'email' && (
            <>
              <h2
                className="text-xl font-semibold mb-1"
                style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}
              >
                Войти в клуб
              </h2>
              <p
                className="text-sm mb-6"
                style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)', opacity: 0.6 }}
              >
                Введи email — пришлём код для входа
              </p>

              <form onSubmit={handleSendCode} className="flex flex-col gap-4">
                <input
                  type="email"
                  placeholder="твой@email.ru"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setCheckStatus(null) }}
                  required
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm transition-all"
                  style={{
                    fontFamily: 'var(--font-nunito)',
                    borderColor: '#E8E0FF',
                    color: 'var(--text)',
                    background: 'var(--bg)',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--pur)')}
                  onBlur={e => (e.target.style.borderColor = '#E8E0FF')}
                />

                {checkStatus === 'not_found' && (
                  <div
                    className="rounded-2xl p-4 text-sm leading-relaxed"
                    style={{ background: '#FFF3E6', border: '1px solid #FFD4A3', fontFamily: 'var(--font-nunito)', color: '#7A3B00' }}
                  >
                    <p className="mb-3">
                      Участница с таким email не найдена.<br />
                      Хочешь вступить в клуб?
                    </p>
                    <a
                      href="/join"
                      className="inline-block px-4 py-2 rounded-xl text-white text-sm font-semibold"
                      style={{ background: 'var(--pur)' }}
                    >
                      Вступить в клуб
                    </a>
                  </div>
                )}

                {checkStatus === 'blocked' && (
                  <div
                    className="rounded-2xl p-4 text-sm leading-relaxed"
                    style={{ background: '#FFF0F0', border: '1px solid #FFCACA', fontFamily: 'var(--font-nunito)', color: '#7A0000' }}
                  >
                    Доступ заблокирован. По вопросам пишите:{' '}
                    <a href="mailto:nata.tomshina@gmail.com" style={{ color: '#7A0000', fontWeight: 700 }}>
                      nata.tomshina@gmail.com
                    </a>
                  </div>
                )}

                {checkStatus === 'rate_limited' && (
                  <div
                    className="rounded-2xl p-4 text-sm leading-relaxed"
                    style={{ background: '#F0EEFF', border: '1px solid #DDD5FF', fontFamily: 'var(--font-nunito)', color: '#3D2B8A' }}
                  >
                    Код уже отправлен. Подожди 60 секунд перед повторной попыткой.
                  </div>
                )}

                {checkStatus === 'send_error' && (
                  <p className="text-sm text-red-500" style={{ fontFamily: 'var(--font-nunito)' }}>
                    Ошибка отправки. Проверь email и попробуй снова.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3 rounded-2xl text-white font-semibold text-sm transition-opacity disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-nunito)', background: 'var(--pur)' }}
                >
                  {loading ? 'Отправляем...' : 'Получить код'}
                </button>
              </form>

              <p
                className="text-xs text-center mt-6 leading-relaxed"
                style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)', opacity: 0.5 }}
              >
                Ещё нет доступа?{' '}
                <a href="/join" style={{ color: 'var(--pur)' }} className="underline">
                  Вступить в клуб
                </a>
              </p>
            </>
          )}

          {/* ── STEP 2: code ── */}
          {step === 'code' && (
            <>
              <button
                onClick={() => { setStep('email'); setCode(''); setCheckStatus(null) }}
                className="flex items-center gap-1.5 text-sm mb-5"
                style={{ fontFamily: 'var(--font-nunito)', color: 'var(--pur)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                ← Изменить email
              </button>

              <h2
                className="text-xl font-semibold mb-1"
                style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}
              >
                Введи код
              </h2>
              <p
                className="text-sm mb-2"
                style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)', opacity: 0.7 }}
              >
                Отправили 6-значный код на{' '}
                <strong>{email}</strong>
              </p>
              <p
                className="text-xs mb-6"
                style={{ fontFamily: 'var(--font-nunito)', color: '#7B6FAA' }}
              >
                Код действителен 10 минут. Письмо может идти 1–2 минуты — проверь папку&nbsp;<strong>Спам</strong>.
              </p>

              <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
                <input
                  ref={codeInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="000000"
                  value={code}
                  onChange={e => handleCodeChange(e.target.value)}
                  maxLength={6}
                  autoComplete="one-time-code"
                  className="w-full text-center rounded-2xl border outline-none transition-all"
                  style={{
                    fontFamily: 'var(--font-unbounded)',
                    fontSize: 32,
                    fontWeight: 700,
                    letterSpacing: '0.3em',
                    padding: '16px 12px',
                    borderColor: checkStatus === 'verify_error' && !loading ? '#E53E3E' : '#E8E0FF',
                    color: 'var(--text)',
                    background: 'var(--bg)',
                  }}
                  onFocus={e => (e.target.style.borderColor = checkStatus === 'verify_error' && !loading ? '#E53E3E' : 'var(--pur)')}
                  onBlur={e => (e.target.style.borderColor = checkStatus === 'verify_error' && !loading ? '#E53E3E' : '#E8E0FF')}
                />

                {checkStatus === 'verify_error' && !loading && (
                  <p className="text-sm text-red-500 text-center" style={{ fontFamily: 'var(--font-nunito)' }}>
                    Неверный код. Попробуй ещё раз.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full py-3 rounded-2xl text-white font-semibold text-sm transition-opacity disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-nunito)', background: 'var(--pur)' }}
                >
                  {loading ? 'Проверяем...' : 'Войти'}
                </button>
              </form>

              <div className="text-center mt-4">
                <button
                  onClick={handleResend}
                  disabled={resendCountdown > 0 || loading}
                  className="text-sm disabled:opacity-40"
                  style={{
                    fontFamily: 'var(--font-nunito)',
                    color: 'var(--pur)',
                    background: 'none', border: 'none', cursor: resendCountdown > 0 ? 'default' : 'pointer',
                  }}
                >
                  {resendCountdown > 0
                    ? `Отправить новый код через ${resendCountdown} с`
                    : 'Отправить новый код'}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
