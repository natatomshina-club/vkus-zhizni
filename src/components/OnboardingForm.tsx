'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateKBJU, type ActivityLevel } from '@/lib/kbju'
import { LEGAL_DOCS } from '@/lib/legal'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
      {children}
    </p>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      {children}
    </div>
  )
}

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; icon: string }[] = [
  { value: 'sedentary',        label: 'Сидячая работа',          icon: '💻' },
  { value: 'standing',         label: 'На ногах весь день',       icon: '🚶' },
  { value: 'light_training',   label: 'Лёгкие тренировки',        icon: '🏃' },
  { value: 'intense_training', label: 'Активные тренировки',      icon: '💪' },
]

const HEALTH_OPTIONS = [
  { value: 'gastritis', label: 'Гастрит' },
  { value: 'no_gallbladder', label: 'Нет желчного' },
  { value: 'gerd', label: 'ГЭРБ' },
  { value: 'ibs', label: 'СРК' },
  { value: 'ir', label: 'Инсулинорезистентность' },
  { value: 'high_cholesterol', label: 'Высокий холестерин' },
  { value: 'kidney', label: 'Заболевания почек' },
  { value: 'diabetes', label: 'Диабет' },
]

// ── Legal helpers ──────────────────────────────────────────────────────────

function DocLink({
  slug,
  label,
  openDoc,
  setOpenDoc,
}: {
  slug: string
  label: string
  openDoc: string | null
  setOpenDoc: (v: string | null) => void
}) {
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); setOpenDoc(openDoc === slug ? null : slug) }}
      style={{
        background: 'none', border: 'none', padding: 0,
        color: 'var(--pur)', fontSize: 'inherit',
        fontFamily: 'var(--font-nunito)', cursor: 'pointer',
        textDecoration: 'underline', textUnderlineOffset: 2,
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  )
}

function ConsentRow({
  checked,
  onChange,
  label,
  docSlug,
  openDoc,
  setOpenDoc,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: React.ReactNode
  docSlug: string
  openDoc: string | null
  setOpenDoc: (v: string | null) => void
}) {
  // Find which docs are shown for this row (could be "terms" or "rules" or others)
  const isOpen = openDoc !== null && (openDoc === docSlug || openDoc === 'rules')

  // Determine which doc content to show
  type DocKey = 'terms' | 'rules' | 'disclaimer' | 'privacy' | 'refund'
  const shownDoc = openDoc ? LEGAL_DOCS[openDoc as DocKey] : null

  return (
    <div>
      <label
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
        }}
      >
        <span
          onClick={() => onChange(!checked)}
          style={{
            marginTop: 2, flexShrink: 0,
            width: 20, height: 20, borderRadius: 6,
            border: `2px solid ${checked ? 'var(--pur)' : 'var(--border)'}`,
            background: checked ? 'var(--pur)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {checked && (
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
              <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        <span
          style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text)', fontFamily: 'var(--font-nunito)', userSelect: 'none' }}
          onClick={() => onChange(!checked)}
        >
          {label}
        </span>
      </label>

      {/* Inline doc accordion */}
      {shownDoc && (openDoc === docSlug || openDoc === 'rules') && (
        <div style={{
          marginTop: 10, padding: '12px 14px',
          background: '#F9F8FF', border: '1px solid var(--border)',
          borderRadius: 12, fontSize: 12.5, lineHeight: 1.7,
          color: 'var(--text)', whiteSpace: 'pre-wrap',
          maxHeight: 280, overflowY: 'auto',
          fontFamily: 'var(--font-nunito)',
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 13 }}>{shownDoc.title}</p>
          {shownDoc.content}
          <button
            type="button"
            onClick={() => setOpenDoc(null)}
            style={{
              marginTop: 10, display: 'block',
              background: 'none', border: 'none', padding: 0,
              color: 'var(--pur)', fontSize: 13, cursor: 'pointer',
              fontWeight: 600, fontFamily: 'var(--font-nunito)',
            }}
          >
            Закрыть ↑
          </button>
        </div>
      )}
    </div>
  )
}

export default function OnboardingForm({ userId }: { userId: string }) {
  const router = useRouter()

  const [form, setForm] = useState({
    full_name: '',
    age: '',
    weight: '',
    height: '',
    goal_weight: '',
    activity: '' as ActivityLevel | '',
    allergies: '',
    health_conditions: [] as string[],
  })
  const [noneChecked, setNoneChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Consent state
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedDisclaimer, setAgreedDisclaimer] = useState(false)
  const [agreedPersonalData, setAgreedPersonalData] = useState(false)
  const [openDoc, setOpenDoc] = useState<string | null>(null)

  const allAgreed = agreedTerms && agreedDisclaimer && agreedPersonalData

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleCondition(value: string) {
    setNoneChecked(false)
    setForm(prev => {
      const has = prev.health_conditions.includes(value)
      return {
        ...prev,
        health_conditions: has
          ? prev.health_conditions.filter(v => v !== value)
          : [...prev.health_conditions, value],
      }
    })
  }

  function toggleNone() {
    setNoneChecked(prev => !prev)
    setForm(prev => ({ ...prev, health_conditions: [] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Укажи своё имя'); return }
    if (!form.age || !form.weight || !form.height) { setError('Заполни возраст, вес и рост'); return }
    if (!form.activity) { setError('Выбери уровень активности'); return }
    if (!form.goal_weight) { setError('Укажи желаемый вес'); return }

    setLoading(true)
    setError('')

    const w = parseFloat(form.weight)
    const h = parseFloat(form.height)
    const a = parseInt(form.age)
    const activity = form.activity as ActivityLevel
    const kbju = calculateKBJU({ weight: w, height: h, age: a, activity })
    const conditions = noneChecked ? [] : form.health_conditions

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error: dbError } = await supabase.from('members').upsert(
      {
        id: userId,
        email: user?.email,
        name: form.full_name.trim(),
        age: a,
        weight: w,
        start_weight: w,
        initial_weight: w,
        height: h,
        goal_weight: parseFloat(form.goal_weight),
        activity_level: activity,
        health_conditions: conditions,
        allergies: form.allergies.trim() || null,
        kbju_calories: kbju.calories,
        kbju_protein:  kbju.protein,
        kbju_fat:      kbju.fat,
        kbju_carbs:    kbju.carbs,
        status: 'trial',
        agreed_terms_at: new Date().toISOString(),
        agreed_disclaimer_at: new Date().toISOString(),
        agreed_personal_data_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    if (dbError) {
      console.error('Onboarding upsert error:', JSON.stringify(dbError, null, 2))
      console.error('userId:', userId)
      console.error('payload:', JSON.stringify({
        id: userId, name: form.full_name.trim(), age: a, weight: w, height: h,
        goal_weight: parseFloat(form.goal_weight), activity_level: activity,
        health_conditions: conditions, kbju_calories: kbju.calories,
      }, null, 2))
      setError(`Ошибка: ${dbError.message} (code: ${dbError.code})`)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const inputClass = "w-full px-4 py-3 rounded-2xl border text-sm outline-none transition-all"
  const inputStyle = {
    fontFamily: 'var(--font-nunito)',
    color: 'var(--text)',
    borderColor: 'var(--border)',
    background: 'var(--bg)',
  }
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--pur)'
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = 'var(--border)'
  }

  // Live КБЖУ preview
  const kbjuPreview = form.weight && form.height && form.age && form.activity
    ? calculateKBJU({
        weight:   parseFloat(form.weight),
        height:   parseFloat(form.height),
        age:      parseInt(form.age),
        activity: form.activity as ActivityLevel,
      })
    : null

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Name */}
      <Card>
        <SectionTitle>Полное Ф.И.О.</SectionTitle>
        <input
          type="text"
          placeholder="Например: Иванова Мария Сергеевна"
          value={form.full_name}
          onChange={e => handleChange('full_name', e.target.value)}
          className={inputClass}
          style={inputStyle}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </Card>

      {/* Age / Weight / Height */}
      <Card>
        <SectionTitle>Твои данные</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {[
            { field: 'age', label: 'Возраст', placeholder: 'лет', min: 18, max: 80 },
            { field: 'weight', label: 'Вес', placeholder: 'кг', min: 40, max: 200 },
            { field: 'height', label: 'Рост', placeholder: 'см', min: 140, max: 220 },
          ].map(({ field, label, placeholder, min, max }) => (
            <div key={field}>
              <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                {label}
              </p>
              <input
                type="number"
                placeholder={placeholder}
                value={form[field as keyof typeof form] as string}
                onChange={e => handleChange(field, e.target.value)}
                min={min}
                max={max}
                className={inputClass}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Goal weight */}
      <Card>
        <SectionTitle>Цель — желаемый вес</SectionTitle>
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="65"
            value={form.goal_weight}
            onChange={e => handleChange('goal_weight', e.target.value)}
            min={30}
            max={200}
            className={`${inputClass} flex-1`}
            style={inputStyle}
            onFocus={onFocus}
            onBlur={onBlur}
          />
          <span className="text-sm shrink-0" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>кг</span>
        </div>
        {form.weight && form.goal_weight && (
          <p className="text-xs" style={{ color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
            Путь: {Math.abs(parseFloat(form.weight) - parseFloat(form.goal_weight)).toFixed(1)} кг{' '}
            {parseFloat(form.goal_weight) < parseFloat(form.weight) ? '↓ похудеть' : '↑ набрать'}
          </p>
        )}
      </Card>

      {/* Activity */}
      <Card>
        <SectionTitle>Уровень активности</SectionTitle>
        <div className="flex flex-col gap-2">
          {ACTIVITY_OPTIONS.map(({ value, label, icon }) => {
            const active = form.activity === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, activity: value }))}
                className="flex items-center gap-3 px-4 rounded-2xl border transition-all text-left"
                style={{
                  minHeight: 48,
                  fontFamily: 'var(--font-nunito)',
                  background: active ? 'var(--pur)' : 'var(--bg)',
                  borderColor: active ? 'var(--pur)' : 'var(--border)',
                  color: active ? '#fff' : 'var(--text)',
                }}
              >
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-medium flex-1">{label}</span>
              </button>
            )
          })}
        </div>
        {kbjuPreview && (
          <div className="rounded-xl px-3 py-2.5" style={{ background: 'var(--pur-light)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
              Твой КБЖУ: {kbjuPreview.calories} ккал · Б {kbjuPreview.protein}г · Ж {kbjuPreview.fat}г · У {kbjuPreview.carbs}г
            </p>
          </div>
        )}
      </Card>

      {/* Health conditions */}
      <Card>
        <SectionTitle>Заболевания (если есть)</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {HEALTH_OPTIONS.map(({ value, label }) => {
            const checked = form.health_conditions.includes(value)
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleCondition(value)}
                className="flex items-center gap-2 px-3 rounded-xl border text-left transition-all"
                style={{
                  minHeight: 44,
                  fontFamily: 'var(--font-nunito)',
                  background: checked ? '#FFF0F0' : 'var(--bg)',
                  borderColor: checked ? '#E74C3C' : 'var(--border)',
                  color: checked ? '#C0392B' : 'var(--text)',
                }}
              >
                <span
                  className="w-4 h-4 rounded flex items-center justify-center border text-xs shrink-0"
                  style={{
                    borderColor: checked ? '#E74C3C' : 'var(--border)',
                    background: checked ? '#E74C3C' : 'transparent',
                    color: '#fff',
                  }}
                >
                  {checked ? '✓' : ''}
                </span>
                <span className="text-xs leading-snug">{label}</span>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={toggleNone}
          className="flex items-center gap-2 px-3 rounded-xl border text-left transition-all w-full"
          style={{
            minHeight: 44,
            fontFamily: 'var(--font-nunito)',
            background: noneChecked ? 'var(--grn-light)' : 'var(--bg)',
            borderColor: noneChecked ? 'var(--grn)' : 'var(--border)',
            color: noneChecked ? '#1A5C3A' : 'var(--text)',
          }}
        >
          <span
            className="w-4 h-4 rounded flex items-center justify-center border text-xs shrink-0"
            style={{
              borderColor: noneChecked ? '#2A9D5C' : 'var(--border)',
              background: noneChecked ? '#2A9D5C' : 'transparent',
              color: '#fff',
            }}
          >
            {noneChecked ? '✓' : ''}
          </span>
          <span className="text-xs">Ничего из перечисленного</span>
        </button>
      </Card>

      {/* Allergies */}
      <Card>
        <SectionTitle>Аллергии и непереносимости</SectionTitle>
        <textarea
          rows={2}
          placeholder="Например: лактоза, орехи, глютен... (или оставь пустым)"
          value={form.allergies}
          onChange={e => handleChange('allergies', e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border text-sm outline-none resize-none transition-all"
          style={inputStyle}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </Card>

      {/* ── Consent block ──────────────────────────────────────────────── */}
      <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: 'var(--card)', border: '2px solid var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Перед началом
        </p>

        {/* Consent 1: Terms + Rules */}
        <ConsentRow
          checked={agreedTerms}
          onChange={setAgreedTerms}
          label={
            <>
              Я прочитала и принимаю{' '}
              <DocLink slug="terms" label="Пользовательское соглашение" openDoc={openDoc} setOpenDoc={setOpenDoc} />
              {' '}и{' '}
              <DocLink slug="rules" label="Правила клуба" openDoc={openDoc} setOpenDoc={setOpenDoc} />
            </>
          }
          docSlug="terms"
          openDoc={openDoc}
          setOpenDoc={setOpenDoc}
        />

        {/* Consent 2: Medical disclaimer */}
        <ConsentRow
          checked={agreedDisclaimer}
          onChange={setAgreedDisclaimer}
          label={
            <>
              Я ознакомилась с{' '}
              <DocLink slug="disclaimer" label="Медицинским дисклеймером" openDoc={openDoc} setOpenDoc={setOpenDoc} />
              {' '}и понимаю, что информация в клубе носит образовательный характер и не является медицинской консультацией
            </>
          }
          docSlug="disclaimer"
          openDoc={openDoc}
          setOpenDoc={setOpenDoc}
        />

        {/* Consent 3: Personal data */}
        <ConsentRow
          checked={agreedPersonalData}
          onChange={setAgreedPersonalData}
          label={
            <>
              Я даю согласие на обработку моих персональных данных согласно{' '}
              <DocLink slug="privacy" label="Политике конфиденциальности" openDoc={openDoc} setOpenDoc={setOpenDoc} />
            </>
          }
          docSlug="privacy"
          openDoc={openDoc}
          setOpenDoc={setOpenDoc}
        />
      </div>

      {error && (
        <p className="text-sm text-center px-1" style={{ color: '#E74C3C', fontFamily: 'var(--font-nunito)' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !allAgreed}
        className="w-full rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-50"
        style={{
          minHeight: 56,
          background: allAgreed
            ? 'linear-gradient(135deg, #2A9D5C 0%, #52C98D 100%)'
            : '#C0B8D8',
          fontFamily: 'var(--font-nunito)',
          cursor: allAgreed ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? 'Сохраняем...' : 'Принимаю и начинаю 🌿'}
      </button>

      <p className="text-xs text-center pb-6" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
        КБЖУ рассчитается автоматически по формуле Миффлин-Сан Жеор
      </p>
    </form>
  )
}
