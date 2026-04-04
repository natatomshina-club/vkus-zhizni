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
  calories: number
  protein: number
  fat: number
  carbs: number
}

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
  const [grams, setGrams]     = useState(100)

  // List
  const [list, setList]             = useState<ListEntry[]>([])
  const [diaryOpen, setDiaryOpen]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [savedMsg, setSavedMsg]     = useState(false)

  // Derived: current calc
  const current = product ? calcEntry(product, grams) : null

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
    setGrams(100)
    setSuggestions([])
    setShowDrop(false)
    setNoResults(false)
  }

  function handleBlur() {
    setTimeout(() => setShowDrop(false), 150)
  }

  // ── Grams ───────────────────────────────────────────────────────────────────
  function handleGramsChange(val: number) {
    const clamped = Math.min(500, Math.max(5, val))
    setGrams(clamped)
  }

  // ── Add to list ─────────────────────────────────────────────────────────────
  function handleAdd() {
    if (!product || !current) return
    const entry: ListEntry = {
      id:      `${product.id}-${Date.now()}`,
      product,
      grams,
      ...current,
    }
    setList(prev => [...prev, entry])
    setQuery('')
    setProduct(null)
    setGrams(100)
  }

  function removeEntry(id: string) {
    setList(prev => prev.filter(e => e.id !== id))
  }

  function clearAll() {
    setList([])
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
          title:     `${entry.product.name} ${entry.grams}г`,
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

        {/* ── Граммы + слайдер ── */}
        {product && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={5}
                max={500}
                step={5}
                value={grams}
                onChange={e => handleGramsChange(Number(e.target.value))}
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
              value={grams}
              onChange={e => handleGramsChange(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: '#E8845A' }}
            />

            {/* Результат расчёта */}
            {current && (
              <div className="rounded-xl px-4 py-2.5 flex flex-wrap gap-2"
                style={{ background: '#F5E6D3', border: '1px solid #E8C9A8' }}>
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
                  {entry.grams}г
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
