'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ── Типы ─────────────────────────────────────────────────────────────────────
interface PlanIngredient {
  name: string; grams: number
  calories: number; protein: number; fat: number; carbs: number
  is_user_product: boolean
}

interface PlanMeal {
  meal_type: 'завтрак' | 'обед' | 'ужин' | 'суп' | 'салат'
  recipe_id: number | string
  title: string
  steps: string[]
  ingredients: PlanIngredient[]
  total: { calories: number; protein: number; fat: number; carbs: number }
  requires_shopping: string[]
  servings: number
  portions_to_cook: number
  is_repeat?: boolean
  repeat_from_day?: number
  repeat_meal_type?: string
}

interface PlanDay {
  day_number: number; day_name: string
  cook_group: number; is_cook_day: boolean; cook_group_days: string
  meals: PlanMeal[]
  day_total: { calories: number; protein: number; fat: number; carbs: number }
}

interface WeeklyPlan {
  id: string
  created_at: string
  member_name: string
  meals_per_day: number
  include_soups: boolean
  cook_mode: 'daily' | 'every2days'
  kbju_calories: number; kbju_protein: number; kbju_fat: number; kbju_carbs: number
  plan_json: {
    days: PlanDay[]
    summary: { avg_calories: number; avg_protein: number; avg_fat: number; avg_carbs: number }
  }
  /** @deprecated Removed 17 May 2026. Kept optional for backward compatibility with old plans in DB. */
  shopping_list_json?: { have: { name: string; total_grams: number }[]; buy: { name: string; total_grams: number }[] }
}

// ── Хелперы ───────────────────────────────────────────────────────────────────
function getPorcionWord(n: number): string {
  const abs = Math.abs(Math.round(n))
  const mod10  = abs % 10
  const mod100 = abs % 100
  if (mod100 >= 11 && mod100 <= 19) return 'порций'
  if (mod10 === 1) return 'порция'
  if (mod10 >= 2 && mod10 <= 4) return 'порции'
  return 'порций'
}

/** Форматирует граммы. Для яиц добавляет «≈N шт.» */
function fmtGrams(name: string, grams: number): string {
  const lower = name.toLowerCase()
  if (/яйц[оа]/i.test(lower)) {
    const eggWeight = lower.includes('перепел') ? 12 : 60
    const count = Math.round(grams / eggWeight)
    if (count >= 1) return `${grams}г (≈${count} шт.)`
  }
  return `${grams}г`
}

// ── Цвета приёмов ─────────────────────────────────────────────────────────────
const MEAL_COLORS: Record<string, { bg: string; border: string; numBg: string; label: string; num: string }> = {
  завтрак: { bg: '#EEF5EF', border: '#C8DDC9', numBg: '#7A9E7E', label: '#4A5E4B', num: '1' },
  обед:    { bg: '#FDE8D5', border: '#F5C8A0', numBg: '#E8845A', label: '#6A4030', num: '2' },
  ужин:    { bg: '#EEF0FF', border: '#C8CCDD', numBg: '#7C5CFC', label: '#3A3070', num: '3' },
  суп:     { bg: '#F0F6FF', border: '#B8D0F0', numBg: '#5090C0', label: '#2A4870', num: '🍲' },
  салат:   { bg: '#F2FBF2', border: '#B0DDB0', numBg: '#5A9E5A', label: '#2A5E2A', num: '🥗' },
}

function mealLabel(t: string): string {
  const m: Record<string, string> = { завтрак: 'Приём 1', обед: 'Приём 2', ужин: 'Приём 3', суп: 'Суп', салат: 'Салат' }
  return m[t] ?? t
}

function dayOfWeekShort(n: number) { return ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][n - 1] }

const MEAL_TYPE_OPTIONS = [
  { value: 'breakfast', label: 'Завтрак'     },
  { value: 'lunch',     label: 'Обед / Ужин' },
  { value: 'snack',     label: 'Перекус'     },
] as const
type MealType = typeof MEAL_TYPE_OPTIONS[number]['value']

// ── Правила пользования ───────────────────────────────────────────────────────
const RULES = [
  { icon: '🔄', text: 'Если какой-то рецепт/блюдо не нравится, можно подобрать/заменить на другой в Умной кухне.' },
  { icon: '🎯', text: 'Рацион подобран под твои личные цели по КБЖУ — старайся соблюдать порции' },
  { icon: '🍲', text: 'Суп варится ОДИН РАЗ в день 1 — кушаешь по 1 порции два дня подряд' },
  { icon: '🥗', text: 'Салат готовится свежим каждый день — не удваивается и не повторяется' },
  { icon: '📦', text: 'В режиме «на 2 дня» — готовишь двойную порцию и убираешь половину в контейнер' },
  { icon: '🔄', text: 'Блюда с пометкой ♻️ — это готовое из предыдущего дня, просто разогрей' },
  { icon: '🛒', text: 'Оранжевые ингредиенты — нужно купить. Уточняй необходимые продукты в карточках блюд.' },
  { icon: '🥦', text: 'Овощи, зелень и ягоды взаимозаменяемы — используй сезонные и доступные. Брокколи ↔ цветная капуста ↔ кабачок ↔ шпинат ↔ стручковая фасоль — всё взаимозаменяемо. Ягоды в десертах тоже можно менять по сезону.' },
  { icon: '🍎', text: 'Если норма углеводов кажется низкой — добавь к приёму пищи фрукт, небольшую порцию любой крупы, или десерт (НО! в пределах макросов). Это не нарушит метод, а поможет чувствовать себя сытой.' },
]

function RulesAccordion({ forceOpen }: { forceOpen?: boolean }) {
  const [open, setOpen] = useState(false)
  const isOpen = forceOpen || open
  return (
    <div className="rounded-2xl mb-6 overflow-hidden no-print"
      style={{ background: '#fff', border: '1px solid #D4E6D5', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        style={{ fontFamily: 'var(--font-nunito)' }}
      >
        <span className="text-sm font-bold" style={{ color: '#2D3A2E' }}>📋 Как пользоваться рационом</span>
        <span style={{ display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: '#7A9E7E', fontSize: 18, lineHeight: 1 }}>▾</span>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 accordion-content">
          <div className="h-px mb-4" style={{ background: '#D4E6D5' }} />
          <ul className="flex flex-col gap-3">
            {RULES.map((rule, i) => (
              <li key={i} className="flex gap-3 items-start text-[13px] leading-snug"
                style={{ color: '#4A5E4B', fontFamily: 'var(--font-nunito)' }}>
                <span className="text-base shrink-0 mt-0.5">{rule.icon}</span>
                <span>{rule.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Карточка блюда ────────────────────────────────────────────────────────────
function MealCard({ meal, userId }: { meal: PlanMeal; userId: string }) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [diaryOpen, setDiaryOpen] = useState(false)
  const [diaryLoading, setDiaryLoading] = useState(false)

  async function handleSave() {
    if (saved || saving) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('saved_recipes').insert({
      member_id:     userId,
      title:         meal.title,
      meal_type:     meal.meal_type,
      ingredients:   meal.ingredients,
      steps:         meal.steps,
      kbju_calories: meal.total.calories,
      kbju_protein:  Math.round(meal.total.protein),
      kbju_fat:      Math.round(meal.total.fat),
      kbju_carbs:    Math.round(meal.total.carbs),
    })
    setSaving(false)
    if (!error) setSaved(true)
  }

  async function handleDiaryAdd(mealType: MealType) {
    setDiaryLoading(true)
    const today = new Date().toISOString().split('T')[0]
    await fetch('/api/diary/entries', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date:      today,
        meal_type: mealType,
        title:     meal.title,
        calories:  meal.total.calories,
        protein:   Math.round(meal.total.protein),
        fat:       Math.round(meal.total.fat),
        carbs:     Math.round(meal.total.carbs),
        source:    'bot',
      }),
    })
    setDiaryLoading(false)
    setDiaryOpen(false)
  }

  const c = MEAL_COLORS[meal.meal_type] ?? MEAL_COLORS.обед

  if (meal.is_repeat) {
    const fromDay = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'][(meal.repeat_from_day ?? 1) - 1]
    return (
      <div className="meal-card rounded-[20px] overflow-hidden"
        style={{ background: '#fff', border: '1px solid #E8DEDD', boxShadow: '0 2px 16px rgba(0,0,0,.06)' }}>
        <div className="flex items-center gap-3 px-5 py-3.5"
          style={{ background: c.bg, borderBottom: `2px solid ${c.border}` }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
            style={{ background: c.numBg }}>{c.num}</div>
          <div className="text-sm font-extrabold leading-snug" style={{ color: '#2D3A2E' }}>{meal.title}</div>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
            style={{ background: '#EEF5EF', border: '1px solid #C8DDC9', color: '#4A5E4B' }}>
            <span>♻️</span>
            <span>Рецепт из {fromDay} · {mealLabel(meal.repeat_meal_type ?? meal.meal_type)}</span>
          </div>
          <p className="text-xs mt-2" style={{ color: '#888', fontFamily: 'var(--font-nunito)' }}>
            Используйте готовое блюдо, приготовленное ранее.
          </p>
        </div>
      </div>
    )
  }

  const n = meal.portions_to_cook > 1 ? meal.portions_to_cook : Math.max(1, meal.servings)
  const portionsLabel = `${n} ${getPorcionWord(n)}`

  return (
    <div className="meal-card rounded-[20px] overflow-hidden"
      style={{ background: '#fff', border: '1px solid #E8DEDD', boxShadow: '0 2px 16px rgba(0,0,0,.06)' }}>
      <div className="flex items-center gap-3 px-5 py-3.5"
        style={{ background: c.bg, borderBottom: `2px solid ${c.border}` }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
          style={{ background: c.numBg }}>{c.num}</div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: c.label }}>{mealLabel(meal.meal_type)}</div>
          <div className="text-sm font-extrabold leading-snug" style={{ color: '#2D3A2E' }}>{meal.title}</div>
        </div>
      </div>

      <div className="px-5 py-4">
        {meal.meal_type === 'салат' && (
          <p className="text-[11px] font-semibold mb-3 px-3 py-1.5 rounded-lg"
            style={{ background: '#F2FBF2', color: '#5A9E5A', border: '1px solid #B0DDB0', fontFamily: 'var(--font-nunito)' }}>
            🥗 Готовим свежим каждый день
          </p>
        )}

        {meal.ingredients.length > 0 && (
          <div className="mb-4">
            <div className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: '#7A9E7E', letterSpacing: '1.5px' }}>
              🛒 Ингредиенты · {portionsLabel}
            </div>
            <ul className="flex flex-col">
              {meal.ingredients.map((ing, i) => (
                <li key={i} className="flex items-baseline justify-between py-1.5"
                  style={{ borderBottom: i < meal.ingredients.length - 1 ? '1px dashed #eee' : 'none' }}>
                  <span className="text-[13.5px]" style={{ color: ing.is_user_product ? '#2D3A2E' : '#E87050' }}>
                    {!ing.is_user_product && <span className="mr-1">🛒</span>}{ing.name}
                  </span>
                  <span className="text-[12.5px] font-bold ml-2 shrink-0" style={{ color: '#4A5E4B' }}>
                    {fmtGrams(ing.name, ing.grams)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-2 flex-wrap mb-4">
          {[
            { label: 'Ккал', val: meal.total.calories },
            { label: 'Б',    val: Math.round(meal.total.protein) },
            { label: 'Ж',    val: Math.round(meal.total.fat) },
            { label: 'У',    val: Math.round(meal.total.carbs) },
          ].map(({ label, val }) => (
            <span key={label} className="text-xs px-2 py-1 rounded-lg font-semibold"
              style={{ background: '#F5F0FF', color: '#7C5CFC', fontFamily: 'var(--font-nunito)' }}>
              {label}: {val}
            </span>
          ))}
        </div>

        {meal.steps.length > 0 && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color: '#E8845A', letterSpacing: '1.5px' }}>
              👨‍🍳 Приготовление
            </div>
            <ol className="flex flex-col gap-1.5">
              {meal.steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-snug py-1.5"
                  style={{ borderBottom: i < meal.steps.length - 1 ? '1px solid #f5f5f5' : 'none', color: '#555' }}>
                  <span className="shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-black mt-0.5"
                    style={{ background: '#EEF5EF', color: '#7A9E7E' }}>{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Кнопки */}
        <div className="pt-3 flex flex-col gap-2 no-print">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saved || saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
              style={{
                minHeight:  44,
                fontFamily: 'var(--font-nunito)',
                background: saved ? '#A8E6CF33' : '#fff',
                color:      saved ? '#2D6A4F'   : '#4A5E4B',
                border:     `1.5px solid ${saved ? '#A8E6CF' : '#D4E6D5'}`,
              }}>
              {saving ? '...' : saved ? '✓ Сохранено' : '⭐ Сохранить'}
            </button>
            <button
              onClick={() => setDiaryOpen(v => !v)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                minHeight:  44,
                fontFamily: 'var(--font-nunito)',
                background: diaryOpen ? '#E8F0FF' : '#fff',
                color:      diaryOpen ? '#5060C8' : '#4A5E4B',
                border:     `1.5px solid ${diaryOpen ? '#B8C8F0' : '#D4E6D5'}`,
              }}>
              📓 В дневник
            </button>
          </div>
          {diaryOpen && (
            <div className="flex gap-2">
              {MEAL_TYPE_OPTIONS.map(mt => (
                <button
                  key={mt.value}
                  onClick={() => handleDiaryAdd(mt.value)}
                  disabled={diaryLoading}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  style={{
                    minHeight:  40,
                    fontFamily: 'var(--font-nunito)',
                    background: '#7C5CFC',
                    color:      '#fff',
                  }}>
                  {mt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Основной компонент ────────────────────────────────────────────────────────
export default function WeeklyPlanView({ plan, userId }: { plan: WeeklyPlan; userId: string }) {
  const days = plan.plan_json.days
  const summary = plan.plan_json.summary
  const kbju = { calories: plan.kbju_calories, protein: plan.kbju_protein, fat: plan.kbju_fat, carbs: plan.kbju_carbs }

  const [activeDay, setActiveDay] = useState(1)
  const [showAllDays, setShowAllDays] = useState(false)

  const activeData = days.find(d => d.day_number === activeDay) ?? days[0]

  const handleDownloadPdf = () => {
    window.location.href = `/api/kitchen/weekly/${plan.id}/pdf`
  }

  return (
    <div className="min-h-screen" style={{ background: '#FDF8F0' }}>

      {/* ── HERO ── */}
      <div className="text-white text-center relative overflow-hidden px-5 py-10"
        style={{ background: 'linear-gradient(135deg, #6A3A2A 0%, #A05A3A 55%, #E8845A 100%)' }}>
        <div className="hidden print:block absolute top-4 left-4 text-xs opacity-60">
          Клуб Вкус Жизни · vkuszhizni.ru
        </div>
        <div className="inline-block px-5 py-1.5 rounded-full text-xs uppercase tracking-widest mb-4"
          style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)' }}>
          🥗 Рацион на неделю
        </div>
        <h1 className="text-3xl font-black mb-2" style={{ fontFamily: 'var(--font-unbounded)' }}>
          {plan.member_name || 'Рацион на неделю'}
        </h1>
        <p className="text-base opacity-80 mb-6" style={{ fontFamily: 'var(--font-nunito)' }}>
          {plan.meals_per_day}-разовое питание · 7 дней
        </p>
        <div className="flex justify-center gap-3 no-print">
          <button onClick={handleDownloadPdf}
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.4)', color: '#fff', fontFamily: 'var(--font-nunito)' }}>
            ⬇️ Скачать PDF
          </button>
          <Link href="/dashboard/kitchen/weekly"
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontFamily: 'var(--font-nunito)' }}>
            ← К рационам
          </Link>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 py-6 lg:px-8">

        {/* ── Info bar ── */}
        <div className="flex flex-wrap gap-3 rounded-2xl px-5 py-4 mb-6 no-print"
          style={{ background: '#fff', border: '1px solid #D4E6D5', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
          <div className="flex items-center gap-2 text-sm"><span>🗓️</span><span style={{ color: '#2D3A2E' }}><strong>7 дней</strong> рациона</span></div>
          <div className="flex items-center gap-2 text-sm"><span>🍽️</span><span style={{ color: '#2D3A2E' }}><strong>{plan.meals_per_day} приёма</strong> в день</span></div>
          <div className="flex items-center gap-2 text-sm">
            <span>{plan.cook_mode === 'every2days' ? '📦' : '🍳'}</span>
            <span style={{ color: '#2D3A2E' }}><strong>{plan.cook_mode === 'every2days' ? 'Готовим на 2 дня' : 'Каждый день'}</strong></span>
          </div>
          {plan.include_soups && <div className="flex items-center gap-2 text-sm"><span>🍲</span><span style={{ color: '#2D3A2E' }}>С <strong>супами</strong></span></div>}
        </div>

        {/* ── Правила ── */}
        <RulesAccordion />

        {/* ── Табы дней ── */}
        {!showAllDays && (
          <div className="overflow-x-auto -mx-4 px-4 mb-6 no-print">
            <div className="flex gap-1.5 min-w-max">
              {days.map(day => (
                <button
                  key={day.day_number}
                  onClick={() => setActiveDay(day.day_number)}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: activeDay === day.day_number ? '#E8845A' : '#fff',
                    color:      activeDay === day.day_number ? '#fff' : '#4A5E4B',
                    border: `1px solid ${activeDay === day.day_number ? '#E8845A' : '#D4E6D5'}`,
                    fontFamily: 'var(--font-nunito)',
                  }}
                >
                  {dayOfWeekShort(day.day_number)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Один день (интерактив) ── */}
        {!showAllDays && activeData && (
          <DaySection day={activeData} kbju={kbju} userId={userId} />
        )}

        {/* ── Все дни (print + showAllDays) ── */}
        {showAllDays && (
          <div>
            {days.map((day, i) => (
              <div key={day.day_number} className={i > 0 ? 'print-page-break' : ''}>
                <DaySection day={day} kbju={kbju} userId={userId} />
              </div>
            ))}
          </div>
        )}

      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .meal-card { break-inside: avoid; }
          .print-page-break { page-break-before: always; }
          .accordion-content { display: block !important; }
          .accordion-header-arrow { display: none !important; }
        }
      `}</style>
    </div>
  )
}

// ── Секция дня ────────────────────────────────────────────────────────────────
function DaySection({ day, kbju, userId }: {
  day: PlanDay
  kbju: { calories: number; protein: number; fat: number; carbs: number }
  userId: string
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="px-4 py-1.5 rounded-xl text-[13px] font-black tracking-wide text-white"
          style={{ background: '#2D3A2E', whiteSpace: 'nowrap', fontFamily: 'var(--font-nunito)' }}>
          ДЕНЬ {day.day_number}
        </div>
        <div className="flex-1 h-px" style={{ background: '#D4E6D5' }} />
        {day.is_cook_day && day.cook_group_days.includes('+') && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full no-print"
            style={{ background: '#E8845A18', color: '#E8845A', border: '1px solid #E8845A30', fontFamily: 'var(--font-nunito)' }}>
            🍳 Готовим на 2 дня
          </span>
        )}
      </div>

      <p className="text-sm font-semibold mb-4" style={{ color: '#4A5E4B', fontFamily: 'var(--font-nunito)' }}>
        {day.day_name}{!day.is_cook_day && day.cook_group_days.includes('+') && (
          <span className="text-xs font-normal ml-1" style={{ color: '#888' }}>
            · блюда из {day.cook_group_days.split(' + ')[0]}а
          </span>
        )}
      </p>

      <div className="grid gap-4 lg:grid-cols-2 mb-4">
        {day.meals.map((meal, i) => (
          <MealCard key={i} meal={meal} userId={userId} />
        ))}
      </div>

      <div className="rounded-2xl px-4 py-3 flex flex-wrap gap-3 items-center"
        style={{ background: '#EEF5EF', border: '1px solid #C8DDC9' }}>
        <span className="text-sm font-bold" style={{ color: '#2D3A2E', fontFamily: 'var(--font-nunito)' }}>Итог дня:</span>
        {[
          { label: 'Ккал', got: day.day_total.calories, goal: kbju.calories },
          { label: 'Б',    got: Math.round(day.day_total.protein), goal: kbju.protein },
          { label: 'Ж',    got: Math.round(day.day_total.fat),     goal: kbju.fat },
          { label: 'У',    got: Math.round(day.day_total.carbs),   goal: kbju.carbs },
        ].map(({ label, got, goal }) => (
          <span key={label} className="text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={{ background: '#fff', color: '#4A5E4B', fontFamily: 'var(--font-nunito)' }}>
            {label}: <strong>{got}</strong>/{goal}
          </span>
        ))}
      </div>
    </div>
  )
}


