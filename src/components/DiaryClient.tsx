'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ── API helpers ────────────────────────────────────────────────────────────────
async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(path, init)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error(`API ${path} failed:`, res.status, err)
  }
  return res
}

// ── Types ──────────────────────────────────────────────────────────────────────
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
type ModalSection = 'breakfast' | 'lunch' | 'snack'
type ModalTab = 'favorites' | 'manual'

interface DiaryEntry {
  id: string
  meal_type: MealType
  title: string
  calories: number
  protein: number
  fat: number
  carbs: number
  source: string
}

interface SavedRecipe {
  id: string
  title: string
  kbju_calories: number
  kbju_protein: number
  kbju_fat: number
  kbju_carbs: number
}

interface ManualForm {
  title: string
  calories: string
  protein: string
  fat: string
  carbs: string
}

// Relaxed input type — Supabase returns meal_type as string, not union literal
type DiaryEntryRaw = Omit<DiaryEntry, 'meal_type'> & { meal_type: string }

interface Props {
  userId: string
  today: string
  kbju: { calories: number | null; protein: number | null; fat: number | null; carbs: number | null }
  initialEntries: DiaryEntryRaw[]
  initialWater: number
  initialMarkedDays: number[]
  initialYear: number
  initialMonth: number
  initialNote: { tags: string[]; note: string }
  initialNoteDays: number[]
}

// ── Constants ──────────────────────────────────────────────────────────────────
const MEAL_SECTIONS: {
  key: ModalSection
  label: string
  icon: string
  types: MealType[]
  addType: MealType
}[] = [
  { key: 'breakfast', label: 'Завтрак',              icon: '☀️', types: ['breakfast'],        addType: 'breakfast' },
  { key: 'lunch',     label: 'Обед / Ужин',          icon: '🍽️', types: ['lunch', 'dinner'],  addType: 'lunch'     },
  { key: 'snack',     label: 'Дополнительный приём', icon: '🍎', types: ['snack'],            addType: 'snack'     },
]

const MONTHS_RU    = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const MONTHS_GEN   = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
const WEEKDAY_LONG = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота']
const WEEKDAY_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

const WELLNESS_GROUPS = [
  {
    label: 'Самочувствие',
    chips: ['😊 Отлично', '🙂 Хорошо', '😐 Нормально', '😴 Устала', '🤕 Плохо'],
  },
  {
    label: 'Пищеварение',
    chips: ['✅ Всё хорошо', '🫧 Вздутие', '💢 Тяжесть', '🔥 Изжога', '😣 Дискомфорт в животе'],
  },
  {
    label: 'Энергия и настроение',
    chips: ['⚡ Энергии много', '😌 Спокойная', '🍬 Тяга к сладкому была', '😤 Раздражительность', '😶 Голод между едой'],
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${WEEKDAY_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00') // noon prevents timezone-boundary shift
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getFirstWeekday(year: number, month: number): number {
  const day = new Date(year, month - 1, 1).getDay()
  return day === 0 ? 6 : day - 1 // Mon=0 … Sun=6
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function DiaryClient({
  userId, today, kbju,
  initialEntries, initialWater, initialMarkedDays,
  initialYear, initialMonth,
  initialNote, initialNoteDays,
}: Props) {
  // Date state
  const [selectedDate, setSelectedDate] = useState(today)
  const [entries, setEntries]           = useState<DiaryEntry[]>(initialEntries as DiaryEntry[])
  const [water, setWater]               = useState(initialWater)
  const [dateLoading, setDateLoading]   = useState(false)

  // Calendar state
  const [calYear, setCalYear]   = useState(initialYear)
  const [calMonth, setCalMonth] = useState(initialMonth)
  const [markedDays, setMarkedDays] = useState(new Set(initialMarkedDays))
  const [noteDays, setNoteDays]     = useState(new Set(initialNoteDays))

  // Wellness note state
  const [noteTags, setNoteTags]   = useState<string[]>(initialNote.tags)
  const [noteText, setNoteText]   = useState(initialNote.note)
  const [noteSaved, setNoteSaved] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selectedDateRef = useRef(today)

  // Accordion state
  const [expandedSection, setExpandedSection] = useState<ModalSection | null>(null)
  const [modalTab, setModalTab]               = useState<ModalTab>('favorites')
  const [favItems, setFavItems]             = useState<SavedRecipe[]>([])
  const [modalLoading, setModalLoading]     = useState(false)
  const [manualForm, setManualForm]         = useState<ManualForm>({ title: '', calories: '', protein: '', fat: '', carbs: '' })
  const [manualSaving, setManualSaving]     = useState(false)

  // ── Date navigation ──────────────────────────────────────────────────────────
  async function loadDateData(date: string) {
    // cancel any pending note save for previous date
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setDateLoading(true)
    const [entriesRes, waterRes, noteRes] = await Promise.all([
      apiFetch(`/api/diary/entries?date=${date}`),
      apiFetch(`/api/diary/water?date=${date}`),
      apiFetch(`/api/diary/notes?date=${date}`),
    ])
    const [{ entries: ent }, { glasses_count }, { tags, note }] = await Promise.all([
      entriesRes.json().catch(() => ({ entries: [] })),
      waterRes.json().catch(() => ({ glasses_count: 0 })),
      noteRes.json().catch(() => ({ tags: [], note: '' })),
    ])
    setEntries((ent ?? []) as DiaryEntry[])
    setWater(glasses_count ?? 0)
    setNoteTags(tags ?? [])
    setNoteText(note ?? '')
    setDateLoading(false)
  }

  async function loadCalendarData(year: number, month: number) {
    const res = await apiFetch(`/api/diary/calendar?year=${year}&month=${month}`)
    const { days, noteDays: nd } = await res.json().catch(() => ({ days: [], noteDays: [] }))
    setMarkedDays(new Set(days as number[]))
    setNoteDays(new Set((nd ?? []) as number[]))
  }

  // Keep ref in sync with selectedDate so debounced save always writes to the correct date
  useEffect(() => { selectedDateRef.current = selectedDate }, [selectedDate])

  function changeDate(delta: number) {
    const newDate = offsetDate(selectedDate, delta)
    setSelectedDate(newDate)
    loadDateData(newDate)
    const [newYear, newMonth] = newDate.split('-').map(Number)
    if (newYear !== calYear || newMonth !== calMonth) {
      setCalYear(newYear)
      setCalMonth(newMonth)
      loadCalendarData(newYear, newMonth)
    }
  }

  function selectCalDate(day: number) {
    const newDate = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(newDate)
    loadDateData(newDate)
  }

  function changeCalMonth(delta: number) {
    let m = calMonth + delta, y = calYear
    if (m > 12) { m = 1; y++ }
    if (m < 1)  { m = 12; y-- }
    setCalMonth(m)
    setCalYear(y)
    loadCalendarData(y, m)
  }

  // ── Water ────────────────────────────────────────────────────────────────────
  async function toggleWater(idx: number) {
    const newVal = idx < water ? idx : idx + 1
    setWater(newVal) // optimistic
    await apiFetch('/api/diary/water', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ date: selectedDate, glasses_count: newVal }),
    })
  }

  // ── Entries CRUD ─────────────────────────────────────────────────────────────
  async function deleteEntry(id: string) {
    const remaining = entries.filter(e => e.id !== id)
    setEntries(remaining) // optimistic
    if (remaining.length === 0) {
      const day = parseInt(selectedDate.split('-')[2])
      setMarkedDays(prev => { const n = new Set(prev); n.delete(day); return n })
    }
    await apiFetch(`/api/diary/entries/${id}`, { method: 'DELETE' })
  }

  async function addEntry(
    data: { title: string; calories: number; protein: number; fat: number; carbs: number; source: string },
    mealType: MealType
  ) {
    closeSection()
    const res = await apiFetch('/api/diary/entries', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        date:      selectedDate,
        meal_type: mealType,
        title:     data.title,
        calories:  data.calories,
        protein:   data.protein,
        fat:       data.fat,
        carbs:     data.carbs,
        source:    data.source,
      }),
    })

    if (res.ok) {
      const { entry } = await res.json().catch(() => ({ entry: null }))
      if (entry) {
        setEntries(prev => [...prev, entry as DiaryEntry])
        const day = parseInt(selectedDate.split('-')[2])
        setMarkedDays(prev => new Set(prev).add(day))
      }
    }
  }

  // ── Accordion ────────────────────────────────────────────────────────────────
  async function toggleSection(section: ModalSection) {
    if (expandedSection === section) {
      setExpandedSection(null)
      return
    }
    setExpandedSection(section)
    setModalTab('favorites')
    setManualForm({ title: '', calories: '', protein: '', fat: '', carbs: '' })
    setModalLoading(true)

    const supabase = createClient()
    const { data: favs } = await supabase
      .from('saved_recipes')
      .select('id, title, kbju_calories, kbju_protein, kbju_fat, kbju_carbs')
      .eq('member_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)

    setFavItems((favs ?? []) as SavedRecipe[])
    setModalLoading(false)
  }

  function closeSection() { setExpandedSection(null) }

  // ── Wellness note ─────────────────────────────────────────────────────────────
  function triggerNoteSave(tags: string[], text: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const date = selectedDateRef.current
      await apiFetch('/api/diary/notes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ date, tags, note: text }),
      })
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 2000)
      const day = parseInt(date.split('-')[2])
      if (tags.length > 0 || text.trim()) {
        setNoteDays(prev => new Set(prev).add(day))
      } else {
        setNoteDays(prev => { const n = new Set(prev); n.delete(day); return n })
      }
    }, 1000)
  }

  function toggleNoteTag(chip: string) {
    const next = noteTags.includes(chip)
      ? noteTags.filter(t => t !== chip)
      : [...noteTags, chip]
    setNoteTags(next)
    triggerNoteSave(next, noteText)
  }

  function handleNoteText(text: string) {
    setNoteText(text)
    triggerNoteSave(noteTags, text)
  }

  async function addManual() {
    if (!manualForm.title.trim() || !expandedSection) return
    const section = MEAL_SECTIONS.find(s => s.key === expandedSection)!
    setManualSaving(true)
    await addEntry({
      title:    manualForm.title.trim(),
      calories: Math.round(parseFloat(manualForm.calories) || 0),
      protein:  parseFloat(manualForm.protein) || 0,
      fat:      parseFloat(manualForm.fat)     || 0,
      carbs:    parseFloat(manualForm.carbs)   || 0,
      source:   'manual',
    }, section.addType)
    setManualSaving(false)
  }

  // ── Computed ─────────────────────────────────────────────────────────────────
  const totals = {
    calories: entries.reduce((s, e) => s + (e.calories || 0), 0),
    protein:  entries.reduce((s, e) => s + (e.protein  || 0), 0),
    fat:      entries.reduce((s, e) => s + (e.fat      || 0), 0),
    carbs:    entries.reduce((s, e) => s + (e.carbs    || 0), 0),
  }

  const isToday   = selectedDate === today
  const hasKbju   = !!(kbju.calories && kbju.protein && kbju.fat && kbju.carbs)
  const daysInMo  = getDaysInMonth(calYear, calMonth)
  const firstWday = getFirstWeekday(calYear, calMonth)
  const [selY, selM, selD]     = selectedDate.split('-').map(Number)
  const [todayY, todayM, todayD] = today.split('-').map(Number)

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-8 flex flex-col gap-5">

      {/* Desktop heading */}
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
          Дневник питания 📓
        </h1>
      </div>

      {/* ── Блок 1: Навигация по датам ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => changeDate(-1)}
          className="shrink-0 w-11 h-11 flex items-center justify-center rounded-full text-xl font-bold"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', minHeight: 44 }}
        >
          ‹
        </button>
        <div className="flex-1 text-center">
          <p className="text-base font-bold" style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)' }}>
            {formatDate(selectedDate)}
          </p>
          {isToday && (
            <span className="inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: '#4CAF7820', color: '#2D7A4A', fontFamily: 'var(--font-nunito)' }}>
              Сегодня
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => changeDate(1)}
          className="shrink-0 w-11 h-11 flex items-center justify-center rounded-full text-xl font-bold"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', minHeight: 44 }}
        >
          ›
        </button>
      </div>

      {dateLoading && (
        <p className="text-center text-sm py-2" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          ⏳ Загружаем...
        </p>
      )}

      {/* ── Блок 2: Трекер КБЖУ ── */}
      {hasKbju && (
        <div className="rounded-2xl px-4 py-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            Съедено сегодня
          </p>
          <div className="flex flex-col gap-4">
            {[
              { label: 'Калории', eaten: totals.calories,                goal: kbju.calories!, unit: 'ккал' },
              { label: 'Белки',   eaten: Math.round(totals.protein),     goal: kbju.protein!,  unit: 'г'    },
              { label: 'Жиры',    eaten: Math.round(totals.fat),         goal: kbju.fat!,      unit: 'г'    },
              { label: 'Углеводы',eaten: Math.round(totals.carbs),       goal: kbju.carbs!,    unit: 'г'    },
            ].map(({ label, eaten, goal, unit }) => {
              const pct  = Math.min(100, Math.round((eaten / goal) * 100))
              const over = eaten > goal
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold"
                      style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                      {label}
                    </span>
                    <span className="text-sm" style={{ fontFamily: 'var(--font-nunito)', color: 'var(--muted)' }}>
                      <strong style={{ color: over ? '#FF9F43' : 'var(--text)' }}>{eaten}</strong>
                      {' / '}{goal} {unit}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: over ? '#FF9F43' : '#4CAF78' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Блок 3: Вода ── */}
      <div className="rounded-2xl px-4 py-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            Вода
          </p>
          <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            8 стаканов = 2 литра
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }).map((_, i) => {
            const filled = i < water
            return (
              <button
                key={i}
                onClick={() => toggleWater(i)}
                className="w-9 h-11 rounded-xl flex items-center justify-center text-lg transition-all"
                style={{
                  minHeight: 44,
                  background: filled ? '#4CAF78' : 'var(--bg)',
                  border: `1.5px solid ${filled ? '#4CAF78' : 'var(--border)'}`,
                }}
              >
                {filled ? '💧' : '○'}
              </button>
            )
          })}
        </div>
        <p className="text-xs mt-2.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          {water} из 10 стаканов
        </p>
      </div>

      {/* ── Блок 4: Приёмы пищи ── */}
      {MEAL_SECTIONS.map(section => {
        const sectionEntries = entries.filter(e => section.types.includes(e.meal_type))
        const sectionCal = sectionEntries.reduce((s, e) => s + (e.calories || 0), 0)
        const isOpen = expandedSection === section.key
        return (
          <div key={section.key} className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

            {/* Section header */}
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{section.icon}</span>
                <span className="text-sm font-bold"
                  style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)' }}>
                  {section.label}
                </span>
              </div>
              {sectionCal > 0 && (
                <span className="text-xs font-semibold"
                  style={{ color: '#4CAF78', fontFamily: 'var(--font-nunito)' }}>
                  {sectionCal} ккал
                </span>
              )}
            </div>

            {/* Entries */}
            {sectionEntries.length > 0 ? (
              <div className="flex flex-col" style={{ borderBottom: '1px solid var(--border)' }}>
                {sectionEntries.map((entry, i) => (
                  <div
                    key={entry.id}
                    className="px-4 py-3 flex items-start gap-3"
                    style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug"
                        style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                        {entry.title}
                      </p>
                      <p className="text-xs mt-0.5"
                        style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                        {entry.calories} ккал · Б:{Math.round(entry.protein)} · Ж:{Math.round(entry.fat)} · У:{Math.round(entry.carbs)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteEntry(entry.id)}
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-sm transition-opacity hover:opacity-100 opacity-50"
                      style={{ background: 'var(--bg)', color: 'var(--muted)' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                  Пока ничего не добавлено
                </p>
              </div>
            )}

            {/* Accordion toggle + inline content */}
            <div className="px-4 py-3">
              <button
                type="button"
                onClick={() => toggleSection(section.key)}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  minHeight:  48,
                  background: isOpen ? '#4CAF7825' : '#4CAF7815',
                  color:      '#2D7A4A',
                  border:     '1.5px solid #4CAF7840',
                  fontFamily: 'var(--font-nunito)',
                }}
              >
                {isOpen ? '▲ Закрыть' : '+ Добавить блюдо'}
              </button>

              {isOpen && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  {/* Tabs */}
                  <div className="flex gap-1 mb-1" style={{ borderBottom: '1px solid var(--border)' }}>
                    {([
                      { key: 'favorites' as ModalTab, label: 'Избранное' },
                      { key: 'manual'    as ModalTab, label: 'Вручную'   },
                    ]).map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setModalTab(key)}
                        className="px-3 py-2 text-sm font-semibold border-b-2 transition-colors"
                        style={{
                          borderColor: modalTab === key ? '#4CAF78' : 'transparent',
                          color:       modalTab === key ? '#4CAF78' : 'var(--muted)',
                          fontFamily:  'var(--font-nunito)',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  {modalLoading ? (
                    <div className="py-6 text-center text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                      ⏳ Загружаем...
                    </div>
                  ) : modalTab === 'favorites' ? (
                    <FavoritesTab
                      items={favItems}
                      onAdd={item => addEntry(
                        { title: item.title, calories: item.kbju_calories, protein: item.kbju_protein, fat: item.kbju_fat, carbs: item.kbju_carbs, source: 'favorite' },
                        section.addType
                      )}
                    />
                  ) : (
                    <ManualTab
                      form={manualForm}
                      onChange={setManualForm}
                      onSave={addManual}
                      saving={manualSaving}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* ── Блок 5: Календарь ── */}
      <div className="rounded-2xl px-4 py-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeCalMonth(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-base"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            ‹
          </button>
          <span className="text-sm font-bold"
            style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)' }}>
            {MONTHS_RU[calMonth - 1]} {calYear}
          </span>
          <button
            onClick={() => changeCalMonth(1)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-base"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            ›
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAY_SHORT.map(d => (
            <div key={d} className="text-center text-xs font-semibold py-1"
              style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstWday }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMo }).map((_, i) => {
            const day        = i + 1
            const isMarked   = markedDays.has(day)
            const hasNote    = noteDays.has(day)
            const isToday_   = calYear === todayY && calMonth === todayM && day === todayD
            const isSelected = calYear === selY   && calMonth === selM   && day === selD
            return (
              <button
                key={day}
                onClick={() => selectCalDate(day)}
                className="flex flex-col items-center py-0.5 gap-0"
              >
                <span
                  className="w-8 h-8 flex items-center justify-center rounded-full text-sm transition-all"
                  style={{
                    fontFamily:  'var(--font-nunito)',
                    fontWeight:  isSelected || isToday_ ? '700' : '400',
                    background:  isSelected ? '#4CAF78' : isMarked ? '#4CAF7820' : 'transparent',
                    color:       isSelected ? '#fff' : isToday_ ? '#4CAF78' : 'var(--text)',
                    outline:     isToday_ && !isSelected ? '2px solid #4CAF78' : 'none',
                    outlineOffset: '-2px',
                  }}
                >
                  {day}
                </span>
                {hasNote && (
                  <span className="text-[8px] leading-none" style={{ marginTop: '-2px' }}>💚</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Блок 6: Как я себя чувствовала ── */}
      <div className="rounded-2xl px-4 py-4 flex flex-col gap-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)' }}>
              💚 Как я себя чувствовала
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              Заметка сохранится к этому дню
            </p>
          </div>
          {noteSaved && (
            <span className="text-xs font-semibold" style={{ color: '#4CAF78', fontFamily: 'var(--font-nunito)' }}>
              Сохранено ✓
            </span>
          )}
        </div>

        {/* Chip groups */}
        {WELLNESS_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-2"
              style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              {group.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.chips.map(chip => {
                const active = noteTags.includes(chip)
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => toggleNoteTag(chip)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                    style={{
                      fontFamily:  'var(--font-nunito)',
                      borderColor: active ? '#4CAF78' : 'var(--border)',
                      background:  active ? '#4CAF7820' : 'transparent',
                      color:       active ? '#2D7A4A'  : 'var(--muted)',
                    }}
                  >
                    {chip}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Free note */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide mb-2"
            style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            Свободная заметка
          </p>
          <textarea
            rows={3}
            value={noteText}
            onChange={e => handleNoteText(e.target.value)}
            placeholder="Что ещё хочешь запомнить об этом дне?"
            className="w-full rounded-xl border px-3 py-2.5 text-sm resize-none"
            style={{
              fontFamily:  'var(--font-nunito)',
              borderColor: 'var(--border)',
              color:       'var(--text)',
              background:  'var(--bg)',
            }}
          />
        </div>
      </div>

    </div>
  )
}

// ── FavoritesTab ───────────────────────────────────────────────────────────────
function FavoritesTab({
  items, onAdd,
}: {
  items: SavedRecipe[]
  onAdd: (item: SavedRecipe) => void
}) {
  if (items.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <p className="text-3xl mb-2">⭐</p>
        <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Нет сохранённых рецептов
        </p>
        <a href="/dashboard/kitchen"
          className="inline-block mt-2 text-sm font-semibold"
          style={{ color: '#4CAF78', fontFamily: 'var(--font-nunito)' }}>
          Сохранить рецепт из кухни →
        </a>
      </div>
    )
  }
  const visible = items.slice(0, 5)
  return (
    <div className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
      {visible.map(item => (
        <div key={item.id} className="px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate"
              style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
              {item.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              {item.kbju_calories} ккал · Б:{item.kbju_protein} · Ж:{item.kbju_fat} · У:{item.kbju_carbs}
            </p>
          </div>
          <button
            onClick={() => onAdd(item)}
            className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: '#4CAF78', color: '#fff', minHeight: 36, fontFamily: 'var(--font-nunito)' }}
          >
            Добавить
          </button>
        </div>
      ))}
      {items.length > 5 && (
        <div className="px-4 py-3 text-center">
          <Link
            href="/dashboard/favorites"
            className="text-sm font-semibold"
            style={{ color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
          >
            Открыть все избранные рецепты →
          </Link>
        </div>
      )}
    </div>
  )
}

// ── ManualTab ──────────────────────────────────────────────────────────────────
function ManualTab({
  form, onChange, onSave, saving,
}: {
  form: ManualForm
  onChange: (f: ManualForm) => void
  onSave: () => void
  saving: boolean
}) {
  const inputStyle: React.CSSProperties = {
    fontFamily:  'var(--font-nunito)',
    borderColor: 'var(--border)',
    background:  'var(--bg)',
    color:       'var(--text)',
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <div>
        <label className="text-xs font-semibold mb-1 block"
          style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Название блюда *
        </label>
        <input
          type="text"
          placeholder="Например: куриный суп с овощами"
          value={form.title}
          onChange={e => onChange({ ...form, title: e.target.value })}
          className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
          style={inputStyle}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {([
          { key: 'calories', label: 'Калории (ккал)', placeholder: '320'  },
          { key: 'protein',  label: 'Белки (г)',       placeholder: '24'   },
          { key: 'fat',      label: 'Жиры (г)',        placeholder: '18'   },
          { key: 'carbs',    label: 'Углеводы (г)',    placeholder: '8'    },
        ] as const).map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-xs font-semibold mb-1 block"
              style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              {label}
            </label>
            <input
              type="number"
              placeholder={placeholder}
              value={form[key]}
              onChange={e => onChange({ ...form, [key]: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      <button
        onClick={onSave}
        disabled={saving || !form.title.trim()}
        className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
        style={{
          minHeight:  48,
          background: '#4CAF78',
          color:      '#fff',
          fontFamily: 'var(--font-nunito)',
        }}
      >
        {saving ? 'Сохраняем...' : 'Сохранить'}
      </button>
    </div>
  )
}
