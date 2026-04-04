'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type KbjuPerServing = {
  kcal: number
  protein: number
  fat: number
  carbs: number
  per: string
}

type Sauce = {
  id: string
  emoji: string
  title: string
  time: string
  kbju?: KbjuPerServing | null
  ingredients?: string[]
  steps?: string[]
  tip?: string
  isVideo?: boolean
  videoUrl?: string
  canSave?: boolean
}

const SAUCES: Sauce[] = [
  {
    id: 'sauce_1',
    emoji: '🥒',
    title: 'Соус Греческий — Дзадзики',
    time: '2–3 мин',
    kbju: { kcal: 32, protein: 0.4, fat: 3, carbs: 0.9, per: '20г (1 ст.л.)' },
    ingredients: [
      'Сметана 20% — 200 г',
      'Огурец — 200 г',
      'Укроп — 7 г',
      'Петрушка — 7 г',
      'Зелёный лук — 7 г',
      'Масло оливковое — 20 г',
      'Чеснок — ½ зубчика',
      'Сок лимона — 2 ст.л. (по желанию)',
      'Соль',
    ],
    steps: [
      'Огурец натрите на тёрке и отожмите лишнюю жидкость.',
      'Измельчите зелень и чеснок.',
      'В ёмкости хорошо смешайте все ингредиенты.',
    ],
  },
  {
    id: 'sauce_2',
    emoji: '🌿',
    title: 'Соус Песто',
    time: '~5 мин',
    kbju: { kcal: 154, protein: 0.7, fat: 9.5, carbs: 1, per: '20г (1 ст.л.)' },
    ingredients: [
      'Петрушка (только листья) — 50 г',
      'Базилик зелёный (только листья) — 10 г',
      'Чеснок — 1 небольшой зубчик',
      'Масло оливковое — 70 мл',
      'Сок лимона — 2 ст.л.',
      'Любые орехи (миндаль, грецкие, тыквенные / кедровые семечки) — 20–25 г',
      'Вода — 2–3 ст.л.',
      'Соль по вкусу',
    ],
    steps: [
      'Зелень промыть, обсушить и оборвать листики. Жёсткие стебли не используем!',
      'Все ингредиенты сложить в блендер и смолоть почти в пюре.',
      'Переложить в банку, накрыть плёнкой в контакт (без доступа воздуха), затем крышкой. Хранить в холодильнике 2–3 дня или заморозить порционно в силиконовых формочках.',
    ],
    tip: 'Вместо петрушки можно использовать рукколу и менять соотношение с базиликом по вкусу.',
  },
  {
    id: 'sauce_3',
    emoji: '🟢',
    title: 'Зелёный соус к любому блюду',
    time: '~5 мин',
    kbju: { kcal: 154, protein: 0.7, fat: 9.5, carbs: 1, per: '20г (1 ст.л.)' },
    ingredients: [
      'Кинза (только листья) — 15 г',
      'Петрушка (только листья) — 50 г',
      'Чеснок — 1 небольшой зубчик',
      'Масло оливковое — 70 мл',
      'Сок лимона — 2 ст.л.',
      'Каперсы — 24 г',
      'Соль по вкусу',
    ],
    steps: [
      'Зелень промыть, обсушить и оборвать листики. Жёсткие стебли не используем!',
      'Все ингредиенты сложить в блендер и смолоть почти в пюре.',
      'Переложить в банку, накрыть плёнкой в контакт. Хранить в холодильнике 2–3 дня или заморозить порционно.',
    ],
  },
  {
    id: 'sauce_4',
    emoji: '🫙',
    title: 'Домашний майонез на оливковом масле',
    time: '~3 мин',
    kbju: { kcal: 215, protein: 1, fat: 23, carbs: 0.4, per: '30г (1 ст.л.)' },
    ingredients: [
      'Яйцо — 1 шт',
      'Масло оливковое (или рафинированное) — 150 мл',
      'Сок лимона — 1 ст.л.',
      'Дижонская горчица — ½ ч.л. (по желанию)',
      'Соль по вкусу',
    ],
    steps: [
      'Налить масло в высокий стакан блендера, аккуратно разбить яйцо, добавить соль, лимонный сок и горчицу.',
      'Накрыть погружным блендером и начать взбивать. Первые 2 минуты не поднимать блендер.',
      'Когда масса начнёт густеть — аккуратно водить вверх-вниз, чтобы пробить все ингредиенты.',
    ],
  },
  {
    id: 'sauce_5',
    emoji: '🧀',
    title: 'Универсальная заправка для салата',
    time: '~2 мин',
    kbju: null,
    ingredients: [
      'Творожный сыр — 50 г',
      'Сметана от 20% — 40 г',
      'Масло оливковое — 1 ст.л.',
      'Чеснок — ½ небольшого зубчика',
      'Соль',
      'Яблочный уксус — ½ ч.л.',
    ],
    steps: [
      'Все ингредиенты сложить в стакан блендера.',
      'Взбить до однородности.',
    ],
    tip: 'Количество ингредиентов примерное — ищите свою идеальную пропорцию по вкусу.',
  },
  {
    id: 'sauce_ghee',
    emoji: '🧈',
    title: 'Масло ГХИ — как приготовить',
    time: 'видео-рецепт',
    isVideo: true,
    videoUrl: 'https://kinescope.io/embed/wpkVhthrt1EnYBsB1VqR9t',
    canSave: false,
  },
]

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Завтрак' },
  { value: 'lunch',     label: 'Обед / Ужин' },
  { value: 'snack',     label: 'Дополнительный' },
]

export default function SaucesPage() {
  const router = useRouter()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [savedSet, setSavedSet] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const raw = localStorage.getItem('saved_sauces')
      if (!raw) return new Set()
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return new Set()
      // New format: array of objects; old format: array of strings
      if (parsed.length > 0 && typeof parsed[0] === 'object') {
        return new Set(parsed.map((s: { id: string }) => s.id))
      }
      return new Set(parsed as string[])
    } catch { return new Set() }
  })
  const [justSaved, setJustSaved]       = useState<string | null>(null)
  const [diaryOpenId, setDiaryOpenId]   = useState<string | null>(null)
  const [diaryLoading, setDiaryLoading] = useState(false)

  // Cleanup: remove old entries saved without 'ingredients' field
  useEffect(() => {
    try {
      const raw = localStorage.getItem('saved_sauces')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return
      const cleaned = parsed.filter((s: unknown) => typeof s === 'object' && s !== null && 'ingredients' in s)
      if (cleaned.length !== parsed.length) {
        localStorage.setItem('saved_sauces', JSON.stringify(cleaned))
        setSavedSet(new Set((cleaned as unknown as { id: string }[]).map(s => s.id)))
      }
    } catch { /* ignore */ }
  }, [])

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
    setDiaryOpenId(null)
  }

  function saveSauce(sauce: Sauce) {
    const newSet = new Set(savedSet).add(sauce.id)
    setSavedSet(newSet)

    const savedObj = {
      id:          sauce.id,
      title:       sauce.title,
      emoji:       sauce.emoji,
      category:    'соус' as const,
      kbju:        sauce.kbju
        ? { kcal: sauce.kbju.kcal, protein: sauce.kbju.protein, fat: sauce.kbju.fat, carbs: sauce.kbju.carbs }
        : null,
      ingredients: sauce.ingredients ?? null,
      steps:       sauce.steps ?? null,
      tip:         sauce.tip ?? null,
      savedAt:     new Date().toISOString(),
    }

    try {
      const raw = localStorage.getItem('saved_sauces')
      let existing: typeof savedObj[] = []
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
          existing = (parsed as typeof savedObj[]).filter(s => s.id !== sauce.id)
        }
      }
      localStorage.setItem('saved_sauces', JSON.stringify([savedObj, ...existing]))
    } catch { /* ignore */ }

    setJustSaved(sauce.id)
    setTimeout(() => setJustSaved(null), 2000)
  }

  async function addToDiary(sauce: Sauce, mealType: string) {
    if (!sauce.kbju) return
    setDiaryLoading(true)
    const today = new Date().toISOString().split('T')[0]
    await fetch('/api/diary/entries', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date:      today,
        meal_type: mealType,
        title:     `${sauce.title} (${sauce.kbju.per})`,
        calories:  sauce.kbju.kcal,
        protein:   sauce.kbju.protein,
        fat:       sauce.kbju.fat,
        carbs:     sauce.kbju.carbs,
        source:    'manual',
      }),
    })
    setDiaryLoading(false)
    setDiaryOpenId(null)
  }

  return (
    <div className="min-h-screen" style={{ background: '#F0EEFF' }}>

      {/* Mobile header */}
      <header
        className="lg:hidden flex items-center px-4 py-4 sticky top-0 z-40"
        style={{ background: '#F0EEFF', borderBottom: '1px solid #DDD5FF' }}
      >
        <button
          onClick={() => router.back()}
          className="mr-3 text-xl"
          style={{ color: 'var(--text)' }}
        >
          ←
        </button>
        <h1
          className="text-base font-bold"
          style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}
        >
          🥣 Соусы и заправки
        </h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-8">

        {/* Desktop title */}
        <div className="hidden lg:block mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm font-semibold mb-3 flex items-center gap-1"
            style={{ color: '#7C5CFC', fontFamily: 'var(--font-nunito)' }}
          >
            ← Назад
          </button>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}
          >
            🥣 Соусы и заправки
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}
          >
            Простые рецепты, которые сделают любое блюдо вкуснее
          </p>
        </div>

        {/* Sauce cards */}
        <div className="flex flex-col gap-3">
          {SAUCES.map(sauce => {
            const isExpanded   = expandedId === sauce.id
            const isSaved      = savedSet.has(sauce.id)
            const wasJustSaved = justSaved === sauce.id
            const canSave      = sauce.canSave !== false
            const isDiaryOpen  = diaryOpenId === sauce.id

            return (
              <div
                key={sauce.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#fff', border: '2px solid #DDD5FF' }}
              >
                {/* Collapsed header */}
                <button
                  onClick={() => toggleExpand(sauce.id)}
                  className="w-full text-left px-4 py-4 flex items-center gap-3"
                >
                  <span className="text-2xl shrink-0">{sauce.emoji}</span>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-bold leading-snug"
                      style={{ color: '#2D1F6E', fontFamily: 'var(--font-nunito)' }}
                    >
                      {sauce.title}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}
                    >
                      ⏱ {sauce.time}
                    </p>
                    {sauce.kbju && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: '#7C5CFC', color: '#fff' }}
                        >
                          {sauce.kbju.kcal} ккал
                        </span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: '#A8E6CF', color: '#2D6A4F' }}
                        >
                          Б {sauce.kbju.protein}г
                        </span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: '#FFD93D', color: '#5C4200' }}
                        >
                          Ж {sauce.kbju.fat}г
                        </span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: '#FF9F43', color: '#fff' }}
                        >
                          У {sauce.kbju.carbs}г
                        </span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: '#F0EEFF', color: '#9B8FCC', fontFamily: 'var(--font-nunito)' }}
                        >
                          {sauce.kbju.per}
                        </span>
                      </div>
                    )}
                  </div>

                  <span
                    className="shrink-0 text-sm"
                    style={{ color: '#9B8FCC' }}
                  >
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ background: '#F8F5FF', borderTop: '1px solid #DDD5FF' }}>

                    {sauce.isVideo ? (
                      /* Video card */
                      <div className="p-4">
                        <div
                          className="rounded-xl overflow-hidden w-full"
                          style={{ aspectRatio: '16/9' }}
                        >
                          <iframe
                            src={sauce.videoUrl}
                            className="w-full h-full"
                            allow="autoplay; fullscreen; encrypted-media"
                            allowFullScreen
                            style={{ border: 'none', display: 'block' }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-4 flex flex-col gap-4">

                        {/* Ingredients */}
                        {sauce.ingredients && (
                          <div>
                            <p
                              className="text-[10px] font-bold uppercase tracking-widest mb-2"
                              style={{ color: '#9B8FCC', fontFamily: 'var(--font-nunito)' }}
                            >
                              Ингредиенты
                            </p>
                            <ul className="flex flex-col gap-1">
                              {sauce.ingredients.map((ing, i) => (
                                <li
                                  key={i}
                                  className="text-sm"
                                  style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}
                                >
                                  • {ing}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Steps */}
                        {sauce.steps && (
                          <div>
                            <p
                              className="text-[10px] font-bold uppercase tracking-widest mb-2"
                              style={{ color: '#9B8FCC', fontFamily: 'var(--font-nunito)' }}
                            >
                              Приготовление
                            </p>
                            <ol className="flex flex-col gap-2">
                              {sauce.steps.map((step, i) => (
                                <li key={i} className="flex gap-2.5">
                                  <span
                                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                                    style={{ background: '#7C5CFC', color: '#fff' }}
                                  >
                                    {i + 1}
                                  </span>
                                  <span
                                    className="text-sm leading-snug"
                                    style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}
                                  >
                                    {step}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Tip */}
                        {sauce.tip && (
                          <div
                            className="rounded-xl px-4 py-3"
                            style={{
                              background:   '#FFF9E6',
                              borderLeft:   '4px solid #FFD93D',
                              borderTop:    '1px solid #FFD93D66',
                              borderRight:  '1px solid #FFD93D66',
                              borderBottom: '1px solid #FFD93D66',
                            }}
                          >
                            <p
                              className="text-xs leading-relaxed"
                              style={{ color: '#8B6914', fontFamily: 'var(--font-nunito)' }}
                            >
                              💡 {sauce.tip}
                            </p>
                          </div>
                        )}

                        {/* Action buttons */}
                        {canSave && (
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveSauce(sauce)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                                style={{
                                  minHeight:  44,
                                  fontFamily: 'var(--font-nunito)',
                                  background: wasJustSaved || isSaved ? '#FFD93D' : '#FFF9E6',
                                  color:      '#5C4200',
                                  border:     '2px solid #FFD93D',
                                }}
                              >
                                {wasJustSaved ? '✅ Сохранено!' : isSaved ? '⭐ В избранном' : '⭐ Сохранить'}
                              </button>

                              {sauce.kbju && (
                                <button
                                  onClick={() => setDiaryOpenId(prev => prev === sauce.id ? null : sauce.id)}
                                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                                  style={{
                                    minHeight:  44,
                                    fontFamily: 'var(--font-nunito)',
                                    background: isDiaryOpen ? '#A8E6CF' : '#F0EEFF',
                                    color:      isDiaryOpen ? '#2D6A4F' : '#7C5CFC',
                                    border:     `2px solid ${isDiaryOpen ? '#A8E6CF' : '#DDD5FF'}`,
                                  }}
                                >
                                  📓 В дневник
                                </button>
                              )}
                            </div>

                            {isDiaryOpen && (
                              <div className="flex gap-2">
                                {MEAL_TYPES.map(mt => (
                                  <button
                                    key={mt.value}
                                    onClick={() => addToDiary(sauce, mt.value)}
                                    disabled={diaryLoading}
                                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                    style={{
                                      minHeight:  36,
                                      fontFamily: 'var(--font-nunito)',
                                      background: '#A8E6CF',
                                      color:      '#2D6A4F',
                                      border:     '2px solid #A8E6CF',
                                    }}
                                  >
                                    {mt.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="h-8" />
      </div>
    </div>
  )
}
