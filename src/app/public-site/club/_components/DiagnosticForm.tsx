'use client'
import { useState } from 'react'
import DiagnosticThanks from './DiagnosticThanks'

type Answers = {
  age_range: string
  problems: string[]
  tried_methods: string[]
  tried_result: string
  motivation: string
  readiness: string
  name: string
  contact_tg: string
  contact_wa: string
  contact_email: string
  comment: string
}

const EMPTY: Answers = {
  age_range: '',
  problems: [],
  tried_methods: [],
  tried_result: '',
  motivation: '',
  readiness: '',
  name: '',
  contact_tg: '',
  contact_wa: '',
  contact_email: '',
  comment: '',
}

type Step =
  | { type: 'radio'; key: keyof Answers; title: string; options: { value: string; label: string }[] }
  | { type: 'checkbox'; key: keyof Answers; title: string; hint: string; options: { value: string; label: string }[] }
  | { type: 'contacts' }

const STEPS: Step[] = [
  {
    type: 'radio',
    key: 'age_range',
    title: 'Кратко о вас',
    options: [
      { value: '35-45', label: 'Мне 35–45 лет' },
      { value: '46-55', label: 'Мне 46–55 лет' },
      { value: '56-65', label: 'Мне 56–65 лет' },
      { value: '65+', label: 'Мне больше 65' },
    ],
  },
  {
    type: 'checkbox',
    key: 'problems',
    title: 'Что больше всего беспокоит сейчас?',
    hint: 'Можно выбрать несколько',
    options: [
      { value: 'weight', label: 'Лишний вес, который никуда не уходит' },
      { value: 'fatigue', label: 'Постоянная усталость, нет сил' },
      { value: 'sweets', label: 'Тяга к сладкому, срывы по вечерам' },
      { value: 'swelling', label: 'Отёки по утрам, тяжесть, вздутие' },
      { value: 'sleep', label: 'Проблемы со сном, тревожность' },
      { value: 'analyses', label: 'Анализы стали хуже, или появились диагнозы' },
      { value: 'aging', label: '«Постарела», тело не своё' },
    ],
  },
  {
    type: 'checkbox',
    key: 'tried_methods',
    title: 'Что вы уже пробовали, чтобы это решить?',
    hint: 'Можно выбрать несколько',
    options: [
      { value: 'calories', label: 'Считала калории, держала дефицит' },
      { value: 'diets', label: 'Сидела на разных диетах (кето, дюкан, минус 60 и т.д.)' },
      { value: 'frequent_meals', label: 'Дробное питание, 5-6 раз в день' },
      { value: 'gym', label: 'Спортзал, бег, фитнес' },
      { value: 'marathons', label: 'Марафоны похудения у разных тренеров' },
      { value: 'bads', label: 'Пила БАДы по советам блогеров' },
      { value: 'doctors', label: 'Ходила к врачам, но мне сказали «всё в норме»' },
      { value: 'nothing', label: 'Ничего серьёзного не пробовала, просто плыву по течению' },
    ],
  },
  {
    type: 'radio',
    key: 'tried_result',
    title: 'Какой результат это давало?',
    options: [
      { value: 'returned_with_extra', label: 'Вес уходил, но возвращался с прибавкой' },
      { value: 'short_term', label: 'Уходил на короткое время, потом снова накапливался' },
      { value: 'nothing', label: 'Вообще не уходил, как ни старалась' },
      { value: 'exhausted', label: 'Уходил, но я ходила измотанная, голодная и несчастная' },
    ],
  },
  {
    type: 'radio',
    key: 'motivation',
    title: 'Что для вас важнее сейчас?',
    options: [
      { value: 'fast_date', label: 'Найти быстрое решение и сбросить вес к определённой дате или событию' },
      { value: 'causes_forever', label: 'Разобраться в причинах и решить проблему навсегда' },
      { value: 'health_first', label: 'Восстановить здоровье, а вес уйдёт как побочный эффект' },
      { value: 'where_to_start', label: 'Просто понять с чего начать — голова кругом' },
    ],
  },
  {
    type: 'radio',
    key: 'readiness',
    title: 'Готовы ли вы серьёзно работать со своим здоровьем?',
    options: [
      { value: 'ready_full', label: 'Да, готова сдать анализы, разобраться с дефицитами, пить БАДы по схеме' },
      { value: 'ready_with_help', label: 'Готова, но нужны конкретные рекомендации — самой страшно' },
      { value: 'understand_first', label: 'Хочу разобраться сначала, что вообще делать' },
      { value: 'not_ready', label: 'Пока не готова на серьёзный шаг, но интересно узнать подробнее' },
    ],
  },
  { type: 'contacts' },
]

const TOTAL = STEPS.length

function canProceed(step: number, answers: Answers): boolean {
  const s = STEPS[step]
  if (s.type === 'radio') return !!answers[s.key]
  if (s.type === 'checkbox') {
    const val = answers[s.key]
    return Array.isArray(val) && val.length > 0
  }
  if (s.type === 'contacts') {
    if (answers.name.trim().length < 2) return false
    if (!answers.contact_tg.trim() && !answers.contact_wa.trim()) return false
    if (answers.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.contact_email)) return false
    return true
  }
  return false
}

function toggleCheckbox(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
}

export default function DiagnosticForm() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const current = STEPS[step]
  const progress = Math.round(((step + 1) / TOTAL) * 100)
  const isLast = step === TOTAL - 1
  const ok = canProceed(step, answers)

  function setRadio(key: keyof Answers, value: string) {
    setAnswers(a => ({ ...a, [key]: value }))
  }

  function setCheck(key: keyof Answers, value: string) {
    setAnswers(a => ({
      ...a,
      [key]: toggleCheckbox(a[key] as string[], value),
    }))
  }

  async function handleSubmit() {
    if (!ok || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/public/club-diagnostic-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Что-то пошло не так. Попробуйте ещё раз или напишите нам в Telegram.')
        return
      }
      setDone(true)
    } catch {
      setError('Нет соединения. Проверьте интернет и попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return <DiagnosticThanks />
  }

  return (
    <div className="diag-form">
      {/* Progress */}
      <div className="diag-progress">
        <span className="diag-progress__label">Вопрос {step + 1} из {TOTAL}</span>
        <div className="diag-progress__track">
          <div className="diag-progress__fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="diag-question">
        {current.type !== 'contacts' && (
          <>
            <h3 className="diag-question__title">{current.title}</h3>
            {'hint' in current && current.hint && (
              <p className="diag-question__hint">{current.hint}</p>
            )}
          </>
        )}

        {current.type === 'radio' && (
          <div className="diag-options">
            {current.options.map(opt => {
              const selected = answers[current.key] === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`diag-option${selected ? ' is-selected' : ''}`}
                  onClick={() => setRadio(current.key, opt.value)}
                >
                  <span className={`diag-option__radio${selected ? ' is-checked' : ''}`} />
                  <span className="diag-option__label">{opt.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {current.type === 'checkbox' && (
          <div className="diag-options">
            {current.options.map(opt => {
              const arr = answers[current.key] as string[]
              const selected = arr.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`diag-option${selected ? ' is-selected' : ''}`}
                  onClick={() => setCheck(current.key, opt.value)}
                >
                  <span className={`diag-option__check${selected ? ' is-checked' : ''}`}>
                    {selected && '✓'}
                  </span>
                  <span className="diag-option__label">{opt.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {current.type === 'contacts' && (
          <div className="diag-contacts">
            <h3 className="diag-question__title">Как с вами связаться?</h3>

            <label className="diag-field">
              <span className="diag-field__label">Ваше имя <span className="diag-field__req">*</span></span>
              <input
                className="diag-input"
                type="text"
                placeholder="Ваше имя"
                value={answers.name}
                onChange={e => setAnswers(a => ({ ...a, name: e.target.value }))}
              />
            </label>

            <label className="diag-field">
              <span className="diag-field__label">
                Telegram <span className="diag-field__req">*</span><span className="diag-field__or"> (или WhatsApp ниже)</span>
              </span>
              <input
                className="diag-input"
                type="text"
                placeholder="@username или ссылка"
                value={answers.contact_tg}
                onChange={e => setAnswers(a => ({ ...a, contact_tg: e.target.value }))}
              />
            </label>

            <label className="diag-field">
              <span className="diag-field__label">WhatsApp</span>
              <input
                className="diag-input"
                type="text"
                placeholder="Номер телефона"
                value={answers.contact_wa}
                onChange={e => setAnswers(a => ({ ...a, contact_wa: e.target.value }))}
              />
            </label>

            <p className="diag-hint-contact">Укажите хотя бы один способ связи — Telegram или WhatsApp</p>

            <label className="diag-field">
              <span className="diag-field__label">Email</span>
              <input
                className="diag-input"
                type="email"
                placeholder="Если хотите продублировать"
                value={answers.contact_email}
                onChange={e => setAnswers(a => ({ ...a, contact_email: e.target.value }))}
              />
            </label>

            <label className="diag-field">
              <span className="diag-field__label">Дополнительно</span>
              <textarea
                className="diag-input diag-textarea"
                rows={4}
                placeholder="Если хотите что-то добавить о своей ситуации — напишите здесь"
                value={answers.comment}
                onChange={e => setAnswers(a => ({ ...a, comment: e.target.value }))}
              />
            </label>
          </div>
        )}
      </div>

      {/* Error */}
      {error && <p className="diag-error">{error}</p>}

      {/* Navigation */}
      <div className="diag-nav">
        {step > 0 ? (
          <button
            type="button"
            className="diag-nav__back"
            onClick={() => setStep(s => s - 1)}
          >
            <span className="diag-nav__back-arrow">←</span>
            <span className="diag-nav__back-label">Назад</span>
          </button>
        ) : (
          <span />
        )}

        {isLast ? (
          <button
            type="button"
            className={`btn btn--orange btn--lg diag-nav__next${!ok ? ' is-disabled' : ''}`}
            disabled={!ok || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Отправляем…' : 'Отправить анкету'}
          </button>
        ) : (
          <button
            type="button"
            className={`btn btn--green btn--lg diag-nav__next${!ok ? ' is-disabled' : ''}`}
            disabled={!ok}
            onClick={() => { if (ok) setStep(s => s + 1) }}
          >
            Далее →
          </button>
        )}
      </div>
    </div>
  )
}
