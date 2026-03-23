'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError('Ошибка отправки. Проверь email и попробуй снова.')
    } else {
      setSent(true)
    }
    setLoading(false)
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
          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📬</div>
              <h2
                className="text-xl font-semibold mb-2"
                style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}
              >
                Письмо отправлено!
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)', opacity: 0.7 }}
              >
                Проверь почту <strong>{email}</strong> и нажми на ссылку для входа.
                Письмо действует 1 час.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-sm underline"
                style={{ fontFamily: 'var(--font-nunito)', color: 'var(--pur)' }}
              >
                Отправить на другой email
              </button>
            </div>
          ) : (
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
                Введи email — пришлём ссылку для входа
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                  type="email"
                  placeholder="твой@email.ru"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-2xl border outline-none text-sm transition-all"
                  style={{
                    fontFamily: 'var(--font-nunito)',
                    borderColor: '#E8E0FF',
                    color: 'var(--text)',
                    background: 'var(--bg)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--pur)')}
                  onBlur={(e) => (e.target.style.borderColor = '#E8E0FF')}
                />

                {error && (
                  <p
                    className="text-sm text-red-500"
                    style={{ fontFamily: 'var(--font-nunito)' }}
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3 rounded-2xl text-white font-semibold text-sm transition-opacity disabled:opacity-50"
                  style={{
                    fontFamily: 'var(--font-nunito)',
                    background: 'var(--pur)',
                  }}
                >
                  {loading ? 'Отправляем...' : 'Получить ссылку для входа'}
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
        </div>
      </div>
    </div>
  )
}
