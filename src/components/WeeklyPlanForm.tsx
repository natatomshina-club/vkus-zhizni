'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  kbjuCalories: number | null
  kbjuProtein:  number | null
  kbjuFat:      number | null
  kbjuCarbs:    number | null
}

export default function WeeklyPlanForm({ kbjuCalories, kbjuProtein, kbjuFat, kbjuCarbs }: Props) {
  const router = useRouter()
  const hasKbju = !!(kbjuCalories && kbjuProtein && kbjuFat && kbjuCarbs)

  const [mealsPerDay,   setMealsPerDay]   = useState<2 | 3>(2)
  const [includeSalads, setIncludeSalads] = useState(false)
  const [products,     setProducts]     = useState<string[]>([])
  const [inputVal,     setInputVal]     = useState('')
  const [suggestions,  setSuggestions]  = useState<string[]>([])
  const [showDrop,     setShowDrop]     = useState(false)
  const [noResults,    setNoResults]    = useState(false)
  const [status,       setStatus]       = useState<'idle' | 'loading' | 'success'>('idle')
  const [error,        setError]        = useState<string | null>(null)
  const [showInfo,     setShowInfo]     = useState(false)
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchProducts = useCallback((query: string) => {
    if (debRef.current) clearTimeout(debRef.current)
    if (query.trim().length < 2) {
      setSuggestions([]); setShowDrop(false); setNoResults(false); return
    }
    debRef.current = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('nutrition')
        .select('id, name')
        .ilike('name', `%${query}%`)
        .neq('id', 209)  // фарш говяжий 15% — нет рецептов с таким protein_tag
        .limit(8)
      const names = (data ?? []).map((r: { name: string }) => r.name)
      setSuggestions(names)
      setNoResults(names.length === 0)
      setShowDrop(true)
    }, 300)
  }, [])

  function handleInputChange(val: string) {
    setInputVal(val)
    searchProducts(val)
  }

  function addProduct(name: string) {
    const lower = name.toLowerCase()
    if (!products.includes(lower)) setProducts(prev => [...prev, lower])
    setInputVal('')
    setSuggestions([])
    setShowDrop(false)
    setNoResults(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Добавляем только если есть совпадение в suggestions из таблицы nutrition
      if (suggestions.length > 0) {
        addProduct(suggestions[0])
      }
    }
  }

  function removeProduct(p: string) {
    setProducts(prev => prev.filter(x => x !== p))
  }

  async function handleSubmit() {
    if (!hasKbju || status !== 'idle') return
    setStatus('loading')
    setError(null)

    const res = await fetch('/api/kitchen/weekly/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meals_per_day:  mealsPerDay,
        include_salads: includeSalads,
        user_products:  products,
      }),
    })

    if (!res.ok) {
      setStatus('idle')
      const err = await res.json().catch(() => ({}))
      if (err.error === 'cooldown') {
        const d = new Date(err.next_available)
        setError(`Следующий рацион можно создать ${d.toLocaleDateString('ru-RU')}`)
      } else if (err.error === 'trial_limit') {
        setError('В триале доступен 1 рацион на неделю')
      } else if (err.error === 'no_kbju') {
        setError('Заполни профиль — нужен расчёт КБЖУ')
      } else {
        setError(err.message ?? 'Что-то пошло не так. Попробуй ещё раз.')
      }
      return
    }

    const { plan_id } = await res.json()
    setStatus('success')
    setTimeout(() => {
      router.push(`/dashboard/kitchen/weekly/${plan_id}`)
    }, 1500)
  }

  const btnStyle = (active: boolean) => ({
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    fontFamily: 'var(--font-nunito)',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    border: `2px solid ${active ? '#E8845A' : 'var(--border)'}`,
    background: active ? '#E8845A18' : 'var(--card)',
    color: active ? '#E8845A' : 'var(--muted)',
    transition: 'all .15s',
  })

  return (
    <div className="flex flex-col gap-5 max-w-xl mx-auto">

      {/* Блок 0: Как работает рацион — первый, чтобы пользователь прочёл до ввода */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={() => setShowInfo(v => !v)}
          className="w-full flex items-center justify-between px-4 py-4"
        >
          <span className="text-sm font-bold"
            style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
            📋 Как работает рацион на неделю
          </span>
          <span style={{ color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--font-nunito)' }}>
            {showInfo ? '▲' : '▼'}
          </span>
        </button>
        {showInfo && (
          <div className="px-4 pb-4 flex flex-col gap-0"
            style={{ borderTop: '1px solid var(--border)' }}>
            {[
              {
                emoji: '🍽', title: 'Режим питания',
                items: [
                  '2-разовое: завтрак + обед/ужин',
                  '3-разовое: завтрак + обед + ужин (приёмы 2 и 3 — одинаковый рецепт, кроме особых дней с белковым салатом — там обед и ужин разные)',
                ],
              },
              {
                emoji: '🥗', title: 'Салаты (если включены)',
                items: [
                  'При 2-разовом: 3 дня — овощной салат как добавка к обеду, 2 дня — белковый салат вместо обеда, 2 дня — без салатов',
                  'При 3-разовом: 2 дня — белковый салат на обед (ужин в эти дни — отдельный рецепт), 3 дня — овощной салат как добавка, 2 дня — без салатов',
                ],
              },
              {
                emoji: '🥩', title: 'Чередование белков',
                items: [
                  'Если вы указали несколько белковых продуктов, мы чередуем их по дням — никакой белок не повторяется 3 дня подряд',
                  'При 3-разовом завтрак и обед/ужин могут быть из разных белков',
                  'Свежая рыба (если указана) появляется 2 раза в неделю',
                  'Копчёная/солёная рыба идёт без нагрева — на завтрак или в салат',
                ],
              },
              {
                emoji: '🥦', title: 'Разнообразие овощей',
                items: [
                  'Все овощи из вашего списка появляются в рационе хотя бы раз за неделю',
                  'В один день обед и ужин не дублируют один и тот же главный овощ',
                  'Овощи взаимозаменяемы: любой овощ в рецепте можно заменить на другой из вашего списка — алгоритм подбирает рецепты с учётом ваших предпочтений, но в готовке вы свободно меняете',
                  'Зелень в салатах: салат, шпинат, руккола, айсберг — взаимозаменяемы, можно заменять друг на друга или делать микс из нескольких видов',
                ],
              },
              {
                emoji: '⏱', title: 'Готовка на несколько дней',
                items: [
                  'Базовый рацион рассчитан на готовку каждый день (1 порция на приём)',
                  'Если хотите готовить заранее — приготовьте любой рецепт сразу на 2–3 дня: умножьте граммовку всех ингредиентов на 2 или 3. Готовое блюдо храните в холодильнике до 3 дней.',
                ],
              },
              {
                emoji: '🎯', title: 'Расчёт КБЖУ',
                items: [
                  'Каждый рецепт автоматически масштабируется под ваши индивидуальные цели по белкам, жирам и углеводам',
                  'Если итоговые углеводы превышают норму — мы автоматически уменьшаем граммовку «объёмных» овощей (капуста, кабачок, фасоль и т.п.)',
                ],
              },
            ].map(({ emoji, title, items }) => (
              <div key={title} className="pt-3">
                <p className="text-xs font-bold mb-1.5"
                  style={{ color: '#E8845A', fontFamily: 'var(--font-nunito)' }}>
                  {emoji} {title}
                </p>
                <ul className="flex flex-col gap-1">
                  {items.map((item, i) => (
                    <li key={i} className="text-xs leading-relaxed flex gap-1.5"
                      style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                      <span style={{ flexShrink: 0 }}>—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Блок 1: КБЖУ */}
      <div className="rounded-2xl px-4 py-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Твои цели
        </p>
        {hasKbju ? (
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Калории', val: `${kbjuCalories} ккал`, color: '#E8845A' },
              { label: 'Белки',   val: `${kbjuProtein}г`,      color: '#7BAF82' },
              { label: 'Жиры',    val: `${kbjuFat}г`,          color: '#7C5CFC' },
              { label: 'Углеводы',val: `до ${kbjuCarbs}г`,     color: '#FF9F43' },
            ].map(({ label, val, color }) => (
              <div key={label} className="px-3 py-1.5 rounded-xl text-sm font-semibold"
                style={{ background: `${color}15`, color, fontFamily: 'var(--font-nunito)', border: `1px solid ${color}30` }}>
                {label}: <strong>{val}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            ⚠️ Сначала <a href="/dashboard/profile" className="underline font-semibold" style={{ color: '#E8845A' }}>заполни профиль</a> — нужен расчёт КБЖУ
          </p>
        )}
      </div>

      {/* Блок 2: Приёмы пищи */}
      <div className="rounded-2xl px-4 py-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Приёмы пищи
        </p>
        <div className="flex gap-2">
          {([2, 3] as const).map(n => (
            <button key={n} type="button" onClick={() => setMealsPerDay(n)} style={btnStyle(mealsPerDay === n)}>
              {n} раза в день
            </button>
          ))}
        </div>
      </div>

      {/* Блок 3: Салаты */}
      <div className="rounded-2xl px-4 py-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Салаты
        </p>
        <div className="flex gap-2 mb-2">
          <button type="button" onClick={() => setIncludeSalads(true)}  style={btnStyle(includeSalads)}>🥗 Добавить салаты</button>
          <button type="button" onClick={() => setIncludeSalads(false)} style={btnStyle(!includeSalads)}>Без салатов</button>
        </div>
        {includeSalads && (
          <p className="text-xs mt-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            💡 3 дня — лёгкий овощной салат к обеду, 2 дня — белковый салат вместо обеда
          </p>
        )}
      </div>

      {/* Блок 4: Продукты */}
      <div className="rounded-2xl px-4 py-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-1"
          style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Продукты в холодильнике
        </p>
        <p className="text-xs mb-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Укажи что есть — подберём рецепты. Остальное покажем в списке покупок.
        </p>
        <div className="relative mb-3">
          <input
            type="text"
            value={inputVal}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            placeholder="Начни вводить продукт..."
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--bg)', border: '1.5px solid var(--border)',
              fontFamily: 'var(--font-nunito)', color: 'var(--text)', minHeight: 48,
            }}
          />
          {showDrop && (
            <div className="absolute top-full left-0 right-0 z-10 rounded-xl mt-1 overflow-hidden"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,.08)' }}>
              {noResults
                ? <p className="px-4 py-3 text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Ничего не найдено</p>
                : suggestions.map(name => (
                    <button key={name} type="button" onMouseDown={() => addProduct(name)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--bg)] transition-colors"
                      style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)' }}>
                      {name}
                    </button>
                  ))
              }
            </div>
          )}
        </div>
        {products.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {products.map(p => (
              <span key={p} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: '#E8845A18', color: '#E8845A', border: '1px solid #E8845A40', fontFamily: 'var(--font-nunito)' }}>
                {p}
                <button type="button" onClick={() => removeProduct(p)}
                  className="ml-1 leading-none text-base" style={{ color: '#E8845A' }}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Ошибка */}
      {error && (
        <div className="rounded-2xl px-4 py-3 text-sm font-semibold"
          style={{ background: '#FF6B6B18', border: '1px solid #FF6B6B40', color: '#CC3333', fontFamily: 'var(--font-nunito)' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Кнопка */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!hasKbju || status !== 'idle'}
        className="w-full rounded-2xl text-base font-bold transition-all disabled:opacity-60"
        style={{
          minHeight: 56,
          background: status === 'success' ? '#7BAF82' : '#E8845A',
          color: '#fff',
          border: 'none',
          cursor: hasKbju && status === 'idle' ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--font-nunito)',
          transition: 'background .3s',
        }}
      >
        {status === 'loading' ? '⏳ Составляем рацион...'
          : status === 'success' ? '✅ Рацион готов! Открываем...'
          : '🥗 Составить рацион на неделю'}
      </button>
    </div>
  )
}
