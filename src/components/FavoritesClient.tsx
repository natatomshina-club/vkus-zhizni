'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Ingredient = { name: string; amount?: string; unit?: string; grams?: number }

type Recipe = {
  id: string
  title: string
  description?: string | null
  meal_type?: string | null
  ingredients?: Ingredient[] | null
  steps?: string[] | null
  time_minutes?: number | null
  kbju_calories?: number | null
  kbju_protein?: number | null
  kbju_fat?: number | null
  kbju_carbs?: number | null
  created_at: string
}

type Props = {
  userId: string
  initialRecipes: Recipe[]
  totalCount: number
  maxCount: number
}

const MEAL_FILTERS = ['Все', 'Завтрак', 'Обед/Ужин', 'Салат', 'Суп', 'Десерт']

// Значения из БД → отображаемый лейбл на карточке
const CATEGORY_LABEL: Record<string, string> = {
  завтрак:   'Завтрак',
  обед_ужин: 'Обед/Ужин',
  обед:      'Обед',
  ужин:      'Ужин',
  салат:     'Салат',
  суп:       'Суп',
  десерт:    'Десерт',
}

// Фильтр-лейбл → набор значений БД для сравнения
const FILTER_DB_VALUES: Record<string, string[]> = {
  'Завтрак':   ['завтрак'],
  'Обед/Ужин': ['обед_ужин', 'обед', 'ужин'],
  'Салат':     ['салат'],
  'Суп':       ['суп'],
  'Десерт':    ['десерт'],
}

const KBJU_META = [
  { key: 'kbju_calories' as const, label: 'ккал', bg: 'var(--pur-light)',  color: 'var(--pur)'  },
  { key: 'kbju_protein'  as const, label: 'Б',    bg: 'var(--grn-light)',  color: '#1A5C3A'     },
  { key: 'kbju_fat'      as const, label: 'Ж',    bg: 'var(--yel-light)',  color: '#8B6000'     },
  { key: 'kbju_carbs'    as const, label: 'У',    bg: 'var(--ora-light)',  color: '#A04000'     },
]

const MEAL_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  завтрак:   { bg: 'var(--yel-light)', color: '#8B6000'      },
  обед_ужин: { bg: 'var(--grn-light)', color: '#1A5C3A'      },
  обед:      { bg: 'var(--grn-light)', color: '#1A5C3A'      },
  ужин:      { bg: 'var(--pur-light)', color: 'var(--pur)'   },
  салат:     { bg: 'var(--grn-light)', color: '#2D6A4F'      },
  суп:       { bg: '#FFF4E6',          color: '#A05A00'      },
  десерт:    { bg: '#FFF0F6',          color: '#A0206A'      },
}

const DIARY_MEAL_OPTIONS = [
  { value: 'breakfast', label: 'Завтрак'        },
  { value: 'lunch',     label: 'Обед / Ужин'    },
  { value: 'snack',     label: 'Дополнительный' },
]

export default function FavoritesClient({ userId, initialRecipes, totalCount, maxCount }: Props) {
  const [recipes, setRecipes]         = useState<Recipe[]>(initialRecipes)
  const [count, setCount]             = useState(totalCount)
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState('Все')
  const [deletingId, setDeletingId]     = useState<string | null>(null)
  const [confirmId, setConfirmId]       = useState<string | null>(null)
  const [diaryOpenId, setDiaryOpenId]   = useState<string | null>(null)
  const [diaryLoadingId, setDiaryLoadingId] = useState<string | null>(null)
  const [diaryMsg, setDiaryMsg]         = useState('')
  const [expanded, setExpanded]         = useState<string | null>(null)
  const [diaryMeal, setDiaryMeal]       = useState('')
  const [diaryDateMode, setDiaryDateMode] = useState<'today' | 'yesterday' | 'custom'>('today')
  const [diaryCustomDate, setDiaryCustomDate] = useState('')

  // ── Client-side filtering ──────────────────────────────
  const visible = recipes.filter(r => {
    const matchSearch = !search.trim() || r.title.toLowerCase().includes(search.toLowerCase())
    const dbValues = FILTER_DB_VALUES[filter]
    const matchFilter = filter === 'Все' || (!!r.meal_type && dbValues?.includes(r.meal_type))
    return matchSearch && matchFilter
  })

  // ── Delete ────────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeletingId(id)
    setTimeout(async () => {
      const supabase = createClient()
      await supabase.from('saved_recipes').delete().eq('id', id).eq('member_id', userId)
      setRecipes(prev => prev.filter(r => r.id !== id))
      setCount(prev => prev - 1)
      setDeletingId(null)
      setConfirmId(null)
    }, 300)
  }

  // ── Add to diary ──────────────────────────────────────
  function openDiary(id: string) {
    setDiaryOpenId(prev => prev === id ? null : id)
    setDiaryMeal('')
    setDiaryDateMode('today')
    setDiaryCustomDate('')
  }

  function getSelectedDate(): string {
    if (diaryDateMode === 'custom' && diaryCustomDate) return diaryCustomDate
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    if (diaryDateMode === 'yesterday') d.setDate(d.getDate() - 1)
    return d.toISOString().split('T')[0]
  }

  async function handleDiary(recipe: Recipe) {
    if (!diaryMeal) return
    setDiaryLoadingId(recipe.id)
    const res = await fetch('/api/diary/entries', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date:      getSelectedDate(),
        meal_type: diaryMeal,
        title:     recipe.title,
        calories:  recipe.kbju_calories ?? 0,
        protein:   recipe.kbju_protein  ?? 0,
        fat:       recipe.kbju_fat      ?? 0,
        carbs:     recipe.kbju_carbs    ?? 0,
        source:    'favorite',
      }),
    })
    setDiaryLoadingId(null)
    setDiaryOpenId(null)
    setDiaryMsg(res.ok ? '📓 Добавлено в дневник!' : 'Ошибка записи')
    setTimeout(() => setDiaryMsg(''), 3000)
  }

  const todayStr = new Date().toISOString().split('T')[0]

  const pct = Math.min(100, Math.round((count / maxCount) * 100))

  return (
    <div className="flex flex-col gap-5">

      {/* ── Counter + progress bar ── */}
      <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
            Сохранено рецептов
          </p>
          <span className="text-sm font-bold" style={{ color: 'var(--pur)', fontFamily: 'var(--font-unbounded)' }}>
            {count} / {maxCount}
          </span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: pct > 80 ? '#E74C3C' : 'var(--pur)' }}
          />
        </div>
      </div>

      {/* ── Search ── */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Поиск по названию..."
        className="w-full px-4 py-3 rounded-2xl border text-sm outline-none transition-all"
        style={{
          fontFamily: 'var(--font-nunito)',
          color: 'var(--text)',
          borderColor: 'var(--border)',
          background: 'var(--card)',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--pur)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      />

      {/* ── Meal type filters ── */}
      <div className="flex gap-2 flex-wrap">
        {MEAL_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-full text-xs font-semibold border transition-all"
            style={{
              fontFamily: 'var(--font-nunito)',
              background: filter === f ? 'var(--pur)' : 'var(--card)',
              color:      filter === f ? '#fff' : 'var(--text)',
              borderColor: filter === f ? 'var(--pur)' : 'var(--border)',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Diary success msg ── */}
      {diaryMsg && (
        <p className="text-sm text-center font-semibold" style={{ color: '#2A9D5C', fontFamily: 'var(--font-nunito)' }}>
          {diaryMsg}
        </p>
      )}

      {/* ── Empty state ── */}
      {visible.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="text-5xl">⭐</span>
          {recipes.length === 0 ? (
            <>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                Пока нет сохранённых рецептов.
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                Иди в Умную кухню и сохрани первый! 🍳
              </p>
              <a
                href="/dashboard/kitchen"
                className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, var(--pur) 0%, #9B7CFF 100%)', fontFamily: 'var(--font-nunito)' }}
              >
                Умная кухня →
              </a>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              По запросу ничего не найдено
            </p>
          )}
        </div>
      )}

      {/* ── Recipes grid ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(recipe => {
          const isDeleting = deletingId === recipe.id
          const isConfirm  = confirmId  === recipe.id
          const isExpanded = expanded   === recipe.id
          const mealColors = MEAL_TYPE_COLORS[recipe.meal_type ?? ''] ?? { bg: 'var(--pur-light)', color: 'var(--pur)' }

          return (
            <div
              key={recipe.id}
              className="rounded-2xl overflow-hidden flex flex-col transition-all"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                opacity: isDeleting ? 0 : 1,
                transform: isDeleting ? 'scale(0.95)' : 'scale(1)',
                transition: 'opacity 0.3s ease, transform 0.3s ease',
              }}
            >
              {/* Card header */}
              <div className="px-4 pt-4 pb-3 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  {recipe.meal_type && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: mealColors.bg, color: mealColors.color, fontFamily: 'var(--font-nunito)' }}
                    >
                      {CATEGORY_LABEL[recipe.meal_type ?? ''] ?? recipe.meal_type}
                    </span>
                  )}
                  {recipe.time_minutes && (
                    <span className="text-[10px] ml-auto shrink-0" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                      ⏱ {recipe.time_minutes} мин
                    </span>
                  )}
                </div>

                <p className="text-sm font-bold leading-snug" style={{ color: 'var(--text)', fontFamily: 'var(--font-unbounded)' }}>
                  {recipe.title}
                </p>

                {recipe.description && (
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                    {recipe.description}
                  </p>
                )}

                {/* КБЖУ chips */}
                {recipe.kbju_calories && (
                  <div className="flex flex-wrap gap-1">
                    {KBJU_META.map(({ key, label, bg, color }) => (
                      recipe[key] != null && (
                        <span
                          key={key}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: bg, color, fontFamily: 'var(--font-nunito)' }}
                        >
                          {label === 'ккал' ? `${recipe[key]} ккал` : `${label}: ${recipe[key]}г`}
                        </span>
                      )
                    ))}
                  </div>
                )}
              </div>

              {/* Expandable details */}
              {(recipe.ingredients?.length || recipe.steps?.length) ? (
                <div className="px-4 pb-2">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : recipe.id)}
                    className="text-xs font-semibold transition-all"
                    style={{ color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
                  >
                    {isExpanded ? '▲ Скрыть рецепт' : '▼ Показать рецепт'}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 flex flex-col gap-3">
                      {recipe.ingredients && recipe.ingredients.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                            Ингредиенты
                          </p>
                          <ul className="flex flex-col gap-1">
                            {recipe.ingredients.map((ing, i) => {
                              const qty = ing.grams != null
                                ? `${ing.grams} г`
                                : ing.amount
                                  ? `${ing.amount}${ing.unit ? ' ' + ing.unit : ''}`
                                  : null
                              return (
                                <li key={i} className="flex justify-between text-xs py-1 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                                  <span style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>{ing.name}</span>
                                  {qty && (
                                    <span className="shrink-0 ml-2" style={{ color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
                                      {qty}
                                    </span>
                                  )}
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )}

                      {recipe.steps && recipe.steps.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                            Приготовление
                          </p>
                          <ol className="flex flex-col gap-2">
                            {recipe.steps.map((step, i) => (
                              <li key={i} className="flex gap-2 text-xs leading-relaxed">
                                <span
                                  className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                                  style={{ background: 'var(--pur)' }}
                                >
                                  {i + 1}
                                </span>
                                <span style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Action buttons */}
              <div className="mt-auto px-3 pb-3 pt-2 flex flex-col gap-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openDiary(recipe.id)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all"
                    style={{
                      fontFamily:  'var(--font-nunito)',
                      borderColor: '#2A9D5C',
                      color:       '#2A9D5C',
                      background:  diaryOpenId === recipe.id ? '#2A9D5C18' : 'transparent',
                    }}
                  >
                    📓 В дневник {diaryOpenId === recipe.id ? '▲' : '▼'}
                  </button>

                  {isConfirm ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(recipe.id)}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-white"
                      style={{ background: '#E74C3C', fontFamily: 'var(--font-nunito)' }}
                    >
                      Удалить
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="px-3 py-2 rounded-xl text-xs border"
                      style={{ borderColor: 'var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}
                    >
                      Нет
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(recipe.id)}
                    className="px-3 py-2 rounded-xl text-xs border transition-all"
                    style={{
                      fontFamily: 'var(--font-nunito)',
                      borderColor: 'var(--border)',
                      color: 'var(--muted)',
                      background: 'transparent',
                    }}
                  >
                    🗑
                  </button>
                )}
              </div>

              {/* Inline diary picker: meal + date + submit */}
              {diaryOpenId === recipe.id && (
                <div className="flex flex-col gap-2 pt-1">
                  {/* Step 1: meal type */}
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                    Приём пищи
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {DIARY_MEAL_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDiaryMeal(opt.value)}
                        className="flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                        style={{
                          fontFamily:  'var(--font-nunito)',
                          borderColor: diaryMeal === opt.value ? 'var(--pur)' : 'var(--border)',
                          color:       diaryMeal === opt.value ? '#fff' : 'var(--muted)',
                          background:  diaryMeal === opt.value ? 'var(--pur)' : 'transparent',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Step 2: date */}
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                    Дата
                  </p>
                  <div className="flex gap-1.5">
                    {(['today', 'yesterday', 'custom'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDiaryDateMode(mode)}
                        className="flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                        style={{
                          fontFamily:  'var(--font-nunito)',
                          borderColor: diaryDateMode === mode ? 'var(--pur)' : 'var(--border)',
                          color:       diaryDateMode === mode ? '#fff' : 'var(--muted)',
                          background:  diaryDateMode === mode ? 'var(--pur)' : 'transparent',
                        }}
                      >
                        {mode === 'today' ? 'Сегодня' : mode === 'yesterday' ? 'Вчера' : 'Другая ▼'}
                      </button>
                    ))}
                  </div>
                  {diaryDateMode === 'custom' && (
                    <input
                      type="date"
                      max={todayStr}
                      value={diaryCustomDate}
                      onChange={e => setDiaryCustomDate(e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-xs"
                      style={{
                        fontFamily:  'var(--font-nunito)',
                        borderColor: 'var(--border)',
                        color:       'var(--text)',
                        background:  'var(--bg)',
                      }}
                    />
                  )}

                  {/* Submit */}
                  <button
                    type="button"
                    disabled={!diaryMeal || diaryLoadingId === recipe.id || (diaryDateMode === 'custom' && !diaryCustomDate)}
                    onClick={() => handleDiary(recipe)}
                    className="w-full py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      fontFamily:  'var(--font-nunito)',
                      background:  diaryMeal ? '#2A9D5C' : 'var(--border)',
                      color:       diaryMeal ? '#fff' : 'var(--muted)',
                      opacity:     diaryLoadingId === recipe.id ? 0.6 : 1,
                    }}
                  >
                    {diaryLoadingId === recipe.id ? 'Сохраняем...' : 'Добавить в дневник'}
                  </button>
                </div>
              )}
            </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
