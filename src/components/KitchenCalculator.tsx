'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Types ──────────────────────────────────────────────────────────────────────
interface NutritionItem {
  id: string
  name: string
  calories: number
  protein: number
  fat: number
  carbs: number
}

interface ListEntry {
  id: string
  product: NutritionItem
  grams: number
  pieces?: number
  calories: number
  protein: number
  fat: number
  carbs: number
}

const isEgg = (name: string) => /яйц/i.test(name)
const eggGrams = (name: string) => /перепел/i.test(name) ? 10 : 60
const eggLabel = (name: string) => /перепел/i.test(name) ? 'шт. (≈10г каждое)' : 'шт. (≈60г каждое)'

type MealType = 'breakfast' | 'lunch' | 'snack'

const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Завтрак'        },
  { value: 'lunch',     label: 'Обед / Ужин'    },
  { value: 'snack',     label: 'Дополнительный' },
]

function calcEntry(product: NutritionItem, grams: number) {
  const r = grams / 100
  return {
    calories: Math.round(r * product.calories),
    protein:  Math.round(r * product.protein  * 10) / 10,
    fat:      Math.round(r * product.fat       * 10) / 10,
    carbs:    Math.round(r * product.carbs     * 10) / 10,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function KitchenCalculator() {
  // Search
  const [query, setQuery]             = useState('')
  const [suggestions, setSuggestions] = useState<NutritionItem[]>([])
  const [showDrop, setShowDrop]       = useState(false)
  const [noResults, setNoResults]     = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Current product
  const [product, setProduct] = useState<NutritionItem | null>(null)
  const [grams, setGrams]     = useState<number | ''>(100)
  const [pieces, setPieces]   = useState(1)

  // List
  const [list, setList]             = useState<ListEntry[]>([])
  const [diaryOpen, setDiaryOpen]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [savedMsg, setSavedMsg]     = useState(false)

  // Recipe accordion
  const [recipeOpen, setRecipeOpen]         = useState(false)
  const [recipeName, setRecipeName]         = useState('')
  const [recipeServings, setRecipeServings] = useState(1)
  const [recipeSaving, setRecipeSaving]     = useState(false)
  const [recipeSavedMsg, setRecipeSavedMsg] = useState(false)
  const [recipeErr, setRecipeErr]           = useState('')

  // Derived: current calc
  const current = product && grams !== '' ? calcEntry(product, grams) : null

  // Derived: totals
  const totals = list.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein:  Math.round((acc.protein  + e.protein)  * 10) / 10,
      fat:      Math.round((acc.fat      + e.fat)       * 10) / 10,
      carbs:    Math.round((acc.carbs    + e.carbs)     * 10) / 10,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  )

  // ── Search ──────────────────────────────────────────────────────────────────
  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 2) {
      setSuggestions([])
      setShowDrop(false)
      setNoResults(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('nutrition')
        .select('id, name, calories, protein, fat, carbs')
        .ilike('name', `%${q}%`)
        .limit(8)
      const items = (data ?? []) as NutritionItem[]
      setSuggestions(items)
      setNoResults(items.length === 0)
      setShowDrop(true)
    }, 300)
  }, [])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  function handleQueryChange(val: string) {
    setQuery(val)
    if (!val) { setProduct(null) }
    search(val)
  }

  function selectProduct(item: NutritionItem) {
    setProduct(item)
    setQuery(item.name)
    if (isEgg(item.name)) {
      setPieces(1)
      setGrams(eggGrams(item.name))
    } else {
      setGrams(100)
    }
    setSuggestions([])
    setShowDrop(false)
    setNoResults(false)
  }

  function handleBlur() {
    setTimeout(() => setShowDrop(false), 150)
  }

  // ── Grams ───────────────────────────────────────────────────────────────────
  function handleGramsInput(val: string) {
    if (val === '') { setGrams(''); return }
    const num = parseInt(val, 10)
    if (!isNaN(num) && num >= 0) setGrams(num)
  }

  function handleGramsSlider(val: number) {
    setGrams(Math.min(500, Math.max(5, val)))
  }

  function handlePiecesChange(val: number) {
    const clamped = Math.min(20, Math.max(1, val))
    setPieces(clamped)
    setGrams(clamped * (product ? eggGrams(product.name) : 60))
  }

  // ── Add to list ─────────────────────────────────────────────────────────────
  function handleAdd() {
    if (!product || !current || grams === '' || grams <= 0) return
    const entry: ListEntry = {
      id:      `${product.id}-${Date.now()}`,
      product,
      grams,
      ...(isEgg(product.name) ? { pieces } : {}),
      ...current,
    }
    setList(prev => [...prev, entry])
    setQuery('')
    setProduct(null)
    setPieces(1)
    setGrams(100)
  }

  function removeEntry(id: string) {
    setList(prev => prev.filter(e => e.id !== id))
  }

  function clearAll() {
    setList([])
  }

  // ── Save as recipe ──────────────────────────────────────────────────────────
  async function handleSaveRecipe() {
    if (!recipeName.trim() || !list.length || recipeSaving) return
    setRecipeSaving(true)
    setRecipeErr('')
    try {
      const res = await fetch('/api/member-recipes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: recipeName.trim(),
          ingredients: list.map(e => ({
            name:     e.product.name,
            grams:    e.grams,
            ...(e.pieces != null ? { pieces: e.pieces } : {}),
            calories: e.calories,
            protein:  e.protein,
            fat:      e.fat,
            carbs:    e.carbs,
          })),
          total_calories:  totals.calories,
          total_protein:   totals.protein,
          total_fat:       totals.fat,
          total_carbs:     totals.carbs,
          servings_count:  recipeServings,
        }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? `HTTP ${res.status}`)
      }
      setRecipeOpen(false)
      setRecipeName('')
      setRecipeSavedMsg(true)
      setTimeout(() => setRecipeSavedMsg(false), 3000)
    } catch (err) {
      setRecipeErr(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setRecipeSaving(false)
    }
  }

  // ── Save to diary ───────────────────────────────────────────────────────────
  async function handleDiaryAdd(mealType: MealType) {
    if (!list.length || saving) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    for (const entry of list) {
      await fetch('/api/diary/entries', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date:      today,
          meal_type: mealType,
          title:     entry.pieces
            ? `${entry.product.name} ${entry.pieces} шт. (≈${entry.grams}г)`
            : `${entry.product.name} ${entry.grams}г`,
          calories:  entry.calories,
          protein:   entry.protein,
          fat:       entry.fat,
          carbs:     entry.carbs,
          source:    'calculator',
        }),
      })
    }
    setSaving(false)
    setDiaryOpen(false)
    setList([])
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 3000)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4" style={{ fontFamily: 'var(--font-nunito)' }}>

      {/* ── Поиск продукта ── */}
      <div className="rounded-2xl px-4 py-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-bold mb-3 uppercase tracking-widest"
          style={{ color: 'var(--muted)' }}>
          Продукт
        </p>

        <div className="relative">
          <input
            type="text"
            placeholder="Начните вводить название..."
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onBlur={handleBlur}
            className="w-full px-3 py-3 rounded-xl border text-sm outline-none"
            style={{
              borderColor: 'var(--border)',
              background:  'var(--bg)',
              color:       'var(--text)',
              fontFamily:  'var(--font-nunito)',
              minHeight:   48,
            }}
          />

          {showDrop && (
            <div className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden shadow-lg"
              style={{ background: '#FBF7F2', border: '1px solid var(--border)', zIndex: 50 }}>
              {noResults ? (
                <div className="px-3 py-2.5 text-sm" style={{ color: 'var(--muted)' }}>
                  Не найдено
                </div>
              ) : (
                suggestions.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={() => selectProduct(item)}
                    className="w-full text-left px-3 py-2.5 text-sm"
                    style={{
                      color:        'var(--text)',
                      background:   'transparent',
                      borderBottom: '1px solid var(--border)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#E8845A18')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span className="font-medium">{item.name}</span>
                    <span className="ml-2 text-xs" style={{ color: 'var(--muted)' }}>
                      {item.calories} ккал/100г
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Граммы + слайдер / Счётчик штук ── */}
        {product && (
          <div className="mt-4 flex flex-col gap-3">
            {isEgg(product.name) ? (
              /* Яйца — счётчик штук */
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handlePiecesChange(pieces - 1)}
                  className="w-10 h-10 rounded-xl text-xl font-bold flex items-center justify-center"
                  style={{ background: 'var(--bg)', border: '2px solid #E8845A', color: '#E8845A' }}
                >
                  −
                </button>
                <span className="text-xl font-bold w-8 text-center" style={{ color: '#2A2420' }}>
                  {pieces}
                </span>
                <button
                  type="button"
                  onClick={() => handlePiecesChange(pieces + 1)}
                  className="w-10 h-10 rounded-xl text-xl font-bold flex items-center justify-center"
                  style={{ background: 'var(--bg)', border: '2px solid #E8845A', color: '#E8845A' }}
                >
                  +
                </button>
                <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>
                  {eggLabel(product.name)}
                </span>
              </div>
            ) : (
              /* Обычный продукт — граммы + слайдер */
              <>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    step={5}
                    value={grams}
                    onChange={e => handleGramsInput(e.target.value)}
                    className="w-24 px-3 py-2 rounded-xl border text-sm font-bold outline-none text-center"
                    style={{
                      borderColor: '#E8845A',
                      background:  'var(--bg)',
                      color:       '#2A2420',
                      fontFamily:  'var(--font-nunito)',
                      minHeight:   44,
                    }}
                  />
                  <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>граммов</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={500}
                  step={5}
                  value={Math.min(Number(grams) || 5, 500)}
                  onChange={e => handleGramsSlider(Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: '#E8845A' }}
                />
              </>
            )}

            {/* Результат расчёта */}
            {current && (
              <div className="rounded-xl px-4 py-2.5 flex flex-wrap gap-2"
                style={{ background: '#F5E6D3', border: '1px solid #E8C9A8' }}>
                {isEgg(product.name) && (
                  <span className="text-sm font-semibold self-center" style={{ color: '#A04020' }}>
                    {pieces} шт. (≈{grams}г)
                  </span>
                )}
                <span className="text-sm font-bold" style={{ color: '#A04020' }}>
                  🔥 {current.calories} ккал
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold self-center"
                  style={{ background: '#7BAF8222', color: '#2D6A4F' }}>
                  Б {current.protein}г
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold self-center"
                  style={{ background: '#E8845A22', color: '#A04020' }}>
                  Ж {current.fat}г
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold self-center"
                  style={{ background: '#EDE8FF', color: 'var(--pur)' }}>
                  У {current.carbs}г
                </span>
              </div>
            )}

            <button
              onClick={handleAdd}
              className="w-full py-3 rounded-xl text-sm font-bold text-white"
              style={{
                minHeight:  48,
                background: '#E8845A',
                border:     'none',
                fontFamily: 'var(--font-nunito)',
              }}
            >
              + Добавить в список
            </button>
          </div>
        )}
      </div>

      {/* ── Список позиций ── */}
      {list.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

          {/* Заголовок таблицы */}
          <div className="px-4 py-2 hidden sm:grid"
            style={{
              gridTemplateColumns: '1fr 60px 56px 40px 40px 40px 32px',
              background: '#F5E6D3',
              borderBottom: '1px solid #E8C9A8',
            }}>
            {['Продукт', 'Г', 'Ккал', 'Б', 'Ж', 'У', ''].map(h => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: '#A08060' }}>{h}</span>
            ))}
          </div>

          {/* Строки */}
          {list.map(entry => (
            <div
              key={entry.id}
              className="px-4 py-2.5 flex items-center gap-2 sm:grid"
              style={{
                gridTemplateColumns: '1fr 60px 56px 40px 40px 40px 32px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {/* Мобильный вид */}
              <div className="flex-1 min-w-0 sm:contents">
                <span className="text-sm font-medium block sm:inline truncate"
                  style={{ color: '#2A2420' }}>
                  {entry.product.name}
                </span>
                <span className="text-xs block sm:inline sm:text-center"
                  style={{ color: 'var(--muted)' }}>
                  {entry.pieces ? `${entry.pieces} шт. (≈${entry.grams}г)` : `${entry.grams}г`}
                </span>
                <span className="text-xs font-semibold block sm:inline sm:text-center"
                  style={{ color: '#A04020' }}>
                  {entry.calories}
                </span>
                <span className="text-xs sm:text-center" style={{ color: '#2D6A4F' }}>
                  {entry.protein}
                </span>
                <span className="text-xs sm:text-center" style={{ color: '#A04020' }}>
                  {entry.fat}
                </span>
                <span className="text-xs sm:text-center" style={{ color: 'var(--pur)' }}>
                  {entry.carbs}
                </span>
              </div>
              <button
                onClick={() => removeEntry(entry.id)}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-base"
                style={{ color: 'var(--muted)', background: 'var(--bg)' }}
              >
                ×
              </button>
            </div>
          ))}

          {/* Итого */}
          <div className="px-4 py-3 flex flex-wrap items-center gap-3"
            style={{ background: '#F5E6D3', borderTop: '2px solid #E8C9A8' }}>
            <span className="text-xs font-bold uppercase tracking-wider"
              style={{ color: '#A08060' }}>
              Итого:
            </span>
            <span className="text-sm font-bold" style={{ color: '#A04020' }}>
              🔥 {totals.calories} ккал
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: '#7BAF8222', color: '#2D6A4F' }}>
              Б {totals.protein}г
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: '#E8845A22', color: '#A04020' }}>
              Ж {totals.fat}г
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: '#EDE8FF', color: 'var(--pur)' }}>
              У {totals.carbs}г
            </span>
          </div>

          {/* Кнопки действий */}
          <div className="px-4 py-3 flex flex-col gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setDiaryOpen(p => !p)}
                disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  minHeight:  48,
                  fontFamily: 'var(--font-nunito)',
                  background: diaryOpen ? 'var(--pur-light)' : 'var(--bg)',
                  color:      diaryOpen ? 'var(--pur)'       : 'var(--text)',
                  border:     `1.5px solid ${diaryOpen ? 'var(--pur)' : 'var(--border)'}`,
                }}
              >
                📓 Перенести в дневник
              </button>
              <button
                onClick={() => { setRecipeOpen(true); setRecipeName(''); setRecipeServings(1); setRecipeErr('') }}
                disabled={recipeOpen}
                className="px-3 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  minHeight:  48,
                  fontFamily: 'var(--font-nunito)',
                  background: recipeOpen ? '#2A9D5C18' : 'var(--bg)',
                  color:      '#2A9D5C',
                  border:     '1.5px solid #2A9D5C',
                  whiteSpace: 'nowrap',
                  opacity:    recipeOpen ? 0.5 : 1,
                }}
              >
                📝 Рецепт
              </button>
              <button
                onClick={clearAll}
                className="px-4 py-3 rounded-xl text-sm font-semibold"
                style={{
                  minHeight:  48,
                  fontFamily: 'var(--font-nunito)',
                  background: 'var(--bg)',
                  color:      'var(--muted)',
                  border:     '1.5px solid var(--border)',
                }}
              >
                Очистить
              </button>
            </div>

            {diaryOpen && (
              <div className="flex gap-2">
                {MEAL_TYPE_OPTIONS.map(mt => (
                  <button
                    key={mt.value}
                    onClick={() => handleDiaryAdd(mt.value)}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    style={{
                      minHeight:  44,
                      fontFamily: 'var(--font-nunito)',
                      background: 'var(--pur)',
                      color:      '#fff',
                    }}
                  >
                    {saving ? '...' : mt.label}
                  </button>
                ))}
              </div>
            )}

            {/* ── Аккордеон «Создать рецепт» ── */}
            {recipeOpen && (
              <div className="rounded-xl overflow-hidden"
                style={{ border: '1.5px solid #2A9D5C', background: 'var(--bg)' }}>

                {/* Заголовок */}
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <p className="text-sm font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-unbounded)' }}>
                    📝 Создать рецепт
                  </p>
                  <button
                    onClick={() => setRecipeOpen(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-base"
                    style={{ background: 'var(--border)', color: 'var(--muted)', border: 'none', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>

                {/* Контент */}
                <div className="px-4 py-3 flex flex-col gap-3">
                  {/* Поле названия */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase tracking-wide"
                      style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                      Название рецепта *
                    </label>
                    <input
                      type="text"
                      placeholder="Например: Омлет с овощами"
                      value={recipeName}
                      onChange={e => setRecipeName(e.target.value)}
                      autoFocus
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{
                        borderColor: 'var(--border)', background: 'var(--card)',
                        color: 'var(--text)', fontFamily: 'var(--font-nunito)', minHeight: 42,
                      }}
                    />
                  </div>

                  {/* Порций */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase tracking-wide"
                      style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                      Количество порций
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setRecipeServings(s => Math.max(1, s - 1))}
                        disabled={recipeServings <= 1}
                        className="w-9 h-9 rounded-xl text-lg font-bold flex items-center justify-center disabled:opacity-40"
                        style={{ background: 'var(--bg)', border: '1.5px solid #2A9D5C', color: '#2A9D5C' }}
                      >−</button>
                      <span className="text-base font-bold w-8 text-center"
                        style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                        {recipeServings}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRecipeServings(s => Math.min(20, s + 1))}
                        disabled={recipeServings >= 20}
                        className="w-9 h-9 rounded-xl text-lg font-bold flex items-center justify-center disabled:opacity-40"
                        style={{ background: 'var(--bg)', border: '1.5px solid #2A9D5C', color: '#2A9D5C' }}
                      >+</button>
                      {recipeServings > 1 && (
                        <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                          ≈ {Math.round(totals.calories / recipeServings)} ккал / порция
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Список продуктов */}
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    {list.map((entry, i) => (
                      <div key={entry.id}
                        className="px-3 py-2 flex justify-between items-center text-xs"
                        style={{ borderBottom: i < list.length - 1 ? '1px solid var(--border)' : 'none', fontFamily: 'var(--font-nunito)' }}>
                        <span style={{ color: 'var(--text)' }}>
                          {entry.product.name} {entry.pieces ? `${entry.pieces} шт.` : `${entry.grams}г`}
                        </span>
                        <span style={{ color: 'var(--muted)', flexShrink: 0, marginLeft: 8 }}>
                          {entry.calories} ккал
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Итого */}
                  <div className="rounded-xl px-3 py-2 flex flex-col gap-1.5"
                    style={{ background: '#F5E6D3', border: '1px solid #E8C9A8' }}>
                    {recipeServings > 1 && (
                      <div className="flex flex-wrap gap-2 pb-1.5" style={{ borderBottom: '1px solid #E8C9A8' }}>
                        <span className="text-[10px] font-bold uppercase tracking-wide self-center"
                          style={{ color: '#A08060', fontFamily: 'var(--font-nunito)' }}>1 порция:</span>
                        <span className="text-xs font-bold" style={{ color: '#A04020', fontFamily: 'var(--font-nunito)' }}>
                          🔥 {Math.round(totals.calories / recipeServings)} ккал
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: '#7BAF8222', color: '#2D6A4F', fontFamily: 'var(--font-nunito)' }}>
                          Б {Math.round(totals.protein / recipeServings * 10) / 10}г
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: '#E8845A22', color: '#A04020', fontFamily: 'var(--font-nunito)' }}>
                          Ж {Math.round(totals.fat / recipeServings * 10) / 10}г
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: '#EDE8FF', color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
                          У {Math.round(totals.carbs / recipeServings * 10) / 10}г
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide self-center"
                        style={{ color: '#A08060', fontFamily: 'var(--font-nunito)' }}>
                        {recipeServings > 1 ? 'Всего:' : 'Итого:'}
                      </span>
                      <span className="text-xs font-bold" style={{ color: '#A04020', fontFamily: 'var(--font-nunito)' }}>
                        🔥 {totals.calories} ккал
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: '#7BAF8222', color: '#2D6A4F', fontFamily: 'var(--font-nunito)' }}>
                        Б {totals.protein}г
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: '#E8845A22', color: '#A04020', fontFamily: 'var(--font-nunito)' }}>
                        Ж {totals.fat}г
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: '#EDE8FF', color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
                        У {totals.carbs}г
                      </span>
                    </div>
                  </div>

                  {recipeErr && (
                    <p className="text-xs" style={{ color: '#E74C3C', fontFamily: 'var(--font-nunito)' }}>
                      {recipeErr}
                    </p>
                  )}

                  {/* Кнопки */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveRecipe}
                      disabled={!recipeName.trim() || recipeSaving}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                      style={{ background: '#2A9D5C', border: 'none', fontFamily: 'var(--font-nunito)', minHeight: 44 }}
                    >
                      {recipeSaving ? 'Сохраняем...' : 'Сохранить рецепт'}
                    </button>
                    <button
                      onClick={() => setRecipeOpen(false)}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                      style={{
                        background: 'var(--bg)', color: 'var(--muted)',
                        border: '1.5px solid var(--border)', fontFamily: 'var(--font-nunito)', minHeight: 44,
                      }}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Успешно добавлено ── */}
      {savedMsg && (
        <div className="rounded-xl px-4 py-3"
          style={{ background: '#F0FFF4', border: '1px solid #A8E6CF' }}>
          <p className="text-sm font-semibold" style={{ color: '#2D6A4F', fontFamily: 'var(--font-nunito)' }}>
            ✓ Добавлено в дневник
          </p>
        </div>
      )}

      {/* ── Рецепт сохранён ── */}
      {recipeSavedMsg && (
        <div className="rounded-xl px-4 py-3"
          style={{ background: '#F0FFF4', border: '1px solid #A8E6CF' }}>
          <p className="text-sm font-semibold" style={{ color: '#2D6A4F', fontFamily: 'var(--font-nunito)' }}>
            ✓ Рецепт сохранён в «Мои рецепты»
          </p>
        </div>
      )}

      {/* ── Пустое состояние ── */}
      {list.length === 0 && !product && (
        <div className="rounded-2xl px-5 py-8 text-center"
          style={{ background: '#F5E6D3', border: '1px solid #E8C9A8' }}>
          <p className="text-3xl mb-2">🧮</p>
          <p className="text-sm" style={{ color: '#6A4A2A', fontFamily: 'var(--font-nunito)' }}>
            Найдите продукт и укажите граммы — КБЖУ рассчитается автоматически
          </p>
        </div>
      )}
    </div>
  )
}
