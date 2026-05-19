'use client'
import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Kbju {
  calories: number
  protein: number
  fat: number
  carbs: number
}
interface Meal {
  meal_type: string
  id: number
  title: string
  kbju: Kbju
}
interface PlanDay {
  day_number: number
  day_name: string
  meals: Meal[]
  day_total: Kbju
}
interface PlanResult {
  targets: Kbju
  days: PlanDay[]
}

// ─── Constants ───────────────────────────────────────────────────────────────
const ACTIVITY_OPTIONS = [
  { value: 'sedentary',   label: 'Сидячий образ жизни (офис, почти нет спорта)' },
  { value: 'light',       label: 'Лёгкая активность (прогулки, 1–2 тренировки/нед)' },
  { value: 'moderate',    label: 'Умеренная (3–5 тренировок в неделю)' },
  { value: 'active',      label: 'Высокая (ежедневные тренировки)' },
  { value: 'very_active', label: 'Очень высокая (спорт 2 раза в день)' },
]
const GOAL_OPTIONS = [
  { value: 'lose',     label: '📉 Снизить вес' },
  { value: 'maintain', label: '⚖️ Поддержать вес' },
  { value: 'gain',     label: '📈 Набрать массу' },
]

// ─── Shared styles ────────────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: '#FFFAF5',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    padding: '32px 16px 60px',
  },
  logo: {
    fontFamily: 'var(--font-unbounded)',
    fontSize: 18,
    fontWeight: 700,
    color: '#3D2817',
    textDecoration: 'none',
    marginBottom: 32,
    display: 'block' as const,
    textAlign: 'center' as const,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    background: '#fff',
    borderRadius: 24,
    border: '1.5px solid #F4E6DC',
    overflow: 'hidden' as const,
  },
  header: {
    background: 'linear-gradient(135deg, #3D2817 0%, #7A4520 100%)',
    padding: '32px 28px 28px',
    textAlign: 'center' as const,
  },
  headerTitle: {
    fontFamily: 'var(--font-unbounded)',
    fontSize: 20,
    fontWeight: 700,
    color: '#fff',
    margin: '0 0 8px',
    lineHeight: 1.3,
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    margin: 0,
    lineHeight: 1.5,
  },
  body: { padding: '28px' },
  label: {
    display: 'block' as const,
    fontSize: 13,
    fontWeight: 600,
    color: '#3D2817',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid #F4E6DC',
    borderRadius: 12,
    fontSize: 15,
    color: '#3D2817',
    outline: 'none',
    marginBottom: 16,
    boxSizing: 'border-box' as const,
    fontFamily: 'var(--font-nunito)',
    background: '#FFFAF5',
  },
  select: {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid #F4E6DC',
    borderRadius: 12,
    fontSize: 14,
    color: '#3D2817',
    outline: 'none',
    marginBottom: 16,
    boxSizing: 'border-box' as const,
    fontFamily: 'var(--font-nunito)',
    background: '#FFFAF5',
    cursor: 'pointer',
  },
  btn: (disabled = false) => ({
    width: '100%',
    padding: '14px',
    background: disabled ? '#ccc' : '#7A9F3F',
    color: '#fff',
    fontFamily: 'var(--font-unbounded)',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    borderRadius: 12,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
    transition: 'opacity 0.15s',
  }),
  error: {
    color: '#D4805C',
    fontSize: 13,
    marginBottom: 12,
  },
  muted: {
    fontSize: 12,
    color: '#9B8570',
    marginTop: 12,
    textAlign: 'center' as const,
  },
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepEmail({ onNext }: { onNext: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/racion/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Ошибка')
      onNext(email)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.card}>
      <div style={S.header}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🥗</div>
        <h1 style={S.headerTitle}>Рацион на 7 дней — бесплатно</h1>
        <p style={S.headerSub}>Персональный план питания по методу Натальи Томшиной</p>
      </div>
      <div style={S.body}>
        <p style={{ fontSize: 15, color: '#7B6555', marginBottom: 20 }}>
          Введите email — получите доступ к персональному рациону. Никакого спама, только полезное.
        </p>
        <form onSubmit={submit}>
          <label style={S.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            style={S.input}
          />
          {error && <p style={S.error}>{error}</p>}
          <button type="submit" disabled={loading} style={S.btn(loading)}>
            {loading ? 'Отправляем...' : 'Получить рацион →'}
          </button>
        </form>
        <p style={S.muted}>Нажимая кнопку, вы соглашаетесь с обработкой персональных данных</p>
      </div>
    </div>
  )
}

function StepOtp({ email, onNext, onBack }: { email: string; onNext: () => void; onBack: () => void }) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/racion/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Ошибка')
      onNext()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    setError('')
    setResent(false)
    try {
      await fetch('/api/racion/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setResent(true)
    } catch { /* ignore */ }
  }

  return (
    <div style={S.card}>
      <div style={S.header}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
        <h1 style={S.headerTitle}>Проверьте почту</h1>
        <p style={S.headerSub}>Код отправлен на {email}</p>
      </div>
      <div style={S.body}>
        <p style={{ fontSize: 15, color: '#7B6555', marginBottom: 20 }}>
          Введите 6-значный код из письма. Проверьте папку «Спам», если не нашли.
        </p>
        <form onSubmit={submit}>
          <label style={S.label}>Код подтверждения</label>
          <input
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            required
            maxLength={6}
            style={{ ...S.input, fontSize: 28, letterSpacing: 10, textAlign: 'center', fontFamily: 'var(--font-unbounded)' }}
          />
          {error && <p style={S.error}>{error}</p>}
          {resent && <p style={{ color: '#7A9F3F', fontSize: 13, marginBottom: 10 }}>✅ Код отправлен повторно</p>}
          <button type="submit" disabled={loading || otp.length < 6} style={S.btn(loading || otp.length < 6)}>
            {loading ? 'Проверяем...' : 'Подтвердить →'}
          </button>
        </form>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button onClick={onBack} style={{ flex: 1, padding: '10px', background: 'none', border: '1.5px solid #F4E6DC', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: '#7B6555' }}>
            ← Изменить email
          </button>
          <button onClick={resend} style={{ flex: 1, padding: '10px', background: 'none', border: '1.5px solid #F4E6DC', borderRadius: 10, cursor: 'pointer', fontSize: 13, color: '#7B6555' }}>
            Отправить снова
          </button>
        </div>
      </div>
    </div>
  )
}

interface Params {
  gender: string
  age: string
  height: string
  weight: string
  activity: string
  goal: string
}

function StepParams({ onNext }: { onNext: (params: Params) => void }) {
  const [params, setParams] = useState<Params>({
    gender: 'female',
    age: '',
    height: '',
    weight: '',
    activity: 'moderate',
    goal: 'lose',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(key: keyof Params, value: string) {
    setParams(p => ({ ...p, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const age = parseInt(params.age)
    const height = parseInt(params.height)
    const weight = parseFloat(params.weight)
    if (isNaN(age) || age < 14 || age > 100) return setError('Введите корректный возраст (14–100)')
    if (isNaN(height) || height < 130 || height > 220) return setError('Введите корректный рост (130–220 см)')
    if (isNaN(weight) || weight < 35 || weight > 300) return setError('Введите корректный вес (35–300 кг)')
    setLoading(true)
    onNext(params)
    setLoading(false)
  }

  const isReady = params.age && params.height && params.weight

  return (
    <div style={S.card}>
      <div style={S.header}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
        <h1 style={S.headerTitle}>Ваши параметры</h1>
        <p style={S.headerSub}>Рассчитаем индивидуальный КБЖУ и подберём рацион</p>
      </div>
      <div style={S.body}>
        <form onSubmit={submit}>
          {/* Gender */}
          <label style={S.label}>Пол</label>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {[{ v: 'female', l: '👩 Женщина' }, { v: 'male', l: '👨 Мужчина' }].map(({ v, l }) => (
              <button
                key={v}
                type="button"
                onClick={() => set('gender', v)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  border: '1.5px solid',
                  borderColor: params.gender === v ? '#7A9F3F' : '#F4E6DC',
                  borderRadius: 12,
                  background: params.gender === v ? '#F0F7E6' : '#FFFAF5',
                  color: '#3D2817',
                  fontFamily: 'var(--font-nunito)',
                  fontSize: 14,
                  cursor: 'pointer',
                  fontWeight: params.gender === v ? 700 : 400,
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Age / Height / Weight in row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 0 }}>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Возраст</label>
              <input
                type="number"
                value={params.age}
                onChange={e => set('age', e.target.value)}
                placeholder="35"
                min={14} max={100}
                required
                style={{ ...S.input, marginBottom: 16 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Рост, см</label>
              <input
                type="number"
                value={params.height}
                onChange={e => set('height', e.target.value)}
                placeholder="165"
                min={130} max={220}
                required
                style={{ ...S.input, marginBottom: 16 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Вес, кг</label>
              <input
                type="number"
                value={params.weight}
                onChange={e => set('weight', e.target.value)}
                placeholder="70"
                min={35} max={300}
                step="0.1"
                required
                style={{ ...S.input, marginBottom: 16 }}
              />
            </div>
          </div>

          {/* Activity */}
          <label style={S.label}>Уровень активности</label>
          <select
            value={params.activity}
            onChange={e => set('activity', e.target.value)}
            style={S.select}
          >
            {ACTIVITY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Goal */}
          <label style={S.label}>Цель</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {GOAL_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => set('goal', o.value)}
                style={{
                  flex: 1,
                  padding: '9px 4px',
                  border: '1.5px solid',
                  borderColor: params.goal === o.value ? '#7A9F3F' : '#F4E6DC',
                  borderRadius: 12,
                  background: params.goal === o.value ? '#F0F7E6' : '#FFFAF5',
                  color: '#3D2817',
                  fontFamily: 'var(--font-nunito)',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: params.goal === o.value ? 700 : 400,
                  lineHeight: 1.3,
                }}
              >
                {o.label}
              </button>
            ))}
          </div>

          {error && <p style={S.error}>{error}</p>}
          <button type="submit" disabled={!isReady || loading} style={S.btn(!isReady || loading)}>
            {loading ? 'Составляем рацион...' : 'Составить рацион 🥗'}
          </button>
        </form>
      </div>
    </div>
  )
}

function KbjuBadge({ label, value, unit = 'г' }: { label: string; value: number | string; unit?: string }) {
  return (
    <div style={{ textAlign: 'center' as const, flex: 1 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#3D2817', fontFamily: 'var(--font-unbounded)' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: '#9B8570', marginTop: 2 }}>
        {label}{unit !== '' ? ` (${unit})` : ''}
      </div>
    </div>
  )
}

function StepResult({ plan, params }: { plan: PlanResult; params: Params }) {
  const [openDay, setOpenDay] = useState<number | null>(0)

  const goalLabel = GOAL_OPTIONS.find(o => o.value === params.goal)?.label ?? ''

  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      {/* Header card */}
      <div style={{
        background: 'linear-gradient(135deg, #3D2817 0%, #7A4520 100%)',
        borderRadius: 24,
        padding: '28px 24px',
        marginBottom: 16,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🥗</div>
        <h2 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, color: '#fff', margin: '0 0 6px' }}>
          Ваш рацион готов!
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', margin: '0 0 20px' }}>
          Цель: {goalLabel} · по методу Натальи Томшиной
        </p>
        {/* Daily targets */}
        <div style={{
          background: 'rgba(255,255,255,0.12)',
          borderRadius: 16,
          padding: '16px 12px',
          display: 'flex',
          gap: 8,
        }}>
          <KbjuBadge label="Калории" value={plan.targets.calories} unit="ккал" />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
          <KbjuBadge label="Белки" value={plan.targets.protein} />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
          <KbjuBadge label="Жиры" value={plan.targets.fat} />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
          <KbjuBadge label="Углеводы" value={`до ${plan.targets.carbs}`} unit="" />
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 12, margin: '12px 0 0' }}>
          Суточная норма КБЖУ · рассчитана по формуле Миффлина-Сан Жеора
        </p>
      </div>

      {/* Promo banner */}
      <div style={{
        background: '#FFF0E8',
        border: '1.5px solid #F4C8B0',
        borderRadius: 16,
        padding: '14px 18px',
        marginBottom: 16,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>💚</span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#3D2817', margin: '0 0 4px', fontFamily: 'var(--font-nunito)' }}>
            Хотите полноценный рацион каждую неделю?
          </p>
          <p style={{ fontSize: 13, color: '#7B6555', margin: '0 0 10px' }}>
            В клубе «Вкус Жизни» — умная кухня, которая составит рацион именно под ваши продукты, уровень и цели.
          </p>
          <a
            href="/club"
            style={{
              display: 'inline-block',
              padding: '8px 18px',
              background: '#D4805C',
              color: '#fff',
              borderRadius: 10,
              fontFamily: 'var(--font-unbounded)',
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Попробовать клуб →
          </a>
        </div>
      </div>

      {/* 7-day plan */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {plan.days.map((day, idx) => {
          const isOpen = openDay === idx
          return (
            <div
              key={day.day_number}
              style={{
                background: '#fff',
                border: '1.5px solid #F4E6DC',
                borderRadius: 18,
                overflow: 'hidden',
              }}
            >
              {/* Day header */}
              <button
                onClick={() => setOpenDay(isOpen ? null : idx)}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: isOpen ? '#7A9F3F' : '#F0F7E6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: isOpen ? '#fff' : '#7A9F3F',
                    fontFamily: 'var(--font-unbounded)',
                    flexShrink: 0,
                  }}>
                    {day.day_number}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#3D2817', fontFamily: 'var(--font-nunito)' }}>
                      {day.day_name}
                    </div>
                    <div style={{ fontSize: 12, color: '#9B8570' }}>
                      {day.day_total.calories} ккал · Б{day.day_total.protein} Ж{day.day_total.fat} У{day.day_total.carbs}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 18, color: '#C4B5A5', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  ↓
                </span>
              </button>

              {/* Day meals */}
              {isOpen && (
                <div style={{ padding: '0 18px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {day.meals.length === 0 ? (
                    <p style={{ fontSize: 13, color: '#9B8570', textAlign: 'center', padding: '10px 0' }}>
                      Рецепты этого дня пока добавляются
                    </p>
                  ) : day.meals.map((meal, mi) => (
                    <div
                      key={mi}
                      style={{
                        background: '#FFFAF5',
                        border: '1px solid #F4E6DC',
                        borderRadius: 12,
                        padding: '12px 14px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#D4805C',
                            textTransform: 'uppercase' as const,
                            letterSpacing: 0.5,
                            display: 'block',
                            marginBottom: 3,
                          }}>
                            {meal.meal_type}
                          </span>
                          <span style={{ fontSize: 14, color: '#3D2817', fontFamily: 'var(--font-nunito)', fontWeight: 600 }}>
                            {meal.title}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#3D2817' }}>
                            {meal.kbju.calories} ккал
                          </div>
                          <div style={{ fontSize: 11, color: '#9B8570', marginTop: 2 }}>
                            Б{meal.kbju.protein} Ж{meal.kbju.fat} У{meal.kbju.carbs}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      <div style={{
        background: 'linear-gradient(135deg, #7A9F3F 0%, #5E7F2E 100%)',
        borderRadius: 20,
        padding: '28px 24px',
        textAlign: 'center',
        marginTop: 20,
      }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🌿</div>
        <h3 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 16, color: '#fff', margin: '0 0 8px' }}>
          Клуб «Вкус Жизни»
        </h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: '0 0 18px', lineHeight: 1.5 }}>
          Умная кухня · Дневник питания · Марафоны · Живое сообщество
        </p>
        <a
          href="/club"
          style={{
            display: 'inline-block',
            padding: '12px 28px',
            background: '#fff',
            color: '#3D2817',
            borderRadius: 12,
            fontFamily: 'var(--font-unbounded)',
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Начать с пробного периода →
        </a>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 10, margin: '10px 0 0' }}>
          149 ₽ / 7 дней, потом 1500 ₽/мес
        </p>
      </div>
    </div>
  )
}

// ─── Loading state ────────────────────────────────────────────────────────────
function LoadingPlan() {
  return (
    <div style={{ ...S.card, textAlign: 'center' as const }}>
      <div style={S.body}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
        <p style={{ fontFamily: 'var(--font-unbounded)', fontSize: 16, color: '#3D2817', marginBottom: 8 }}>
          Составляем ваш рацион...
        </p>
        <p style={{ fontSize: 14, color: '#9B8570' }}>
          Подбираем рецепты и рассчитываем КБЖУ
        </p>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
type Step = 'email' | 'otp' | 'params' | 'loading' | 'result'

export default function RacionClient({ initialVerified }: { initialVerified: boolean }) {
  const [step, setStep] = useState<Step>(initialVerified ? 'params' : 'email')
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState<PlanResult | null>(null)
  const [params, setParams] = useState<Params | null>(null)
  const [genError, setGenError] = useState('')

  async function generatePlan(p: Params) {
    setParams(p)
    setStep('loading')
    setGenError('')
    try {
      const res = await fetch('/api/racion/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender: p.gender,
          age: parseInt(p.age),
          height: parseInt(p.height),
          weight: parseFloat(p.weight),
          activity: p.activity,
          goal: p.goal,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Ошибка генерации рациона')
      setPlan(data)
      setStep('result')
    } catch (err) {
      setGenError((err as Error).message)
      setStep('params')
    }
  }

  return (
    <div style={S.page}>
      <a href="/" style={S.logo}>
        Вкус<span style={{ color: '#7A9F3F' }}>Жизни</span>
      </a>

      {step === 'email' && (
        <StepEmail onNext={(e) => { setEmail(e); setStep('otp') }} />
      )}
      {step === 'otp' && (
        <StepOtp
          email={email}
          onNext={() => setStep('params')}
          onBack={() => setStep('email')}
        />
      )}
      {step === 'params' && (
        <>
          <StepParams onNext={generatePlan} />
          {genError && (
            <p style={{ color: '#D4805C', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
              {genError}
            </p>
          )}
        </>
      )}
      {step === 'loading' && <LoadingPlan />}
      {step === 'result' && plan && params && (
        <StepResult plan={plan} params={params} />
      )}

      <p style={{ marginTop: 24, fontSize: 13, color: '#9B8570', textAlign: 'center' }}>
        Уже участница клуба?{' '}
        <a href="/auth" style={{ color: '#D4805C', textDecoration: 'none', fontWeight: 600 }}>
          Войти →
        </a>
      </p>
    </div>
  )
}
