'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RecipePortionResult } from '@/lib/recipeCalculator'

// ── Types ──────────────────────────────────────────────────────────────────────
type Category = 'завтрак' | 'обед_ужин' | 'салат' | 'десерт' | 'суп'
type MealsPerDay = 2 | 3
type MealType = 'breakfast' | 'lunch' | 'snack'

interface KitchenResult {
  recipes: RecipePortionResult[]
  tip: string | null
  requests_left: number
  empty?: boolean
}

interface Props {
  userId: string
  isTrial: boolean
  maxRequests: number
  initialRequestsToday: number
  kbjuCalories: number | null
  kbjuProtein: number | null
  kbjuFat: number | null
  kbjuCarbs: number | null
}

// ── Constants ──────────────────────────────────────────────────────────────────
const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: 'завтрак',   label: 'Завтрак',   icon: '🌅' },
  { value: 'обед_ужин', label: 'Обед/Ужин', icon: '🍽' },
  { value: 'салат',     label: 'Салат',     icon: '🥗' },
  { value: 'десерт',    label: 'Десерт',    icon: '🍰' },
  { value: 'суп',       label: 'Суп',       icon: '🍲' },
]

const QUICK_PRODUCTS: { label: string; tag: string }[] = [
  { label: '🥩 Говядина',     tag: 'говядина'   },
  { label: '🍗 Курица',       tag: 'курица'     },
  { label: '🐟 Лосось/Сёмга', tag: 'лосось'    },
  { label: '🥚 Яйца',         tag: 'яйца'      },
  { label: '🧀 Сыр',          tag: 'сыр'       },
  { label: '🥦 Брокколи',     tag: 'брокколи'  },
  { label: '🥒 Огурец',       tag: 'огурец'    },
  { label: '🫑 Перец',        tag: 'перец'     },
  { label: '🥬 Шпинат',       tag: 'шпинат'    },
  { label: '🧈 Масло гхи',    tag: 'масло гхи' },
  { label: '🍶 Сметана',      tag: 'сметана'   },
  { label: '🥛 Творог',       tag: 'творог'    },
]

const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Завтрак'        },
  { value: 'lunch',     label: 'Обед / Ужин'    },
  { value: 'snack',     label: 'Дополнительный' },
]

// ── Main Component ─────────────────────────────────────────────────────────────
export default function KitchenClient({
  userId,
  isTrial,
  maxRequests,
  initialRequestsToday,
  kbjuCalories,
  kbjuProtein,
  kbjuFat,
  kbjuCarbs,
}: Props) {
  const [helpOpen, setHelpOpen] = useState(false)

  type HistoryIngredient = { name: string; grams: number; calories: number; protein: number; fat: number; carbs: number }
  type HistoryEntry = {
    title: string
    timestamp: number
    // full recipe data (absent in legacy entries)
    recipe_id?: number
    category?: string
    steps?: string[]
    ingredients?: HistoryIngredient[]
    total?: { calories: number; protein: number; fat: number; carbs: number }
    extra_products?: string[]
  }
  const LS_KEY = 'kitchen_history'
  const TTL    = 86_400_000 // 24h

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(LS_KEY)
      const parsed: HistoryEntry[] = raw ? JSON.parse(raw) : []
      return parsed.filter(e => Date.now() - e.timestamp <= TTL)
    } catch { return [] }
  })

  const [mealsPerDay, setMealsPerDay] = useState<MealsPerDay>(3)
  const [category, setCategory]       = useState<Category>('завтрак')
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [customInput, setCustomInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [noResults, setNoResults]       = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [loading, setLoading]           = useState(false)
  const [result, setResult]             = useState<KitchenResult | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const [requestsUsed, setRequestsUsed] = useState(initialRequestsToday)

  // Per-recipe UI state
  const [savedSet, setSavedSet]         = useState<Set<number>>(new Set())
  const [savingIdx, setSavingIdx]       = useState<number | null>(null)
  const [diaryOpenIdx, setDiaryOpenIdx] = useState<number | null>(null)
  const [diaryLoading, setDiaryLoading] = useState(false)

  // History accordion state
  const [expandedHistTitle, setExpandedHistTitle] = useState<string | null>(null)
  const [histSaved, setHistSaved]                 = useState(false)
  const [histSaving, setHistSaving]               = useState(false)
  const [histDiaryOpen, setHistDiaryOpen]         = useState(false)
  const [histDiaryLoading, setHistDiaryLoading]   = useState(false)

  const hasKbju    = !!(kbjuProtein && kbjuFat && kbjuCarbs)
  const requestsLeft = maxRequests - requestsUsed
  const canRequest   = requestsLeft > 0

  const mealTarget = hasKbju ? {
    protein: Math.round(kbjuProtein! / mealsPerDay),
    fat:     Math.round(kbjuFat!     / mealsPerDay),
    carbs:   Math.round(kbjuCarbs!   / mealsPerDay),
  } : null

  function toggleProduct(tag: string) {
    setSelected(prev => {
      const n = new Set(prev)
      if (n.has(tag)) { n.delete(tag) } else { n.add(tag) }
      return n
    })
  }

  function addCustomProduct() {
    const val = customInput.trim().toLowerCase()
    if (!val) return
    setSelected(prev => new Set(prev).add(val))
    setCustomInput('')
  }

  function removeProduct(tag: string) {
    setSelected(prev => { const n = new Set(prev); n.delete(tag); return n })
  }

  const searchProducts = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      setNoResults(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('nutrition')
        .select('id, name, name_alt, category')
        .or(`name.ilike.%${query}%,name_alt.ilike.%${query}%`)
        .limit(8)
      const names = (data ?? []).map((r: { name: string }) => r.name)
      setSuggestions(names)
      setNoResults(names.length === 0)
      setShowDropdown(true)
    }, 300)
  }, [])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(history)) } catch { /* ignore */ }
  }, [history])

  function handleCustomChange(val: string) {
    setCustomInput(val)
    searchProducts(val)
  }

  function addSuggestion(name: string) {
    setSelected(prev => new Set(prev).add(name.toLowerCase()))
    setCustomInput('')
    setSuggestions([])
    setShowDropdown(false)
    setNoResults(false)
  }

  function handleInputBlur() {
    setTimeout(() => setShowDropdown(false), 150)
  }

  async function handleSubmit() {
    if (!canRequest || !hasKbju) return
    setLoading(true)
    setError(null)
    setResult(null)
    setSavedSet(new Set())
    setDiaryOpenIdx(null)

    const res = await fetch('/api/kitchen/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        meals_per_day: mealsPerDay,
        user_products: [...selected],
      }),
    })

    setLoading(false)

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      if (err.error === 'limit_reached') {
        setError(`Лимит запросов на сегодня (${maxRequests}) исчерпан. Возвращайся завтра!`)
      } else if (err.error === 'no_kbju') {
        setError('Сначала заполни профиль — нужны твои данные для расчёта КБЖУ.')
      } else {
        setError('Что-то пошло не так. Попробуй ещё раз.')
      }
      return
    }

    const data: KitchenResult = await res.json()
    setResult(data)
    setRequestsUsed(prev => prev + 1)
    if (data.recipes?.length) {
      const now = Date.now()
      setHistory(prev => {
        const existing = new Set(prev.map(e => e.title))
        const newEntries = data.recipes
          .filter(r => !existing.has(r.title))
          .map(r => ({
            title:          r.title,
            timestamp:      now,
            recipe_id:      r.recipe_id,
            category:       r.category,
            steps:          r.steps,
            ingredients:    r.ingredients,
            total:          r.total,
            extra_products: r.extra_products,
          }))
        return [...newEntries, ...prev].slice(0, 50)
      })
    }
  }

  function removeHistoryEntry(title: string) {
    setHistory(prev => prev.filter(e => e.title !== title))
  }

  function clearHistory() {
    setHistory([])
  }

  function toggleHistEntry(title: string) {
    if (expandedHistTitle === title) {
      setExpandedHistTitle(null)
    } else {
      setExpandedHistTitle(title)
      setHistSaved(false)
      setHistSaving(false)
      setHistDiaryOpen(false)
    }
  }

  async function handleHistSave() {
    const entry = history.find(e => e.title === expandedHistTitle)
    if (!entry?.recipe_id || histSaved || histSaving) return
    setHistSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('saved_recipes').insert({
      member_id:     userId,
      title:         entry.title,
      meal_type:     entry.category,
      ingredients:   entry.ingredients,
      steps:         entry.steps,
      kbju_calories: entry.total!.calories,
      kbju_protein:  Math.round(entry.total!.protein),
      kbju_fat:      Math.round(entry.total!.fat),
      kbju_carbs:    Math.round(entry.total!.carbs),
    })
    setHistSaving(false)
    if (!error) setHistSaved(true)
  }

  async function handleHistDiaryAdd(mealType: MealType) {
    const entry = history.find(e => e.title === expandedHistTitle)
    if (!entry?.total) return
    setHistDiaryLoading(true)
    const today = new Date().toISOString().split('T')[0]
    await fetch('/api/diary/entries', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date:      today,
        meal_type: mealType,
        title:     entry.title,
        calories:  entry.total.calories,
        protein:   Math.round(entry.total.protein),
        fat:       Math.round(entry.total.fat),
        carbs:     Math.round(entry.total.carbs),
        source:    'bot',
      }),
    })
    setHistDiaryLoading(false)
    setHistDiaryOpen(false)
  }

  async function handleSave(recipe: RecipePortionResult, idx: number) {
    if (savedSet.has(idx) || savingIdx === idx) return
    setSavingIdx(idx)
    const supabase = createClient()
    const { error } = await supabase.from('saved_recipes').insert({
      member_id:     userId,
      title:         recipe.title,
      meal_type:     recipe.category,
      ingredients:   recipe.ingredients,
      steps:         recipe.steps,
      kbju_calories: recipe.total.calories,
      kbju_protein:  Math.round(recipe.total.protein),
      kbju_fat:      Math.round(recipe.total.fat),
      kbju_carbs:    Math.round(recipe.total.carbs),
    })
    setSavingIdx(null)
    if (!error) setSavedSet(prev => new Set(prev).add(idx))
  }

  async function handleAddDiary(recipe: RecipePortionResult, mealType: MealType) {
    setDiaryLoading(true)
    const today = new Date().toISOString().split('T')[0]
    await fetch('/api/diary/entries', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date:      today,
        meal_type: mealType,
        title:     recipe.title,
        calories:  recipe.total.calories,
        protein:   Math.round(recipe.total.protein),
        fat:       Math.round(recipe.total.fat),
        carbs:     Math.round(recipe.total.carbs),
        source:    'bot',
      }),
    })
    setDiaryLoading(false)
    setDiaryOpenIdx(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* ── 0. Аккордеон-помощник ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1.5px solid #E8845A' }}
      >
        <button
          onClick={() => setHelpOpen(p => !p)}
          className="w-full flex items-center justify-between px-4 py-3.5 text-left"
          style={{ background: '#F5E6D3', fontFamily: 'var(--font-nunito)' }}
        >
          <span className="text-sm font-bold" style={{ color: '#2A2420' }}>
            Как пользоваться Умной Кухней?
          </span>
          <span className="text-base shrink-0 ml-2" style={{ color: '#E8845A' }}>
            {helpOpen ? '▼' : '▶'}
          </span>
        </button>

        {helpOpen && (
          <div
            className="px-4 pb-4 pt-1"
            style={{ background: '#F5E6D3', borderTop: '1px solid #E8C9A8' }}
          >
            <div className="prose text-sm text-[#2A2420]" style={{ fontFamily: 'var(--font-nunito)' }}>
              <p>🎬 Здесь скоро появится видео-инструкция или пошаговое руководство.</p>
              <p>А пока: выбери категорию блюда → укажи продукты из холодильника → нажми «Подобрать 3 рецепта»!</p>
            </div>
          </div>
        )}
      </div>

      {/* ── 1. КБЖУ участницы ── */}
      {hasKbju ? (
        <div className="rounded-2xl px-4 py-3.5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            Твои цели на день
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '🔥', value: kbjuCalories!, unit: ' ккал', color: '#E8845A' },
              { label: 'Б',  value: kbjuProtein!, unit: 'г',      color: '#7BAF82' },
              { label: 'Ж',  value: kbjuFat!,     unit: 'г',      color: '#E8845A' },
              { label: 'У до', value: kbjuCarbs!, unit: 'г',      color: 'var(--pur)' },
            ].map(({ label, value, unit, color }) => (
              <span key={label}
                className="inline-flex items-baseline gap-0.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: `${color}22`, color }}>
                {label} <strong>{value}</strong>{unit}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl px-4 py-3.5"
          style={{ background: '#FFF4F0', border: '1px solid #F5C5B0' }}>
          <p className="text-sm font-semibold" style={{ color: '#C05020', fontFamily: 'var(--font-nunito)' }}>
            ⚠️ Заполни профиль — нужно рассчитать твои КБЖУ
          </p>
          <a href="/dashboard/profile"
            className="inline-block mt-2 text-xs font-bold px-3 py-1.5 rounded-xl"
            style={{ background: '#E8845A', color: '#fff', fontFamily: 'var(--font-nunito)' }}>
            Заполнить профиль →
          </a>
        </div>
      )}

      {/* ── 2. Приёмы пищи ── */}
      <div className="rounded-2xl px-4 py-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-bold mb-3 uppercase tracking-widest"
          style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Сколько раз в день ешь?
        </p>
        <div className="flex gap-2">
          {([2, 3] as MealsPerDay[]).map(n => (
            <button key={n} onClick={() => setMealsPerDay(n)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                minHeight: 48,
                fontFamily:  'var(--font-nunito)',
                background:  mealsPerDay === n ? '#E8845A' : 'var(--bg)',
                color:       mealsPerDay === n ? '#fff'    : 'var(--text)',
                border:      `1.5px solid ${mealsPerDay === n ? '#E8845A' : 'var(--border)'}`,
              }}>
              {n} раза
            </button>
          ))}
        </div>
        {mealTarget && (
          <p className="text-xs mt-2.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            На один приём:{' '}
            <strong style={{ color: '#7BAF82' }}>Б {mealTarget.protein}г</strong>
            {' / '}
            <strong style={{ color: '#E8845A' }}>Ж {mealTarget.fat}г</strong>
            {' / '}
            <strong style={{ color: 'var(--pur)' }}>У до {mealTarget.carbs}г</strong>
          </p>
        )}
      </div>

      {/* ── 3. Категория ── */}
      <div className="rounded-2xl px-4 py-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-bold mb-3 uppercase tracking-widest"
          style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Категория
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button key={cat.value} onClick={() => setCategory(cat.value)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                minHeight:  44,
                fontFamily: 'var(--font-nunito)',
                background: category === cat.value ? '#E8845A' : 'var(--bg)',
                color:      category === cat.value ? '#fff'    : 'var(--text)',
                border:     `1.5px solid ${category === cat.value ? '#E8845A' : 'var(--border)'}`,
              }}>
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. Продукты ── */}
      <div className="rounded-2xl px-4 py-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-bold mb-3 uppercase tracking-widest"
          style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Что есть в холодильнике?
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_PRODUCTS.map(p => {
            const active = selected.has(p.tag)
            return (
              <button key={p.tag} onClick={() => toggleProduct(p.tag)}
                className="px-3 py-1.5 rounded-full text-sm transition-all"
                style={{
                  fontFamily: 'var(--font-nunito)',
                  background: active ? '#7BAF82' : 'var(--bg)',
                  color:      active ? '#fff'    : 'var(--text)',
                  border:     `1.5px solid ${active ? '#7BAF82' : 'var(--border)'}`,
                }}>
                {p.label}
              </button>
            )
          })}
        </div>

        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Добавить свой продукт..."
              value={customInput}
              onChange={e => handleCustomChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomProduct()}
              onBlur={handleInputBlur}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={{
                fontFamily:  'var(--font-nunito)',
                borderColor: 'var(--border)',
                background:  'var(--bg)',
                color:       'var(--text)',
              }}
            />

            {/* Выпадающий список */}
            {showDropdown && (
              <div
                className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-lg"
                style={{ background: '#FBF7F2', border: '1px solid var(--border)', zIndex: 50 }}
              >
                {noResults ? (
                  <div
                    className="px-3 py-2.5 text-sm"
                    style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}
                  >
                    Не найдено — можно добавить своё
                  </div>
                ) : (
                  suggestions.map(name => (
                    <button
                      key={name}
                      type="button"
                      onMouseDown={() => addSuggestion(name)}
                      className="w-full text-left px-3 py-2.5 text-sm transition-colors"
                      style={{
                        fontFamily:  'var(--font-nunito)',
                        color:       'var(--text)',
                        background:  'transparent',
                        borderBottom: '1px solid var(--border)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#E8845A18')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            onClick={addCustomProduct}
            className="px-4 py-2 rounded-xl text-sm font-bold shrink-0"
            style={{ background: 'var(--pur-light)', color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
          >
            +
          </button>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              Выбрано:
            </span>
            {[...selected].map(tag => (
              <button key={tag} onClick={() => removeProduct(tag)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  background:  '#7BAF8233',
                  color:       '#2D6A4F',
                  border:      '1px solid #7BAF82',
                  fontFamily:  'var(--font-nunito)',
                }}>
                {tag} ✕
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 5. Кнопка запроса ── */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleSubmit}
          disabled={loading || !canRequest || !hasKbju}
          className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all disabled:opacity-40"
          style={{
            minHeight:  56,
            fontFamily: 'var(--font-nunito)',
            background: canRequest && hasKbju
              ? 'linear-gradient(135deg, #E8845A 0%, #F5A882 100%)'
              : 'var(--border)',
          }}>
          {loading
            ? '⏳ Подбираем рецепты...'
            : '🍳 Подобрать 3 рецепта'}
        </button>

        <p className="text-xs text-center" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          {canRequest
            ? `Осталось запросов сегодня: ${requestsLeft}/${maxRequests}`
            : 'Лимит исчерпан — возвращайся завтра'}
          {isTrial && canRequest && (
            <> · <a href="/join" style={{ color: 'var(--pur)' }}>Расширить до 10/день</a></>
          )}
        </p>
      </div>

      {/* ── Ошибка ── */}
      {error && (
        <div className="rounded-xl px-4 py-3"
          style={{ background: '#FFF0F0', border: '1px solid #F5C0C0' }}>
          <p className="text-sm" style={{ color: '#C03030', fontFamily: 'var(--font-nunito)' }}>{error}</p>
        </div>
      )}

      {/* ── 6. Результаты ── */}
      {result && (
        <div className="flex flex-col gap-4">
          {result.empty || result.recipes.length === 0 ? (
            <div className="rounded-2xl px-5 py-8 text-center"
              style={{ background: '#F5E6D3', border: '1px solid #E8C9A8' }}>
              <p className="text-3xl mb-3">🥘</p>
              <p className="text-sm font-semibold" style={{ color: '#2A2420', fontFamily: 'var(--font-nunito)' }}>
                Рецепты скоро появятся! Наташа уже готовит базу
              </p>
            </div>
          ) : (
            <>
              {result.recipes.map((recipe, idx) => (
                <RecipeCard
                  key={recipe.recipe_id}
                  recipe={recipe}
                  saved={savedSet.has(idx)}
                  saving={savingIdx === idx}
                  diaryOpen={diaryOpenIdx === idx}
                  diaryLoading={diaryLoading}
                  onSave={() => handleSave(recipe, idx)}
                  onDiaryToggle={() => setDiaryOpenIdx(prev => prev === idx ? null : idx)}
                  onDiaryAdd={mealType => handleAddDiary(recipe, mealType)}
                />
              ))}

              {/* ── 7. Совет ── */}
              {result.tip && (
                <div className="rounded-2xl px-4 py-4 flex gap-3"
                  style={{ background: '#F5E6D3', border: '1px solid #E8C9A8' }}>
                  <span className="text-2xl shrink-0">💡</span>
                  <div>
                    <p className="text-[10px] font-bold mb-1 uppercase tracking-widest"
                      style={{ color: '#A05A2A', fontFamily: 'var(--font-nunito)' }}>
                      Совет по приготовлению
                    </p>
                    <p className="text-sm leading-relaxed"
                      style={{ color: '#2A2420', fontFamily: 'var(--font-nunito)' }}>
                      «{result.tip}»
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── 8. История ── */}
      {history.length > 0 && (
        <div className="rounded-2xl px-4 py-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              История поиска
            </p>
            <button
              type="button"
              onClick={clearHistory}
              className="text-xs font-semibold"
              style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}
            >
              Очистить всё
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {history.map(entry => {
              const hasData   = !!entry.recipe_id
              const isExpanded = expandedHistTitle === entry.title
              return (
                <div
                  key={entry.title + entry.timestamp}
                  className="rounded-xl overflow-hidden"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  {/* Entry header row */}
                  <div className="flex items-start gap-2 px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug"
                        style={{ color: hasData ? '#E8845A' : 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                        {entry.title}
                      </p>
                      {entry.total && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                          {entry.total.calories} ккал · Б:{Math.round(entry.total.protein)} · Ж:{Math.round(entry.total.fat)} · У:{Math.round(entry.total.carbs)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {hasData && (
                        <button
                          type="button"
                          onClick={() => toggleHistEntry(entry.title)}
                          className="text-xs px-2 py-1 rounded-lg font-semibold"
                          style={{ color: '#E8845A', border: '1px solid #E8845A40', background: '#E8845A12', fontFamily: 'var(--font-nunito)' }}
                        >
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeHistoryEntry(entry.title)}
                        className="w-6 h-6 flex items-center justify-center rounded-full text-base leading-none"
                        style={{ color: 'var(--muted)' }}
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Expanded accordion content */}
                  {hasData && isExpanded && (
                    <div className="px-3 pb-3 border-t" style={{ borderColor: 'var(--border)' }}>
                      {/* Ingredients */}
                      <div className="pt-3 pb-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                          style={{ color: '#A08060', fontFamily: 'var(--font-nunito)' }}>
                          Ингредиенты
                        </p>
                        <ul className="flex flex-col gap-1">
                          {entry.ingredients!.map((ing, i) => (
                            <li key={i} className="flex items-baseline justify-between gap-2">
                              <span className="text-xs" style={{ color: '#2A2420', fontFamily: 'var(--font-nunito)' }}>
                                • {ing.name}
                              </span>
                              <span className="text-xs font-semibold shrink-0"
                                style={{ color: '#6A4A2A', fontFamily: 'var(--font-nunito)' }}>
                                {formatIngredientGrams(ing.name, ing.grams)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {(entry.extra_products?.length ?? 0) > 0 && (
                          <div className="mt-2 px-2.5 py-1.5 rounded-lg" style={{ background: '#FFF4F0' }}>
                            <p className="text-xs font-semibold" style={{ color: '#C05020', fontFamily: 'var(--font-nunito)' }}>
                              🛒 Докупить: {entry.extra_products!.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Steps */}
                      <div className="pb-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                          style={{ color: '#A08060', fontFamily: 'var(--font-nunito)' }}>
                          Приготовление
                        </p>
                        <ol className="flex flex-col gap-1.5">
                          {entry.steps!.map((step, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5"
                                style={{ background: '#E8845A', color: '#fff' }}>
                                {i + 1}
                              </span>
                              <span className="text-xs leading-snug"
                                style={{ color: '#2A2420', fontFamily: 'var(--font-nunito)' }}>
                                {step}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 pt-1">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleHistSave}
                            disabled={histSaved || histSaving}
                            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                            style={{
                              minHeight:  40,
                              fontFamily: 'var(--font-nunito)',
                              background: histSaved ? '#7BAF8222' : 'var(--card)',
                              color:      histSaved ? '#2D6A4F'   : 'var(--text)',
                              border:     `1.5px solid ${histSaved ? '#7BAF82' : 'var(--border)'}`,
                            }}>
                            {histSaving ? '...' : histSaved ? '✓ Сохранено' : '⭐ Сохранить'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistDiaryOpen(p => !p)}
                            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                            style={{
                              minHeight:  40,
                              fontFamily: 'var(--font-nunito)',
                              background: histDiaryOpen ? 'var(--pur-light)' : 'var(--card)',
                              color:      histDiaryOpen ? 'var(--pur)'       : 'var(--text)',
                              border:     `1.5px solid ${histDiaryOpen ? 'var(--pur)' : 'var(--border)'}`,
                            }}>
                            📓 В дневник
                          </button>
                        </div>
                        {histDiaryOpen && (
                          <div className="flex gap-2">
                            {MEAL_TYPE_OPTIONS.map(mt => (
                              <button
                                key={mt.value}
                                type="button"
                                onClick={() => handleHistDiaryAdd(mt.value)}
                                disabled={histDiaryLoading}
                                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                style={{ minHeight: 36, background: 'var(--pur)', color: '#fff', fontFamily: 'var(--font-nunito)' }}>
                                {mt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatIngredientGrams(name: string, grams: number): string {
  const lower = name.toLowerCase()
  if (lower.includes('яйцо') || lower.includes('яйца')) {
    const count = Math.round(grams / 55)
    return `${grams}г (≈${count} шт.)`
  }
  return `${grams}г`
}

// ── Recipe Card ────────────────────────────────────────────────────────────────
function RecipeCard({
  recipe, saved, saving, diaryOpen, diaryLoading,
  onSave, onDiaryToggle, onDiaryAdd,
}: {
  recipe: RecipePortionResult
  saved: boolean
  saving: boolean
  diaryOpen: boolean
  diaryLoading: boolean
  onSave: () => void
  onDiaryToggle: () => void
  onDiaryAdd: (mealType: MealType) => void
}) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: '#F5E6D3', border: '1px solid #E8C9A8' }}>

      {/* Заголовок + КБЖУ */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid #E8C9A8' }}>
        <h3 className="text-base font-bold leading-snug"
          style={{ color: '#2A2420', fontFamily: 'var(--font-unbounded)' }}>
          {recipe.title}
        </h3>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#E8845A22', color: '#A04020' }}>
            🔥 {recipe.total.calories} ккал
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#7BAF8222', color: '#2D6A4F' }}>
            Б {recipe.total.protein}г{recipe.macros_ok.protein ? ' ✓' : ''}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#E8845A22', color: '#A04020' }}>
            Ж {recipe.total.fat}г{recipe.macros_ok.fat ? ' ✓' : ''}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#EDE8FF', color: 'var(--pur)' }}>
            У {recipe.total.carbs}г
          </span>
        </div>
      </div>

      {/* Ингредиенты */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #E8C9A8' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: '#A08060', fontFamily: 'var(--font-nunito)' }}>
          Ингредиенты
        </p>
        <ul className="flex flex-col gap-1">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex items-baseline justify-between gap-2">
              <span className="text-sm" style={{ color: '#2A2420', fontFamily: 'var(--font-nunito)' }}>
                • {ing.name}
              </span>
              <span className="text-sm font-semibold shrink-0"
                style={{ color: '#6A4A2A', fontFamily: 'var(--font-nunito)' }}>
                {formatIngredientGrams(ing.name, ing.grams)}
              </span>
            </li>
          ))}
        </ul>
        {recipe.extra_products.length > 0 && (
          <div className="mt-2.5 px-3 py-2 rounded-xl" style={{ background: '#FFF4F0' }}>
            <p className="text-xs font-semibold" style={{ color: '#C05020', fontFamily: 'var(--font-nunito)' }}>
              🛒 Докупить: {recipe.extra_products.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Приготовление */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #E8C9A8' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: '#A08060', fontFamily: 'var(--font-nunito)' }}>
          Приготовление
        </p>
        <ol className="flex flex-col gap-2">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                style={{ background: '#E8845A', color: '#fff' }}>
                {i + 1}
              </span>
              <span className="text-sm leading-snug"
                style={{ color: '#2A2420', fontFamily: 'var(--font-nunito)' }}>
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Кнопки */}
      <div className="px-4 py-3 flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={onSave}
            disabled={saved || saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
            style={{
              minHeight:  44,
              fontFamily: 'var(--font-nunito)',
              background: saved ? '#7BAF8222' : 'var(--card)',
              color:      saved ? '#2D6A4F'   : 'var(--text)',
              border:     `1.5px solid ${saved ? '#7BAF82' : 'var(--border)'}`,
            }}>
            {saving ? '...' : saved ? '✓ Сохранено' : '⭐ Сохранить'}
          </button>
          <button
            onClick={onDiaryToggle}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              minHeight:  44,
              fontFamily: 'var(--font-nunito)',
              background: diaryOpen ? 'var(--pur-light)' : 'var(--card)',
              color:      diaryOpen ? 'var(--pur)'       : 'var(--text)',
              border:     `1.5px solid ${diaryOpen ? 'var(--pur)' : 'var(--border)'}`,
            }}>
            📓 В дневник
          </button>
        </div>

        {/* Выбор приёма пищи */}
        {diaryOpen && (
          <div className="flex gap-2">
            {MEAL_TYPE_OPTIONS.map(mt => (
              <button
                key={mt.value}
                onClick={() => onDiaryAdd(mt.value)}
                disabled={diaryLoading}
                className="flex-1 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                style={{
                  minHeight:  40,
                  fontFamily: 'var(--font-nunito)',
                  background: 'var(--pur)',
                  color:      '#fff',
                }}>
                {mt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
