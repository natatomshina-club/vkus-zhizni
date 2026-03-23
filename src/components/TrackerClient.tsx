'use client'

import { useState, useMemo } from 'react'
import { useMember } from '@/contexts/MemberContext'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  type TooltipItem,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

// ── Types ───────────────────────────────────────────────────────────────────────
interface Measurement {
  id: string
  member_id: string
  date: string
  weight: number
  waist: number | null
  hips: number | null
  chest: number | null
  energy: number
  sweet_craving: boolean
  note: string | null
  created_at: string
}

interface Props {
  userId: string
  startWeight: number | null
  goalWeight: number | null
  initialMeasurements: Measurement[]
}

type ChartMetric = 'weight' | 'waist' | 'hips' | 'chest' | 'energy'
type ChartPeriod = '1m' | '3m' | 'all'
type MobileTab = 'summary' | 'form' | 'history'

// ── Helpers ──────────────────────────────────────────────────────────────────────
function getWeekRange(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { monday, sunday }
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

function formatDateRu(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`
}

function energyLabel(e: number): string {
  if (e <= 3) return '😩 Низкая'
  if (e <= 6) return '😐 Средняя'
  return '😊 Высокая'
}

// ── Input style ──────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-nunito)',
  borderColor: 'var(--border)',
  background: 'var(--bg)',
  color: 'var(--text)',
}

// ── MeasurementForm (top-level — prevents focus loss on re-render) ───────────────
interface MeasurementFormProps {
  formDate: string
  setFormDate: React.Dispatch<React.SetStateAction<string>>
  formWeight: string
  setFormWeight: React.Dispatch<React.SetStateAction<string>>
  formWaist: string
  setFormWaist: React.Dispatch<React.SetStateAction<string>>
  formHips: string
  setFormHips: React.Dispatch<React.SetStateAction<string>>
  formChest: string
  setFormChest: React.Dispatch<React.SetStateAction<string>>
  formEnergyGroup: 1 | 2 | 3 | null
  setFormEnergyGroup: React.Dispatch<React.SetStateAction<1 | 2 | 3 | null>>
  formSweetCraving: boolean
  setFormSweetCraving: React.Dispatch<React.SetStateAction<boolean>>
  formSaving: boolean
  formError: string
  formSuccess: boolean
  syncMsg: string
  onSubmit: (e: React.FormEvent) => void
}

function MeasurementForm({
  formDate, setFormDate,
  formWeight, setFormWeight,
  formWaist, setFormWaist,
  formHips, setFormHips,
  formChest, setFormChest,
  formEnergyGroup, setFormEnergyGroup,
  formSweetCraving, setFormSweetCraving,
  formSaving, formError, formSuccess, syncMsg,
  onSubmit,
}: MeasurementFormProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {formSuccess && (
        <div className="rounded-xl px-4 py-3 text-sm font-semibold"
          style={{ background: '#E8F8EF', color: '#2D6A4F', fontFamily: 'var(--font-nunito)', border: '1px solid #A8E6CF' }}>
          ✅ Замер сохранён!
        </div>
      )}
      {syncMsg && (
        <div className="rounded-xl px-4 py-3 text-sm"
          style={{ background: '#FFF8E7', color: '#7A5C00', fontFamily: 'var(--font-nunito)', border: '1px solid #FFD93D' }}>
          ⚠️ {syncMsg}
        </div>
      )}
      {formError && (
        <div className="rounded-xl px-4 py-3 text-sm font-semibold"
          style={{ background: '#FFF0F0', color: '#C0392B', fontFamily: 'var(--font-nunito)', border: '1px solid #FFB3B3' }}>
          {formError}
        </div>
      )}

      {/* Date */}
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Дата замера
        </label>
        <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={inputStyle} />
      </div>

      {/* Weight */}
      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Вес (кг) *
        </label>
        <input type="number" step="0.1" min="30" max="200" placeholder="65.5"
          value={formWeight} onChange={e => setFormWeight(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={inputStyle} />
      </div>

      {/* Waist / Hips / Chest */}
      <div className="grid grid-cols-3 gap-2">
        {([
          { id: 'waist', label: 'Талия', val: formWaist, set: setFormWaist },
          { id: 'hips',  label: 'Бёдра',  val: formHips,  set: setFormHips  },
          { id: 'chest', label: 'Грудь',  val: formChest, set: setFormChest },
        ] as const).map(({ id, label, val, set }) => (
          <div key={id}>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              {label}, см
            </label>
            <input type="number" step="0.5" min="30" max="200" placeholder="80"
              value={val} onChange={e => set(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={inputStyle} />
          </div>
        ))}
      </div>

      {/* Energy */}
      <div>
        <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Уровень энергии *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { group: 1 as const, icon: '😩', label: '1–3',  sublabel: 'Низкая'  },
            { group: 2 as const, icon: '😐', label: '4–6',  sublabel: 'Средняя' },
            { group: 3 as const, icon: '😊', label: '7–10', sublabel: 'Высокая' },
          ]).map(opt => {
            const active = formEnergyGroup === opt.group
            return (
              <button key={opt.group} type="button" onClick={() => setFormEnergyGroup(opt.group)}
                className="flex flex-col items-center gap-1 rounded-xl py-3 border transition-all"
                style={{ minHeight: 72, borderColor: active ? 'var(--pur)' : 'var(--border)', background: active ? 'var(--pur-lt)' : 'var(--bg)' }}>
                <span className="text-xl">{opt.icon}</span>
                <span className="text-[10px] font-bold"
                  style={{ color: active ? 'var(--pur)' : 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                  {opt.sublabel}
                </span>
                <span className="text-[9px]" style={{ color: 'var(--pale)', fontFamily: 'var(--font-nunito)' }}>
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sweet craving toggle */}
      <button type="button" onClick={() => setFormSweetCraving(v => !v)}
        className="flex items-center gap-3 rounded-xl px-4 py-3 border transition-all text-left"
        style={{ minHeight: 52, borderColor: formSweetCraving ? '#FF9F43' : 'var(--border)', background: formSweetCraving ? '#FFF3E5' : 'var(--bg)' }}>
        <span className="text-xl">🍬</span>
        <p className="flex-1 text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
          Была тяга к сладкому
        </p>
        <div className="w-11 h-6 rounded-full flex items-center transition-all flex-shrink-0"
          style={{ background: formSweetCraving ? '#FF9F43' : 'var(--border)', padding: '2px' }}>
          <div className="w-5 h-5 rounded-full transition-all"
            style={{ background: '#fff', marginLeft: formSweetCraving ? 'auto' : 0 }} />
        </div>
      </button>

      {/* Save */}
      <button type="submit" disabled={formSaving}
        className="w-full rounded-xl text-sm font-bold transition-all disabled:opacity-50"
        style={{ minHeight: 52, background: 'var(--pur)', color: '#fff', fontFamily: 'var(--font-nunito)' }}>
        {formSaving ? 'Сохраняем...' : 'Сохранить замер'}
      </button>
    </form>
  )
}

// ── HistoryList (top-level) ───────────────────────────────────────────────────────
function HistoryList({ measurements }: { measurements: Measurement[] }) {
  if (measurements.length === 0) return null
  const chrono = [...measurements].reverse()

  return (
    <div className="flex flex-col gap-3">
      {measurements.map((m, idx) => {
        const isFirst = idx === measurements.length - 1
        const chronoIdx = chrono.findIndex(c => c.id === m.id)
        const prevM = chronoIdx > 0 ? chrono[chronoIdx - 1] : null
        const wDelta = prevM ? m.weight - prevM.weight : null

        return (
          <div key={m.id} className="rounded-2xl px-4 py-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)' }}>
                  {formatDateRu(m.date)}
                </p>
                {isFirst && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--pur-lt)', color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
                    Старт
                  </span>
                )}
              </div>
              {wDelta !== null && (
                <span className="text-xs font-bold"
                  style={{ fontFamily: 'var(--font-nunito)', color: wDelta < 0 ? '#2D6A4F' : wDelta > 0 ? '#C0392B' : 'var(--muted)' }}>
                  {wDelta > 0 ? '+' : ''}{wDelta.toFixed(1)} кг
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-base font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
                {m.weight} кг
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {m.waist  && <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Талия: {m.waist} см</span>}
              {m.hips   && <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Бёдра: {m.hips} см</span>}
              {m.chest  && <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Грудь: {m.chest} см</span>}
              <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>{energyLabel(m.energy)}</span>
              {m.sweet_craving && <span className="text-xs" style={{ color: '#FF9F43', fontFamily: 'var(--font-nunito)' }}>🍬 Тяга к сладкому</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────────
export default function TrackerClient({
  startWeight,
  goalWeight,
  initialMeasurements,
}: Props) {
  const { refreshMember } = useMember()
  const [measurements, setMeasurements] = useState<Measurement[]>(initialMeasurements)
  const [mobileTab, setMobileTab] = useState<MobileTab>('summary')

  // Form state
  const [formDate, setFormDate] = useState(todayStr())
  const [formWeight, setFormWeight] = useState('')
  const [formWaist, setFormWaist] = useState('')
  const [formHips, setFormHips] = useState('')
  const [formChest, setFormChest] = useState('')
  const [formEnergyGroup, setFormEnergyGroup] = useState<1 | 2 | 3 | null>(null) // 1=low,2=mid,3=high
  const [formSweetCraving, setFormSweetCraving] = useState(false)
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  // Chart state
  const [chartMetric, setChartMetric] = useState<ChartMetric>('weight')
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('all')

  // Current week check
  const today = new Date()
  const { monday, sunday } = getWeekRange(today)
  const thisWeekMeasurement = measurements.find(m => {
    const d = new Date(m.date + 'T12:00:00')
    return d >= monday && d <= sunday
  })

  const isSunday = today.getDay() === 0

  // Derived values
  const currentWeight = measurements.length > 0 ? measurements[0].weight : null
  const lost = startWeight && currentWeight ? startWeight - currentWeight : 0

  const achievements = [
    { icon: '🌱', label: 'Первый замер', achieved: measurements.length >= 1 },
    { icon: '⭐', label: '−5 кг', achieved: lost >= 5 },
    { icon: '🏆', label: '−10 кг', achieved: lost >= 10 },
    { icon: '💚', label: '−15 кг', achieved: lost >= 15 },
    {
      icon: '🍬',
      label: 'Месяц без тяги',
      achieved: measurements.length >= 4 && measurements.slice(0, 4).every(m => !m.sweet_craving),
    },
    {
      icon: '👑',
      label: 'Квартал без тяги',
      achieved: measurements.length >= 13 && measurements.slice(0, 13).every(m => !m.sweet_craving),
    },
  ]

  // Chart data (chronological = reversed since API returns DESC)
  const filteredForChart = useMemo(() => {
    const chrono = [...measurements].reverse()
    if (chartPeriod === 'all') return chrono
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - (chartPeriod === '1m' ? 1 : 3))
    return chrono.filter(m => new Date(m.date + 'T12:00:00') >= cutoff)
  }, [measurements, chartPeriod])

  const chartLabels = filteredForChart.map(m => {
    const d = new Date(m.date + 'T12:00:00')
    return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  const chartValues = filteredForChart.map(m => {
    const v = m[chartMetric]
    return v !== null ? (v as number) : null
  })

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues,
        borderColor: '#7C5CFC',
        backgroundColor: 'rgba(124,92,252,0.10)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#7C5CFC',
        pointRadius: 4,
        pointHoverRadius: 6,
        spanGaps: true,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => {
            const unit = chartMetric === 'energy' ? '' : chartMetric === 'weight' ? ' кг' : ' см'
            const y = ctx.parsed.y
            return y !== null ? `${y}${unit}` : ''
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#7B6FAA', font: { size: 11 } },
        grid: { color: '#EDE8FF' },
      },
      y: {
        ticks: { color: '#7B6FAA', font: { size: 11 } },
        grid: { color: '#EDE8FF' },
      },
    },
  }

  // ── Form submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    const weight = parseFloat(formWeight)
    if (!formWeight || isNaN(weight)) {
      setFormError('Введи вес')
      return
    }
    if (formEnergyGroup === null) {
      setFormError('Выбери уровень энергии')
      return
    }

    // Map energy group to numeric value
    const energyValue = formEnergyGroup === 1 ? 2 : formEnergyGroup === 2 ? 5 : 8

    setFormSaving(true)
    try {
      const res = await fetch('/api/tracker/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formDate,
          weight,
          waist: formWaist ? parseFloat(formWaist) : null,
          hips: formHips ? parseFloat(formHips) : null,
          chest: formChest ? parseFloat(formChest) : null,
          energy: energyValue,
          sweet_craving: formSweetCraving,
        }),
      })

      if (res.status === 409) {
        setFormError('Замер за эту неделю уже внесён')
        setFormSaving(false)
        return
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        setFormError(err.error ?? 'Ошибка сохранения')
        setFormSaving(false)
        return
      }

      const { data: newM, syncOk } = await res.json() as { data: Measurement; syncOk: boolean }
      setMeasurements(prev => [newM, ...prev])
      refreshMember()
      setFormSuccess(true)
      if (!syncOk) {
        setSyncMsg('Замер сохранён. Обнови страницу чтобы увидеть новый вес везде')
        setTimeout(() => setSyncMsg(''), 6000)
      }
      // Reset form
      setFormWeight('')
      setFormWaist('')
      setFormHips('')
      setFormChest('')
      setFormEnergyGroup(null)
      setFormSweetCraving(false)
      setTimeout(() => setFormSuccess(false), 3000)
      // Switch to summary tab on mobile
      setMobileTab('summary')
    } catch {
      setFormError('Ошибка сети')
    }
    setFormSaving(false)
  }

  // ── Metrics grid values ───────────────────────────────────────────────────────
  // Latest vs previous
  const latest = measurements[0] ?? null
  const prev = measurements[1] ?? null

  function metricDelta(key: 'waist' | 'hips' | 'chest' | 'energy') {
    if (!latest || !prev) return null
    const a = latest[key]
    const b = prev[key]
    if (a === null || b === null) return null
    return (a as number) - (b as number)
  }

  // ── Goal progress ─────────────────────────────────────────────────────────────
  const progressPct = useMemo(() => {
    if (!startWeight || !goalWeight || !currentWeight) return 0
    const total = Math.abs(startWeight - goalWeight)
    if (total === 0) return 100
    const done = Math.abs(startWeight - currentWeight)
    return Math.min(100, Math.round((done / total) * 100))
  }, [startWeight, goalWeight, currentWeight])

  // ── Render helpers ─────────────────────────────────────────────────────────────
  const SundayBanner = () => {
    if (!isSunday || thisWeekMeasurement) return null
    return (
      <div
        className="rounded-2xl px-4 py-4 flex items-center gap-3"
        style={{ background: '#FFF9DB', border: '1.5px solid #FFE066' }}
      >
        <span className="text-2xl">📅</span>
        <div>
          <p className="text-sm font-bold" style={{ color: '#5C4200', fontFamily: 'var(--font-nunito)' }}>
            Воскресенье — день замеров!
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#7A5800', fontFamily: 'var(--font-nunito)' }}>
            Не забудь внести свои показатели за эту неделю
          </p>
        </div>
      </div>
    )
  }

  const WeightHero = () => {
    if (!currentWeight) return null
    const weightDelta = startWeight ? currentWeight - startWeight : null
    return (
      <div
        className="rounded-2xl px-5 py-5"
        style={{ background: 'var(--pur)' }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-1"
          style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-nunito)' }}>
          Текущий вес
        </p>
        <div className="flex items-end gap-3">
          <span className="text-4xl font-bold leading-none"
            style={{ fontFamily: 'var(--font-unbounded)', color: '#fff' }}>
            {currentWeight}
          </span>
          <span className="text-lg mb-1" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-nunito)' }}>
            кг
          </span>
          {weightDelta !== null && (
            <span
              className="ml-auto text-sm font-bold px-3 py-1 rounded-full"
              style={{
                background: weightDelta < 0 ? 'rgba(168,230,207,0.25)' : 'rgba(255,107,107,0.25)',
                color: weightDelta < 0 ? '#A8E6CF' : '#FFB3B3',
                fontFamily: 'var(--font-nunito)',
              }}
            >
              {weightDelta < 0 ? '↓' : '↑'} {Math.abs(weightDelta).toFixed(1)} кг
            </span>
          )}
        </div>
        {goalWeight && (
          <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-nunito)' }}>
            Цель: {goalWeight} кг
          </p>
        )}
      </div>
    )
  }

  const GoalProgress = () => {
    if (!startWeight || !goalWeight || !currentWeight) return null
    return (
      <div
        className="rounded-2xl px-4 py-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)' }}>
            Путь к цели
          </p>
          <span className="text-xs font-semibold" style={{ color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
            {progressPct}%
          </span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--pur-lt)' }}>
          <div
            className="h-3 rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%`, background: 'var(--pur)' }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            Старт: {startWeight} кг
          </span>
          <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            Цель: {goalWeight} кг
          </span>
        </div>
      </div>
    )
  }

  const MetricsGrid = () => {
    if (!latest) return null
    const items = [
      {
        label: 'Талия',
        value: latest.waist,
        unit: 'см',
        delta: metricDelta('waist'),
        icon: '📏',
      },
      {
        label: 'Бёдра',
        value: latest.hips,
        unit: 'см',
        delta: metricDelta('hips'),
        icon: '📐',
      },
      {
        label: 'Грудь',
        value: latest.chest,
        unit: 'см',
        delta: metricDelta('chest'),
        icon: '💙',
      },
      {
        label: 'Энергия',
        value: latest.energy,
        unit: '/10',
        delta: metricDelta('energy'),
        icon: '⚡',
      },
    ]
    return (
      <div className="grid grid-cols-2 gap-3">
        {items.map(item => (
          <div
            key={item.label}
            className="rounded-2xl px-4 py-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-base">{item.icon}</span>
              <p className="text-xs font-semibold" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                {item.label}
              </p>
            </div>
            {item.value !== null ? (
              <>
                <p className="text-xl font-bold leading-none"
                  style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
                  {item.value}
                  <span className="text-sm font-normal ml-1"
                    style={{ fontFamily: 'var(--font-nunito)', color: 'var(--muted)' }}>
                    {item.unit}
                  </span>
                </p>
                {item.delta !== null && (
                  <p className="text-xs mt-1 font-semibold"
                    style={{
                      fontFamily: 'var(--font-nunito)',
                      color: item.delta < 0 ? '#2D6A4F' : item.delta > 0 ? '#C0392B' : 'var(--muted)',
                    }}>
                    {item.delta > 0 ? '+' : ''}{item.delta.toFixed(1)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>—</p>
            )}
          </div>
        ))}
      </div>
    )
  }

  const DynamicsChart = () => {
    const metricOptions: { key: ChartMetric; label: string }[] = [
      { key: 'weight', label: 'Вес' },
      { key: 'waist', label: 'Талия' },
      { key: 'hips', label: 'Бёдра' },
      { key: 'chest', label: 'Грудь' },
      { key: 'energy', label: 'Энергия' },
    ]
    const periodOptions: { key: ChartPeriod; label: string }[] = [
      { key: '1m', label: '1М' },
      { key: '3m', label: '3М' },
      { key: 'all', label: 'Всё' },
    ]

    return (
      <div
        className="rounded-2xl px-4 py-4"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm font-bold mb-3"
          style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)' }}>
          Динамика
        </p>

        {/* Metric toggle */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {metricOptions.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setChartMetric(opt.key)}
              className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
              style={{
                fontFamily: 'var(--font-nunito)',
                borderColor: chartMetric === opt.key ? 'var(--pur)' : 'var(--border)',
                background: chartMetric === opt.key ? 'var(--pur-lt)' : 'transparent',
                color: chartMetric === opt.key ? 'var(--pur)' : 'var(--muted)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Period toggle */}
        <div className="flex gap-1 mb-4">
          {periodOptions.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setChartPeriod(opt.key)}
              className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
              style={{
                fontFamily: 'var(--font-nunito)',
                borderColor: chartPeriod === opt.key ? 'var(--pur)' : 'var(--border)',
                background: chartPeriod === opt.key ? 'var(--pur-lt)' : 'transparent',
                color: chartPeriod === opt.key ? 'var(--pur)' : 'var(--muted)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {filteredForChart.length < 2 ? (
          <div className="h-40 flex items-center justify-center">
            <p className="text-sm text-center"
              style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              Нужно минимум 2 замера для графика
            </p>
          </div>
        ) : (
          <div style={{ height: 200 }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    )
  }

  const AchievementsBlock = () => (
    <div
      className="rounded-2xl px-4 py-4"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <p className="text-sm font-bold mb-3"
        style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)' }}>
        Достижения
      </p>
      <div className="grid grid-cols-3 gap-2">
        {achievements.map(a => (
          <div
            key={a.label}
            className="flex flex-col items-center gap-1 rounded-xl py-3 px-2 text-center"
            style={{
              background: a.achieved ? 'var(--pur-lt)' : 'var(--bg)',
              border: `1px solid ${a.achieved ? 'var(--pur-br)' : 'var(--border)'}`,
              opacity: a.achieved ? 1 : 0.5,
            }}
          >
            <span className="text-xl">{a.icon}</span>
            <p className="text-[10px] leading-tight font-semibold"
              style={{
                fontFamily: 'var(--font-nunito)',
                color: a.achieved ? 'var(--pur)' : 'var(--muted)',
              }}>
              {a.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )

  // ── Empty state ───────────────────────────────────────────────────────────────
  if (measurements.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-5">
        {/* Desktop heading */}
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
            Трекер замеров ⚖️
          </h1>
        </div>
        <SundayBanner />
        <div
          className="rounded-2xl px-6 py-12 flex flex-col items-center text-center gap-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <span className="text-5xl">⚖️</span>
          <p className="text-base font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
            Пока нет замеров
          </p>
          <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            Внеси первые замеры, чтобы начать отслеживать прогресс
          </p>
          <button
            type="button"
            onClick={() => setMobileTab('form')}
            className="rounded-xl px-6 font-bold text-sm"
            style={{
              minHeight: 52,
              background: 'var(--pur)',
              color: '#fff',
              fontFamily: 'var(--font-nunito)',
            }}
          >
            Внести первые замеры
          </button>
        </div>
        {/* Show form below on empty state */}
        <div
          className="rounded-2xl px-4 py-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm font-bold mb-4"
            style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)' }}>
            Внести замер
          </p>
          <MeasurementForm
                formDate={formDate} setFormDate={setFormDate}
                formWeight={formWeight} setFormWeight={setFormWeight}
                formWaist={formWaist} setFormWaist={setFormWaist}
                formHips={formHips} setFormHips={setFormHips}
                formChest={formChest} setFormChest={setFormChest}
                formEnergyGroup={formEnergyGroup} setFormEnergyGroup={setFormEnergyGroup}
                formSweetCraving={formSweetCraving} setFormSweetCraving={setFormSweetCraving}
                formSaving={formSaving} formError={formError}
                formSuccess={formSuccess} syncMsg={syncMsg}
                onSubmit={handleSubmit}
              />
        </div>
      </div>
    )
  }

  // ── Mobile tabs ───────────────────────────────────────────────────────────────
  const mobileTabs: { key: MobileTab; label: string }[] = [
    { key: 'summary', label: 'Сводка' },
    { key: 'form', label: 'Внести' },
    { key: 'history', label: 'История' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 lg:px-8 lg:py-8">

      {/* Desktop heading */}
      <div className="hidden lg:block mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
          Трекер замеров ⚖️
        </h1>
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <div className="lg:hidden flex flex-col gap-4">

        {/* Mobile tab switcher */}
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
        >
          {mobileTabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMobileTab(tab.key)}
              className="flex-1 py-2.5 text-sm font-bold transition-all"
              style={{
                minHeight: 48,
                background: mobileTab === tab.key ? 'var(--pur)' : 'transparent',
                color: mobileTab === tab.key ? '#fff' : 'var(--muted)',
                fontFamily: 'var(--font-nunito)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Сводка */}
        {mobileTab === 'summary' && (
          <div className="flex flex-col gap-4">
            <SundayBanner />
            <WeightHero />
            <GoalProgress />
            <MetricsGrid />
            <DynamicsChart />
            <AchievementsBlock />
          </div>
        )}

        {/* Tab: Внести */}
        {mobileTab === 'form' && (
          <div
            className="rounded-2xl px-4 py-5"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm font-bold mb-4"
              style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)' }}>
              Новый замер
            </p>
            {thisWeekMeasurement && (
              <div
                className="rounded-xl px-4 py-3 mb-4 text-sm"
                style={{ background: 'var(--pur-lt)', color: 'var(--pur)', fontFamily: 'var(--font-nunito)', border: '1px solid var(--pur-br)' }}
              >
                Замер за эту неделю уже внесён ({formatDateRu(thisWeekMeasurement.date)})
              </div>
            )}
            <MeasurementForm
                formDate={formDate} setFormDate={setFormDate}
                formWeight={formWeight} setFormWeight={setFormWeight}
                formWaist={formWaist} setFormWaist={setFormWaist}
                formHips={formHips} setFormHips={setFormHips}
                formChest={formChest} setFormChest={setFormChest}
                formEnergyGroup={formEnergyGroup} setFormEnergyGroup={setFormEnergyGroup}
                formSweetCraving={formSweetCraving} setFormSweetCraving={setFormSweetCraving}
                formSaving={formSaving} formError={formError}
                formSuccess={formSuccess} syncMsg={syncMsg}
                onSubmit={handleSubmit}
              />
          </div>
        )}

        {/* Tab: История */}
        {mobileTab === 'history' && (
          <div className="flex flex-col gap-3">
            <HistoryList measurements={measurements} />
          </div>
        )}
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden lg:flex gap-6 items-start">

        {/* Left column: summary + history */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          <SundayBanner />
          <WeightHero />
          <GoalProgress />
          <MetricsGrid />
          <DynamicsChart />
          <AchievementsBlock />

          {/* History */}
          <div>
            <p className="text-sm font-bold mb-3"
              style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)' }}>
              История замеров
            </p>
            <HistoryList measurements={measurements} />
          </div>
        </div>

        {/* Right sticky column: form */}
        <div className="w-[320px] flex-shrink-0 sticky top-6">
          <div
            className="rounded-2xl px-5 py-5"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm font-bold mb-4"
              style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)' }}>
              Внести замер
            </p>
            {thisWeekMeasurement && (
              <div
                className="rounded-xl px-4 py-3 mb-4 text-sm"
                style={{ background: 'var(--pur-lt)', color: 'var(--pur)', fontFamily: 'var(--font-nunito)', border: '1px solid var(--pur-br)' }}
              >
                Замер за эту неделю уже внесён ({formatDateRu(thisWeekMeasurement.date)})
              </div>
            )}
            <MeasurementForm
                formDate={formDate} setFormDate={setFormDate}
                formWeight={formWeight} setFormWeight={setFormWeight}
                formWaist={formWaist} setFormWaist={setFormWaist}
                formHips={formHips} setFormHips={setFormHips}
                formChest={formChest} setFormChest={setFormChest}
                formEnergyGroup={formEnergyGroup} setFormEnergyGroup={setFormEnergyGroup}
                formSweetCraving={formSweetCraving} setFormSweetCraving={setFormSweetCraving}
                formSaving={formSaving} formError={formError}
                formSuccess={formSuccess} syncMsg={syncMsg}
                onSubmit={handleSubmit}
              />
          </div>
        </div>
      </div>
    </div>
  )
}
