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

type SavedSauce = {
  id: string
  title: string
  emoji: string
  category: 'соус'
  kbju: { kcal: number; protein: number; fat: number; carbs: number } | null
  ingredients?: string[] | null
  steps?: string[] | null
  tip?: string | null
  savedAt: string
}

type MemberRecipeIngredient = {
  name: string
  grams: number
  pieces?: number
  calories: number
  protein: number
  fat: number
  carbs: number
}

type MemberRecipe = {
  id: string
  name: string
  ingredients: MemberRecipeIngredient[]
  total_calories: number | null
  total_protein: number | null
  total_fat: number | null
  total_carbs: number | null
  servings_count: number
  created_at: string
}

type Props = {
  userId: string
  initialRecipes: Recipe[]
  totalCount: number
  maxCount: number
  initialMemberRecipes: MemberRecipe[]
}

const MEAL_FILTERS = ['Все', 'Завтрак', 'Обед/Ужин', 'Салат', 'Суп', 'Десерт', '🥣 Соусы']

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

export default function FavoritesClient({ userId, initialRecipes, totalCount, maxCount, initialMemberRecipes }: Props) {
  const [activeTab, setActiveTab]     = useState<'favorites' | 'my-recipes'>('favorites')
  const [recipes, setRecipes]         = useState<Recipe[]>(initialRecipes)
  const [count, setCount]             = useState(totalCount)
  const [memberRecipes, setMemberRecipes] = useState<MemberRecipe[]>(initialMemberRecipes)
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

  // Мои рецепты
  const [mrExpanded, setMrExpanded]     = useState<string | null>(null)
  const [mrConfirmId, setMrConfirmId]   = useState<string | null>(null)
  const [mrDiaryOpenId, setMrDiaryOpenId] = useState<string | null>(null)
  const [mrDiaryMeal, setMrDiaryMeal]   = useState('')
  const [mrDateMode, setMrDateMode]     = useState<'today' | 'yesterday' | 'custom'>('today')
  const [mrCustomDate, setMrCustomDate] = useState('')
  const [mrDiaryLoadingId, setMrDiaryLoadingId] = useState<string | null>(null)
  const [mrDeletingId, setMrDeletingId] = useState<string | null>(null)
  const [mrServings, setMrServings]     = useState(1)

  // ── Sauces from localStorage ───────────────────────────
  const [savedSauces, setSavedSauces] = useState<SavedSauce[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem('saved_sauces')
      if (!raw) return []
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      if (parsed.length > 0 && typeof parsed[0] === 'object') return parsed as SavedSauce[]
      return []
    } catch { return [] }
  })

  const showSauces    = filter === '🥣 Соусы'
  const visibleSauces = savedSauces.filter(s =>
    !search.trim() || s.title.toLowerCase().includes(search.toLowerCase())
  )

  function handleDeleteSauce(id: string) {
    const next = savedSauces.filter(s => s.id !== id)
    setSavedSauces(next)
    try { localStorage.setItem('saved_sauces', JSON.stringify(next)) } catch {}
    setConfirmId(null)
  }

  async function handleSauceDiary(sauce: SavedSauce) {
    if (!diaryMeal || !sauce.kbju) return
    setDiaryLoadingId(sauce.id)
    const res = await fetch('/api/diary/entries', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date:      getSelectedDate(),
        meal_type: diaryMeal,
        title:     sauce.title,
        calories:  sauce.kbju.kcal,
        protein:   sauce.kbju.protein,
        fat:       sauce.kbju.fat,
        carbs:     sauce.kbju.carbs,
        source:    'saved_sauce',
      }),
    })
    setDiaryLoadingId(null)
    setDiaryOpenId(null)
    setDiaryMsg(res.ok ? '📓 Добавлено в дневник!' : 'Ошибка записи')
    setTimeout(() => setDiaryMsg(''), 3000)
  }

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

  // ── My Recipes handlers ───────────────────────────────────────────────────
  function getMrDate(): string {
    if (mrDateMode === 'custom' && mrCustomDate) return mrCustomDate
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    if (mrDateMode === 'yesterday') d.setDate(d.getDate() - 1)
    return d.toISOString().split('T')[0]
  }

  async function handleMrDiary(recipe: MemberRecipe) {
    if (!mrDiaryMeal) return
    setMrDiaryLoadingId(recipe.id)
    const sc = recipe.servings_count || 1
    const perPortion = {
      calories: Math.round((recipe.total_calories ?? 0) / sc),
      protein:  Math.round(((recipe.total_protein ?? 0) / sc) * 10) / 10,
      fat:      Math.round(((recipe.total_fat     ?? 0) / sc) * 10) / 10,
      carbs:    Math.round(((recipe.total_carbs   ?? 0) / sc) * 10) / 10,
    }
    const title = mrServings === 1
      ? recipe.name
      : `${recipe.name} (${mrServings} порц.)`
    const res = await fetch('/api/diary/entries', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date:      getMrDate(),
        meal_type: mrDiaryMeal,
        title,
        calories:  Math.round(perPortion.calories * mrServings),
        protein:   Math.round(perPortion.protein  * mrServings * 10) / 10,
        fat:       Math.round(perPortion.fat       * mrServings * 10) / 10,
        carbs:     Math.round(perPortion.carbs     * mrServings * 10) / 10,
        source:    'my_recipe',
      }),
    })
    setMrDiaryLoadingId(null)
    setMrDiaryOpenId(null)
    setDiaryMsg(res.ok ? '📓 Добавлено в дневник!' : 'Ошибка записи')
    setTimeout(() => setDiaryMsg(''), 3000)
  }

  async function handleMrDelete(id: string) {
    setMrDeletingId(id)
    setTimeout(async () => {
      await fetch(`/api/member-recipes/${id}`, { method: 'DELETE' })
      setMemberRecipes(prev => prev.filter(r => r.id !== id))
      setMrDeletingId(null)
      setMrConfirmId(null)
    }, 300)
  }

  const todayStr = new Date().toISOString().split('T')[0]

  const totalDisplayCount = count + savedSauces.length
  const pct = Math.min(100, Math.round((totalDisplayCount / maxCount) * 100))

  return (
    <div className="flex flex-col gap-5">

      {/* ── Tab switcher ── */}
      <div className="flex gap-2">
        {([
          { key: 'favorites',  label: '⭐ Избранное' },
          { key: 'my-recipes', label: `📝 Мои рецепты${memberRecipes.length > 0 ? ` (${memberRecipes.length})` : ''}` },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all"
            style={{
              fontFamily:  'var(--font-nunito)',
              background:  activeTab === tab.key ? 'var(--pur)' : 'var(--card)',
              color:       activeTab === tab.key ? '#fff' : 'var(--text)',
              borderColor: activeTab === tab.key ? 'var(--pur)' : 'var(--border)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── My Recipes tab ── */}
      {activeTab === 'my-recipes' && (
        <div className="flex flex-col gap-4">
          {diaryMsg && (
            <p className="text-sm text-center font-semibold" style={{ color: '#2A9D5C', fontFamily: 'var(--font-nunito)' }}>
              {diaryMsg}
            </p>
          )}

          {memberRecipes.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <span className="text-5xl">📝</span>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                Пока нет сохранённых рецептов.
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                Создай рецепт в Калькуляторе 🧮
              </p>
              <a
                href="/dashboard/kitchen"
                className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, var(--pur) 0%, #9B7CFF 100%)', fontFamily: 'var(--font-nunito)' }}
              >
                Калькулятор →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {memberRecipes.map(recipe => {
                const isExpanded  = mrExpanded    === recipe.id
                const isConfirm   = mrConfirmId   === recipe.id
                const isDiaryOpen = mrDiaryOpenId === recipe.id
                const isDeleting  = mrDeletingId  === recipe.id

                return (
                  <div
                    key={recipe.id}
                    className="rounded-2xl overflow-hidden flex flex-col transition-all"
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      opacity:   isDeleting ? 0 : 1,
                      transform: isDeleting ? 'scale(0.95)' : 'scale(1)',
                      transition: 'opacity 0.3s ease, transform 0.3s ease',
                    }}
                  >
                    {/* Card header */}
                    <div className="px-4 pt-4 pb-3 flex flex-col gap-2">
                      <p className="text-sm font-bold leading-snug" style={{ color: 'var(--text)', fontFamily: 'var(--font-unbounded)' }}>
                        {recipe.name}
                      </p>

                      {/* КБЖУ chips */}
                      {(() => {
                        const sc = recipe.servings_count || 1
                        const perPortion = sc > 1 ? {
                          calories: Math.round((recipe.total_calories ?? 0) / sc),
                          protein:  Math.round(((recipe.total_protein ?? 0) / sc) * 10) / 10,
                          fat:      Math.round(((recipe.total_fat     ?? 0) / sc) * 10) / 10,
                          carbs:    Math.round(((recipe.total_carbs   ?? 0) / sc) * 10) / 10,
                        } : null
                        return (
                          <div className="flex flex-col gap-1">
                            {perPortion && (
                              <div className="flex flex-wrap gap-1 items-center">
                                <span className="text-[10px] font-bold uppercase tracking-wide"
                                  style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                                  1 порц.:
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ background: 'var(--pur-light)', color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
                                  {perPortion.calories} ккал
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ background: 'var(--grn-light)', color: '#1A5C3A', fontFamily: 'var(--font-nunito)' }}>
                                  Б: {perPortion.protein}г
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ background: 'var(--yel-light)', color: '#8B6000', fontFamily: 'var(--font-nunito)' }}>
                                  Ж: {perPortion.fat}г
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ background: 'var(--ora-light)', color: '#A04000', fontFamily: 'var(--font-nunito)' }}>
                                  У: {perPortion.carbs}г
                                </span>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1 items-center">
                              {sc > 1 && (
                                <span className="text-[10px] font-bold uppercase tracking-wide"
                                  style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                                  {sc} порц.:
                                </span>
                              )}
                              {recipe.total_calories != null && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ background: 'var(--pur-light)', color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
                                  {recipe.total_calories} ккал
                                </span>
                              )}
                              {recipe.total_protein != null && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ background: 'var(--grn-light)', color: '#1A5C3A', fontFamily: 'var(--font-nunito)' }}>
                                  Б: {recipe.total_protein}г
                                </span>
                              )}
                              {recipe.total_fat != null && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ background: 'var(--yel-light)', color: '#8B6000', fontFamily: 'var(--font-nunito)' }}>
                                  Ж: {recipe.total_fat}г
                                </span>
                              )}
                              {recipe.total_carbs != null && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ background: 'var(--ora-light)', color: '#A04000', fontFamily: 'var(--font-nunito)' }}>
                                  У: {recipe.total_carbs}г
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Expandable ingredients */}
                    {recipe.ingredients?.length > 0 && (
                      <div className="px-4 pb-2">
                        <button
                          onClick={() => setMrExpanded(isExpanded ? null : recipe.id)}
                          className="text-xs font-semibold transition-all"
                          style={{ color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
                        >
                          {isExpanded ? '▲ Скрыть состав' : '▼ Состав'}
                        </button>

                        {isExpanded && (
                          <ul className="mt-2 flex flex-col gap-0.5">
                            {recipe.ingredients.map((ing, i) => (
                              <li key={i} className="flex justify-between text-xs py-1 border-b last:border-0"
                                style={{ borderColor: 'var(--border)' }}>
                                <span style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                                  {ing.name} {ing.pieces ? `${ing.pieces} шт.` : `${ing.grams}г`}
                                </span>
                                <span className="shrink-0 ml-2" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                                  {ing.calories} ккал
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-auto px-3 pb-3 pt-2 flex flex-col gap-2 border-t" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMrDiaryOpenId(prev => prev === recipe.id ? null : recipe.id)
                            setMrDiaryMeal('')
                            setMrDateMode('today')
                            setMrCustomDate('')
                            setMrServings(1)
                          }}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all"
                          style={{
                            fontFamily:  'var(--font-nunito)',
                            borderColor: '#2A9D5C',
                            color:       '#2A9D5C',
                            background:  isDiaryOpen ? '#2A9D5C18' : 'transparent',
                          }}
                        >
                          📓 В дневник {isDiaryOpen ? '▲' : '▼'}
                        </button>

                        {isConfirm ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleMrDelete(recipe.id)}
                              className="px-3 py-2 rounded-xl text-xs font-bold text-white"
                              style={{ background: '#E74C3C', fontFamily: 'var(--font-nunito)' }}
                            >
                              Удалить
                            </button>
                            <button
                              onClick={() => setMrConfirmId(null)}
                              className="px-3 py-2 rounded-xl text-xs border"
                              style={{ borderColor: 'var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}
                            >
                              Нет
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setMrConfirmId(recipe.id)}
                            className="px-3 py-2 rounded-xl text-xs border transition-all"
                            style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--border)', color: 'var(--muted)', background: 'transparent' }}
                          >
                            🗑
                          </button>
                        )}
                      </div>

                      {/* Diary picker */}
                      {isDiaryOpen && (
                        <div className="flex flex-col gap-2 pt-1">
                          <p className="text-[10px] font-bold uppercase tracking-wide"
                            style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                            Приём пищи
                          </p>
                          <div className="flex gap-1.5 flex-wrap">
                            {DIARY_MEAL_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setMrDiaryMeal(opt.value)}
                                className="flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                                style={{
                                  fontFamily:  'var(--font-nunito)',
                                  borderColor: mrDiaryMeal === opt.value ? 'var(--pur)' : 'var(--border)',
                                  color:       mrDiaryMeal === opt.value ? '#fff' : 'var(--muted)',
                                  background:  mrDiaryMeal === opt.value ? 'var(--pur)' : 'transparent',
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-wide"
                            style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                            Дата
                          </p>
                          <div className="flex gap-1.5">
                            {(['today', 'yesterday', 'custom'] as const).map(mode => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setMrDateMode(mode)}
                                className="flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                                style={{
                                  fontFamily:  'var(--font-nunito)',
                                  borderColor: mrDateMode === mode ? 'var(--pur)' : 'var(--border)',
                                  color:       mrDateMode === mode ? '#fff' : 'var(--muted)',
                                  background:  mrDateMode === mode ? 'var(--pur)' : 'transparent',
                                }}
                              >
                                {mode === 'today' ? 'Сегодня' : mode === 'yesterday' ? 'Вчера' : 'Другая ▼'}
                              </button>
                            ))}
                          </div>
                          {mrDateMode === 'custom' && (
                            <div style={{ position: 'relative', marginTop: '8px' }}>
                              <div style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #c4b5fd', background: '#f8f7ff', color: mrCustomDate ? '#1e1b4b' : '#9ca3af', fontSize: '15px', pointerEvents: 'none' }}>
                                📅 {mrCustomDate ? new Date(mrCustomDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Выберите дату'}
                              </div>
                              <input
                                type="date"
                                value={mrCustomDate}
                                onChange={e => setMrCustomDate(e.target.value)}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', fontSize: '16px' }}
                              />
                            </div>
                          )}
                          {/* Servings counter */}
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] font-bold uppercase tracking-wide"
                                style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                                Порций (из {recipe.servings_count || 1})
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setMrServings(s => Math.max(1, s - 1))}
                                  disabled={mrServings <= 1}
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold disabled:opacity-40"
                                  style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}
                                >−</button>
                                <span className="text-sm font-bold w-8 text-center"
                                  style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                                  {mrServings}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setMrServings(s => Math.min(recipe.servings_count || 1, s + 1))}
                                  disabled={mrServings >= (recipe.servings_count || 1)}
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold disabled:opacity-40"
                                  style={{ background: 'var(--bg)', border: '1.5px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}
                                >+</button>
                              </div>
                            </div>
                            {recipe.servings_count > 1 && (
                              <p className="text-[10px] text-right"
                                style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                                ≈ {Math.round((recipe.total_calories ?? 0) / recipe.servings_count * mrServings)} ккал
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            disabled={!mrDiaryMeal || mrDiaryLoadingId === recipe.id || (mrDateMode === 'custom' && !mrCustomDate)}
                            onClick={() => handleMrDiary(recipe)}
                            className="w-full py-2 rounded-xl text-xs font-bold transition-all"
                            style={{
                              fontFamily: 'var(--font-nunito)',
                              background: mrDiaryMeal ? '#2A9D5C' : 'var(--border)',
                              color:      mrDiaryMeal ? '#fff' : 'var(--muted)',
                              opacity:    mrDiaryLoadingId === recipe.id ? 0.6 : 1,
                            }}
                          >
                            {mrDiaryLoadingId === recipe.id ? 'Сохраняем...' : 'Добавить в дневник'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Only show favorites content when on favorites tab */}
      {activeTab === 'favorites' && <>

      {/* ── Counter + progress bar ── */}
      <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
            Сохранено рецептов
          </p>
          <span className="text-sm font-bold" style={{ color: 'var(--pur)', fontFamily: 'var(--font-unbounded)' }}>
            {totalDisplayCount} / {maxCount}
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
      {showSauces && visibleSauces.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="text-5xl">🥣</span>
          {savedSauces.length === 0 ? (
            <>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                Нет сохранённых соусов.
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                Сохрани соус на странице рецептов 🥒
              </p>
              <a
                href="/dashboard/kitchen/sauces"
                className="mt-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, var(--pur) 0%, #9B7CFF 100%)', fontFamily: 'var(--font-nunito)' }}
              >
                К соусам →
              </a>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              По запросу ничего не найдено
            </p>
          )}
        </div>
      )}
      {!showSauces && visible.length === 0 && !(filter === 'Все' && visibleSauces.length > 0) && (
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
      {!showSauces && <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    <div style={{ position: 'relative', marginTop: '8px' }}>
                      <div style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #c4b5fd', background: '#f8f7ff', color: diaryCustomDate ? '#1e1b4b' : '#9ca3af', fontSize: '15px', pointerEvents: 'none' }}>
                        📅 {diaryCustomDate ? new Date(diaryCustomDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Выберите дату'}
                      </div>
                      <input
                        type="date"
                        value={diaryCustomDate}
                        onChange={e => setDiaryCustomDate(e.target.value)}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', fontSize: '16px' }}
                      />
                    </div>
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
      </div>}

      {/* ── Sauces grid ── */}
      {(showSauces || filter === 'Все') && visibleSauces.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibleSauces.map(sauce => {
            const isConfirmSauce  = confirmId  === sauce.id
            const isDiaryOpenS    = diaryOpenId === sauce.id
            const isExpandedSauce = expanded   === sauce.id

            return (
              <div
                key={sauce.id}
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                {/* Card header */}
                <div className="px-4 pt-4 pb-3 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: '#F0EEFF', color: '#7C5CFC', fontFamily: 'var(--font-nunito)' }}
                    >
                      🥣 Соус
                    </span>
                  </div>

                  <p
                    className="text-sm font-bold leading-snug"
                    style={{ color: 'var(--text)', fontFamily: 'var(--font-unbounded)' }}
                  >
                    {sauce.emoji} {sauce.title}
                  </p>

                  {sauce.kbju && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#7C5CFC', color: '#fff', fontFamily: 'var(--font-nunito)' }}>
                        {sauce.kbju.kcal} ккал
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#A8E6CF', color: '#2D6A4F', fontFamily: 'var(--font-nunito)' }}>
                        Б: {sauce.kbju.protein}г
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FFD93D', color: '#5C4200', fontFamily: 'var(--font-nunito)' }}>
                        Ж: {sauce.kbju.fat}г
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FF9F43', color: '#fff', fontFamily: 'var(--font-nunito)' }}>
                        У: {sauce.kbju.carbs}г
                      </span>
                    </div>
                  )}
                </div>

                {/* Expandable ingredients/steps */}
                {(sauce.ingredients?.length || sauce.steps?.length) ? (
                  <div className="px-4 pb-2">
                    <button
                      onClick={() => setExpanded(isExpandedSauce ? null : sauce.id)}
                      className="text-xs font-semibold transition-all"
                      style={{ color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
                    >
                      {isExpandedSauce ? '▲ Скрыть рецепт' : '▼ Показать рецепт'}
                    </button>

                    {isExpandedSauce && (
                      <div className="mt-3 flex flex-col gap-3">
                        {sauce.ingredients && sauce.ingredients.length > 0 && (
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                              Ингредиенты
                            </p>
                            <ul className="flex flex-col gap-1">
                              {sauce.ingredients.map((ing, i) => (
                                <li key={i} className="text-xs py-1 border-b last:border-0" style={{ borderColor: 'var(--border)', color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                                  {ing}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {sauce.steps && sauce.steps.length > 0 && (
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                              Приготовление
                            </p>
                            <ol className="flex flex-col gap-2">
                              {sauce.steps.map((step, i) => (
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
                        {sauce.tip && (
                          <p className="text-xs italic" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                            💡 {sauce.tip}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Action buttons */}
                <div className="mt-auto px-3 pb-3 pt-2 flex flex-col gap-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex gap-2">
                    {sauce.kbju && (
                      <button
                        type="button"
                        onClick={() => openDiary(sauce.id)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all"
                        style={{
                          fontFamily:  'var(--font-nunito)',
                          borderColor: '#2A9D5C',
                          color:       '#2A9D5C',
                          background:  isDiaryOpenS ? '#2A9D5C18' : 'transparent',
                        }}
                      >
                        📓 В дневник {isDiaryOpenS ? '▲' : '▼'}
                      </button>
                    )}

                    {isConfirmSauce ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDeleteSauce(sauce.id)}
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
                        onClick={() => setConfirmId(sauce.id)}
                        className="px-3 py-2 rounded-xl text-xs border transition-all"
                        style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--border)', color: 'var(--muted)', background: 'transparent' }}
                      >
                        🗑
                      </button>
                    )}
                  </div>

                  {/* Inline diary picker for sauce */}
                  {isDiaryOpenS && sauce.kbju && (
                    <div className="flex flex-col gap-2 pt-1">
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
                        <div style={{ position: 'relative', marginTop: '8px' }}>
                          <div style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #c4b5fd', background: '#f8f7ff', color: diaryCustomDate ? '#1e1b4b' : '#9ca3af', fontSize: '15px', pointerEvents: 'none' }}>
                            📅 {diaryCustomDate ? new Date(diaryCustomDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Выберите дату'}
                          </div>
                          <input
                            type="date"
                            value={diaryCustomDate}
                            onChange={e => setDiaryCustomDate(e.target.value)}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', fontSize: '16px' }}
                          />
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={!diaryMeal || diaryLoadingId === sauce.id || (diaryDateMode === 'custom' && !diaryCustomDate)}
                        onClick={() => handleSauceDiary(sauce)}
                        className="w-full py-2 rounded-xl text-xs font-bold transition-all"
                        style={{
                          fontFamily: 'var(--font-nunito)',
                          background: diaryMeal ? '#2A9D5C' : 'var(--border)',
                          color:      diaryMeal ? '#fff' : 'var(--muted)',
                          opacity:    diaryLoadingId === sauce.id ? 0.6 : 1,
                        }}
                      >
                        {diaryLoadingId === sauce.id ? 'Сохраняем...' : 'Добавить в дневник'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      </>}

    </div>
  )
}
