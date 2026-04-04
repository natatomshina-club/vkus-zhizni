'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { RecipePortionResult } from '@/lib/recipeCalculator'
import KitchenCalculator from '@/components/KitchenCalculator'

// ── Types ──────────────────────────────────────────────────────────────────────
type Category = 'завтрак' | 'обед_ужин' | 'салат' | 'десерт' | 'суп'
type MealsPerDay = 2 | 3
type MealType = 'breakfast' | 'lunch' | 'snack'

interface ExtendedRecipe extends RecipePortionResult {
  requires_macro_calculation?: boolean
  servings?: number
  tip_tags?: string[]
}

interface KitchenResult {
  recipes: ExtendedRecipe[]
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
const FIXED_CATEGORIES: Category[] = ['салат', 'суп', 'десерт']

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
  const router = useRouter()
  const [tab, setTab] = useState<'kitchen' | 'calculator'>('kitchen')
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
  const LS_KEY   = 'kitchen_history'
  const TTL      = 72 * 60 * 60 * 1000 // 72h
  const MAX_HIST = 20

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(LS_KEY)
      const parsed: HistoryEntry[] = raw ? JSON.parse(raw) : []
      return parsed.filter(e => Date.now() - e.timestamp < TTL)
    } catch { return [] }
  })

  const [histShowAll, setHistShowAll] = useState(false)

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

  const isFixed    = FIXED_CATEGORIES.includes(category)
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
        ...(isFixed ? {} : { meals_per_day: mealsPerDay }),
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
        let updated = [...prev]
        for (const r of data.recipes) {
          const entry: HistoryEntry = {
            title:          r.title,
            timestamp:      now,
            recipe_id:      r.recipe_id,
            category:       r.category,
            steps:          r.steps,
            ingredients:    r.ingredients,
            total:          r.total,
            extra_products: r.extra_products,
          }
          // Remove existing entry with same recipe_id (or title as fallback)
          updated = updated.filter(e =>
            r.recipe_id ? e.recipe_id !== r.recipe_id : e.title !== r.title
          )
          // Add to beginning
          updated = [entry, ...updated]
        }
        return updated.slice(0, MAX_HIST)
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

      {/* ── Переключатель вкладок ── */}
      <div className="flex flex-col sm:flex-row gap-2 rounded-2xl p-1.5"
        style={{ background: '#fff', border: '2px solid #DDD5FF' }}>
        {([
          { id: 'kitchen'    as const, label: '🍳 Рецепты',    activeColor: '#7C5CFC', activeText: '#fff' },
          { id: 'calculator' as const, label: '🧮 Калькулятор', activeColor: '#FF9F43', activeText: '#fff' },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{
              minHeight:  44,
              fontFamily: 'var(--font-nunito)',
              background: tab === t.id ? t.activeColor : '#fff',
              color:      tab === t.id ? t.activeText  : '#9B8FCC',
              border:     tab === t.id ? '2px solid transparent' : '2px solid #DDD5FF',
              boxShadow:  tab === t.id ? '0 4px 14px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={() => router.push('/dashboard/kitchen/weekly')}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{
            minHeight:  44,
            fontFamily: 'var(--font-nunito)',
            background: '#fff',
            color:      '#9B8FCC',
            border:     '2px solid #DDD5FF',
          }}
        >
          📅 Рацион на неделю
        </button>
      </div>

      {/* ── Калькулятор ── */}
      {tab === 'calculator' && <KitchenCalculator />}

      {/* ── Умная Кухня ── */}
      {tab === 'kitchen' && <>

      {/* ── 0. Аккордеон-помощник ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '2px solid #DDD5FF' }}
      >
        <button
          onClick={() => setHelpOpen(p => !p)}
          className="w-full flex items-center justify-between px-4 py-3.5 text-left"
          style={{ background: '#F0EEFF', fontFamily: 'var(--font-nunito)' }}
        >
          <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
            Как пользоваться Умной Кухней?
          </span>
          <span className="text-base shrink-0 ml-2" style={{ color: '#7C5CFC' }}>
            {helpOpen ? '▼' : '▶'}
          </span>
        </button>

        {helpOpen && (
          <div
            className="px-4 pb-4 pt-1"
            style={{ background: '#F0EEFF', borderTop: '1px solid #DDD5FF' }}
          >
            <div className="prose text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
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
              { label: '🔥', value: kbjuCalories!, unit: ' ккал', bg: '#7C5CFC', text: '#fff'     },
              { label: 'Б',  value: kbjuProtein!,  unit: 'г',     bg: '#A8E6CF', text: '#2D6A4F'  },
              { label: 'Ж',  value: kbjuFat!,      unit: 'г',     bg: '#FFD93D', text: '#5C4200'  },
              { label: 'У до', value: kbjuCarbs!,  unit: 'г',     bg: '#FF9F43', text: '#fff'     },
            ].map(({ label, value, unit, bg, text }) => (
              <span key={label}
                className="inline-flex items-baseline gap-0.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: bg, color: text }}>
                {label} <strong>{value}</strong>{unit}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl px-4 py-3.5"
          style={{ background: '#F0EEFF', border: '2px solid #DDD5FF' }}>
          <p className="text-sm font-semibold" style={{ color: '#7C5CFC', fontFamily: 'var(--font-nunito)' }}>
            ⚠️ Заполни профиль — нужно рассчитать твои КБЖУ
          </p>
          <a href="/dashboard/profile"
            className="inline-block mt-2 text-xs font-bold px-3 py-1.5 rounded-xl"
            style={{ background: '#7C5CFC', color: '#fff', fontFamily: 'var(--font-nunito)' }}>
            Заполнить профиль →
          </a>
        </div>
      )}

      {/* ── 2. Приёмы пищи ── */}
      {!isFixed && (
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
                  background:  mealsPerDay === n ? '#7C5CFC' : '#fff',
                  color:       mealsPerDay === n ? '#fff'    : 'var(--text)',
                  border:      `2px solid ${mealsPerDay === n ? '#7C5CFC' : '#DDD5FF'}`,
                }}>
                {n} раза
              </button>
            ))}
          </div>
          {mealTarget && (
            <p className="text-xs mt-2.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              На один приём:{' '}
              <strong style={{ color: '#2D6A4F' }}>Б {mealTarget.protein}г</strong>
              {' / '}
              <strong style={{ color: '#5C4200' }}>Ж {mealTarget.fat}г</strong>
              {' / '}
              <strong style={{ color: '#FF9F43' }}>У до {mealTarget.carbs}г</strong>
            </p>
          )}
        </div>
      )}

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
                background: category === cat.value ? '#7C5CFC' : '#fff',
                color:      category === cat.value ? '#fff'    : 'var(--text)',
                border:     `2px solid ${category === cat.value ? '#7C5CFC' : '#DDD5FF'}`,
              }}>
              {cat.icon} {cat.label}
            </button>
          ))}
          <button
            onClick={() => router.push('/dashboard/kitchen/sauces')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              minHeight:  44,
              fontFamily: 'var(--font-nunito)',
              background: '#fff',
              color:      'var(--text)',
              border:     '2px solid #DDD5FF',
            }}>
            🥣 Соусы
          </button>
        </div>
      </div>

      {/* ── Подсказки для фиксированных категорий ── */}
      {category === 'салат' && (
        <div className="rounded-xl px-4 py-3"
          style={{ background: '#F0FFF4', border: '1px solid #A8E6CF', fontFamily: 'var(--font-nunito)' }}>
          <p className="text-sm leading-relaxed" style={{ color: '#2D6A4F' }}>
            🥗 <strong>Салат — это закуска для возбуждения аппетита.</strong><br />
            Обязательно добавьте к салату основное блюдо, чтобы закрыть свою норму белка!
          </p>
        </div>
      )}
      {category === 'десерт' && (
        <div className="rounded-xl px-4 py-3"
          style={{ background: '#FFF8E0', border: '1px solid #FFD93D', fontFamily: 'var(--font-nunito)' }}>
          <p className="text-sm leading-relaxed" style={{ color: '#5C4200' }}>
            🍰 <strong>Десерт — приятное, но необязательное дополнение.</strong><br />
            Не заменяйте десертами основной приём пищи!
          </p>
        </div>
      )}

      {/* ── 4. Продукты ── */}
      <div className="rounded-2xl px-4 py-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-bold mb-3 uppercase tracking-widest"
          style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Что есть в холодильнике?
        </p>

        <p className="text-xs mb-3 leading-relaxed" style={{ color: '#9B8FCC', fontFamily: 'var(--font-nunito)', fontSize: 13 }}>
          Напиши список продуктов, из которых хочешь приготовить, и мы предложим варианты рецептов. Если не укажешь продукты — рецепты подберутся случайным образом.
        </p>

        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Добавить свой продукт..."
              value={customInput}
              onChange={e => handleCustomChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomProduct()}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors"
              style={{
                fontFamily:  'var(--font-nunito)',
                borderColor: '#DDD5FF',
                borderWidth:  2,
                background:  '#fff',
                color:       'var(--text)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#7C5CFC')}
              onBlur={e => { e.currentTarget.style.borderColor = '#DDD5FF'; handleInputBlur() }}
            />

            {/* Выпадающий список */}
            {showDropdown && (
              <div
                className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-lg"
                style={{ background: '#fff', border: '2px solid #DDD5FF', zIndex: 50 }}
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
                      onMouseEnter={e => (e.currentTarget.style.background = '#7C5CFC12')}
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
                  background:  '#A8E6CF44',
                  color:       '#2D6A4F',
                  border:      '1px solid #A8E6CF',
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
            background: canRequest && hasKbju ? '#FF9F43' : 'var(--border)',
            boxShadow:  canRequest && hasKbju ? '0 4px 14px rgba(255,159,67,0.4)' : 'none',
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
            <> · <a href="/dashboard/upgrade" style={{ color: 'var(--pur)' }}>Расширить до 10/день</a></>
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
              style={{ background: '#F0EEFF', border: '2px solid #DDD5FF' }}>
              <p className="text-3xl mb-3">🥘</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                Рецепты скоро появятся! Наташа уже готовит базу
              </p>
            </div>
          ) : (
            <>
              {result.recipes.map((recipe, idx) => (
                <div key={recipe.recipe_id} className="flex flex-col gap-2">
                  <RecipeCard
                    recipe={recipe}
                    saved={savedSet.has(idx)}
                    saving={savingIdx === idx}
                    diaryOpen={diaryOpenIdx === idx}
                    diaryLoading={diaryLoading}
                    onSave={() => handleSave(recipe, idx)}
                    onDiaryToggle={() => setDiaryOpenIdx(prev => prev === idx ? null : idx)}
                    onDiaryAdd={mealType => handleAddDiary(recipe, mealType)}
                  />
                  {recipe.tip_tags?.includes('root_vegetable_warning') && (
                    <div className="rounded-xl px-4 py-3"
                      style={{ background: '#FFF8E0', border: '1px solid #FFD93D', fontFamily: 'var(--font-nunito)' }}>
                      <p className="text-sm leading-relaxed" style={{ color: '#5C4200' }}>
                        ⚠️ В рецепте есть варёные корнеплоды. В фазе снижения веса рекомендуем заменить картофель/свёклу на цветную капусту или сыр.
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* ── 7. Совет ── */}
              {result.tip && (
                <div className="rounded-2xl px-4 py-4 flex gap-3"
                  style={{ background: '#FFF9E6', borderLeft: '4px solid #FFD93D', borderTop: '1px solid #FFD93D66', borderRight: '1px solid #FFD93D66', borderBottom: '1px solid #FFD93D66' }}>
                  <span className="text-2xl shrink-0">💡</span>
                  <div>
                    <p className="text-[10px] font-bold mb-1 uppercase tracking-widest"
                      style={{ color: '#8B6914', fontFamily: 'var(--font-nunito)' }}>
                      Лайфхак от Наташи
                    </p>
                    <p className="text-sm leading-relaxed"
                      style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
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
            {(histShowAll ? history : history.slice(0, 10)).map(entry => {
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
                        style={{ color: hasData ? '#7C5CFC' : 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
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
                          style={{ color: '#7C5CFC', border: '1px solid #7C5CFC40', background: '#7C5CFC12', fontFamily: 'var(--font-nunito)' }}
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
                          style={{ color: '#9B8FCC', fontFamily: 'var(--font-nunito)' }}>
                          Ингредиенты
                        </p>
                        <ul className="flex flex-col gap-1">
                          {entry.ingredients!.map((ing, i) => (
                            <li key={i} className="flex items-baseline justify-between gap-2">
                              <span className="text-xs" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                                • {ing.name}
                              </span>
                              <span className="text-xs font-semibold shrink-0"
                                style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                                {formatIngredientGrams(ing.name, ing.grams)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {(entry.extra_products?.length ?? 0) > 0 && (
                          <div className="mt-2 px-2.5 py-1.5 rounded-lg" style={{ background: '#F0EEFF' }}>
                            <p className="text-xs font-semibold" style={{ color: '#7C5CFC', fontFamily: 'var(--font-nunito)' }}>
                              🛒 Докупить: {entry.extra_products!.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Steps */}
                      <div className="pb-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                          style={{ color: '#9B8FCC', fontFamily: 'var(--font-nunito)' }}>
                          Приготовление
                        </p>
                        <ol className="flex flex-col gap-1.5">
                          {entry.steps!.map((step, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5"
                                style={{ background: '#7C5CFC', color: '#fff' }}>
                                {i + 1}
                              </span>
                              <span className="text-xs leading-snug"
                                style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
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
                              background: histSaved ? '#A8E6CF33' : 'var(--card)',
                              color:      histSaved ? '#2D6A4F'   : 'var(--text)',
                              border:     `1.5px solid ${histSaved ? '#A8E6CF' : 'var(--border)'}`,
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
            {history.length > 10 && (
              <button
                type="button"
                onClick={() => setHistShowAll(p => !p)}
                className="text-xs font-semibold py-2 rounded-xl w-full mt-1"
                style={{ color: 'var(--pur)', background: 'var(--pur-lt)', border: '1px solid var(--pur-br)', fontFamily: 'var(--font-nunito)' }}
              >
                {histShowAll ? '▲ Скрыть' : `▼ Показать ещё (${history.length - 10})`}
              </button>
            )}
          </div>
        </div>
      )}

      </> /* end tab === 'kitchen' */}

    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatIngredientGrams(name: string, grams: number): string {
  const lower = name.toLowerCase()
  if (lower.includes('яйцо') || lower.includes('яйца')) {
    const count = Math.round(grams / 60)
    return count >= 1 ? `${grams}г (≈${count} шт.)` : `${grams}г`
  }
  return `${grams}г`
}

// ── Recipe Card ────────────────────────────────────────────────────────────────
function RecipeCard({
  recipe, saved, saving, diaryOpen, diaryLoading,
  onSave, onDiaryToggle, onDiaryAdd,
}: {
  recipe: ExtendedRecipe
  saved: boolean
  saving: boolean
  diaryOpen: boolean
  diaryLoading: boolean
  onSave: () => void
  onDiaryToggle: () => void
  onDiaryAdd: (mealType: MealType) => void
}) {
  const showMacroMarkers = recipe.requires_macro_calculation !== false
  const servings = recipe.servings ?? 1

  function getPorcionWord(n: number): string {
    if (n % 10 === 1 && n % 100 !== 11) return 'порция'
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'порции'
    return 'порций'
  }

  function ingredientsLabel(): string {
    if (recipe.category === 'суп') {
      return servings <= 1
        ? 'Ингредиенты на 1 порцию'
        : `Ингредиенты на кастрюлю (${servings} порц.)`
    }
    if (recipe.category === 'десерт') return `Ингредиенты на ${servings} шт./порц.`
    return 'Ингредиенты'
  }

  function kbjuLabel(): string | null {
    if (recipe.category === 'суп') return 'КБЖУ 1 порции:'
    if (recipe.category === 'десерт') return 'КБЖУ 1 шт./порции:'
    return null
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: '#fff', border: '2px solid #DDD5FF' }}>

      {/* Заголовок + КБЖУ */}
      <div className="px-4 pt-4 pb-3" style={{ background: '#7C5CFC' }}>
        <h3 className="text-base font-bold leading-snug"
          style={{ color: '#fff', fontFamily: 'var(--font-unbounded)' }}>
          {recipe.title}
        </h3>
        {kbjuLabel() && (
          <p className="text-[10px] font-bold uppercase tracking-widest mt-2 mb-1"
            style={{ color: '#DDD5FF', fontFamily: 'var(--font-nunito)' }}>
            {kbjuLabel()}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#fff', color: '#7C5CFC' }}>
            🔥 {recipe.total.calories} ккал
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#A8E6CF', color: '#2D6A4F' }}>
            Б {recipe.total.protein}г{showMacroMarkers && recipe.macros_ok.protein ? ' ✓' : ''}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#FFD93D', color: '#5C4200' }}>
            Ж {recipe.total.fat}г{showMacroMarkers && recipe.macros_ok.fat ? ' ✓' : ''}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#FF9F43', color: '#fff' }}>
            У {recipe.total.carbs}г
          </span>
        </div>
        {recipe.category === 'суп' && servings > 1 && (
          <p className="text-xs mt-2" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            Порция ~300–350 г | Кастрюля на {servings} {getPorcionWord(servings)}
          </p>
        )}
      </div>

      {/* Ингредиенты */}
      <div className="px-4 py-3" style={{ borderBottom: '2px solid #DDD5FF' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: '#9B8FCC', fontFamily: 'var(--font-nunito)' }}>
          {ingredientsLabel()}
        </p>
        <ul className="flex flex-col gap-1">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex items-baseline justify-between gap-2">
              <span className="text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                • {ing.name}
              </span>
              <span className="text-sm font-semibold shrink-0"
                style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                {formatIngredientGrams(ing.name, ing.grams)}
              </span>
            </li>
          ))}
        </ul>
        {recipe.extra_products.length > 0 && (
          <div className="mt-2.5 px-3 py-2 rounded-xl" style={{ background: '#F0EEFF' }}>
            <p className="text-xs font-semibold" style={{ color: '#7C5CFC', fontFamily: 'var(--font-nunito)' }}>
              🛒 Докупить: {recipe.extra_products.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Приготовление */}
      <div className="px-4 py-3" style={{ borderBottom: '2px solid #DDD5FF' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: '#9B8FCC', fontFamily: 'var(--font-nunito)' }}>
          Приготовление
        </p>
        <ol className="flex flex-col gap-2">
          {recipe.steps.map((step, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                style={{ background: '#7C5CFC', color: '#fff' }}>
                {i + 1}
              </span>
              <span className="text-sm leading-snug"
                style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
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
              background: saved ? '#A8E6CF33' : 'var(--card)',
              color:      saved ? '#2D6A4F'   : 'var(--text)',
              border:     `1.5px solid ${saved ? '#A8E6CF' : 'var(--border)'}`,
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
