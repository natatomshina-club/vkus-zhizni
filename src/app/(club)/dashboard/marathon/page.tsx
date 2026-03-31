'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

type AnnounceFeature = { emoji: string; title: string; description: string }

type Marathon = {
  id: string
  title: string
  description: string | null
  starts_at: string | null
  ends_at: string | null
  duration_days: number
  status: 'planned' | 'active' | 'finished'
  month_label: string | null
  chat_channel_slug: string | null
  ration_pdf_url: string | null
  ration_html: string | null
  shopping_list: string | null
  announce_title: string | null
  announce_features: AnnounceFeature[] | null
  announce_prepare_text: string | null
  emoji: string | null
}

type PastMarathon = {
  id: string
  title: string
  month_label: string | null
  emoji: string | null
  starts_at: string | null
  ends_at: string | null
  status: string
}

type MarathonDay = {
  id: string
  marathon_id: string
  day_number: number
  task_title: string | null
  task_text: string | null
  coach_comment: string | null
  ration_text: string | null
}

type Measurement = {
  weight_start: number | null
  weight_end: number | null
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

function formatDateFull(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getCurrentDay(startsAt: string, durationDays: number) {
  const diff = Date.now() - new Date(startsAt).getTime()
  const day = Math.floor(diff / 86400000) + 1
  return Math.min(Math.max(day, 1), durationDays)
}

function Countdown({ startsAt }: { startsAt: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    function calc() {
      const diff = new Date(startsAt).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return }
      const days = Math.floor(diff / 86400000)
      const hours = Math.floor((diff % 86400000) / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft({ days, hours, minutes, seconds })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [startsAt])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
      {[
        { v: timeLeft.days, l: 'дней' },
        { v: timeLeft.hours, l: 'часов' },
        { v: timeLeft.minutes, l: 'минут' },
        { v: timeLeft.seconds, l: 'секунд' },
      ].map(({ v, l }) => (
        <div key={l} style={{
          background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 14px',
          textAlign: 'center', minWidth: 60,
        }}>
          <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            {String(v).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 700, marginTop: 3 }}>{l}</div>
        </div>
      ))}
    </div>
  )
}

function ShoppingList({ text }: { text: string }) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  return (
    <div style={{ background: '#fff', border: '2px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 14px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>🛒 Список продуктов</span>
        <span style={{ fontSize: 13, color: 'var(--muted)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px' }}>
          {lines.map((line, i) => {
            const key = `${i}-${line}`
            const isChecked = checked.has(key)
            return (
              <div
                key={key}
                onClick={() => setChecked(prev => {
                  const next = new Set(prev)
                  if (next.has(key)) next.delete(key); else next.add(key)
                  return next
                })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 0', cursor: 'pointer',
                  textDecoration: isChecked ? 'line-through' : 'none',
                  color: isChecked ? 'var(--muted)' : 'var(--text)',
                  fontSize: 13, fontWeight: 600,
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  border: `2px solid ${isChecked ? 'var(--pur)' : 'var(--border)'}`,
                  background: isChecked ? 'var(--pur)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: '#fff',
                }}>
                  {isChecked && '✓'}
                </div>
                {line}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function RationAccordion({ html }: { html: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: '#fff', border: '2px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 14px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>🥗 Полный рацион марафона</span>
        <span style={{ fontSize: 13, color: 'var(--muted)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>
      {open && (
        <div
          style={{ padding: '0 14px 14px', fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  )
}

export default function MarathonPage() {
  const [marathon, setMarathon] = useState<Marathon | null>(null)
  const [past, setPast] = useState<PastMarathon[]>([])
  const [days, setDays] = useState<MarathonDay[]>([])
  const [completions, setCompletions] = useState<Set<number>>(new Set())
  const [measurement, setMeasurement] = useState<Measurement | null>(null)
  const [trackerWeight, setTrackerWeight] = useState<number | null>(null)
  const [reminderSet, setReminderSet] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [completedToday, setCompletedToday] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [weightEndInput, setWeightEndInput] = useState('')
  const [savingWeight, setSavingWeight] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/marathons')
      if (!r.ok) { setLoading(false); return }
      const { marathon: m, past: p } = await r.json() as { marathon: Marathon | null; past: PastMarathon[] }
      setMarathon(m)
      setPast(p ?? [])

      if (m?.status === 'active' && m.id) {
        const [daysRes, complRes, measRes, trackerRes] = await Promise.all([
          fetch(`/api/marathons/${m.id}/days`),
          fetch(`/api/marathons/${m.id}/complete`),
          fetch(`/api/marathons/${m.id}/measurements`),
          fetch('/api/tracker/summary').catch(() => null),
        ])
        if (daysRes.ok) {
          const { days: d } = await daysRes.json() as { days: MarathonDay[] }
          setDays(d ?? [])
        }
        if (complRes.ok) {
          const { completions: c } = await complRes.json() as { completions: { day_number: number }[] }
          setCompletions(new Set((c ?? []).map((x: { day_number: number }) => x.day_number)))
        }
        if (measRes.ok) {
          const { measurement: meas } = await measRes.json() as { measurement: Measurement | null }
          setMeasurement(meas)
        }
        if (trackerRes && trackerRes.ok) {
          const td = await trackerRes.json().catch(() => ({}))
          const w = (td as { weight?: { current?: number } }).weight
          if (typeof w?.current === 'number') setTrackerWeight(w.current)
        }
      } else if (m?.status === 'planned' && m.id) {
        const remRes = await fetch(`/api/marathons/${m.id}/reminder`)
        if (remRes.ok) {
          const { registered } = await remRes.json() as { registered: boolean }
          setReminderSet(registered)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleComplete(dayNumber: number) {
    if (!marathon) return
    setCompleting(true)
    const res = await fetch(`/api/marathons/${marathon.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_number: dayNumber }),
    })
    setCompleting(false)
    if (res.ok) {
      setCompletions(prev => new Set([...prev, dayNumber]))
      setCompletedToday(true)
    }
  }

  async function handleSetReminder() {
    if (!marathon) return
    const res = await fetch(`/api/marathons/${marathon.id}/reminder`, { method: 'POST' })
    if (res.ok) setReminderSet(true)
  }

  async function handleSaveWeight(type: 'start' | 'end') {
    if (!marathon) return
    const val = parseFloat(type === 'start' ? weightInput : weightEndInput)
    if (isNaN(val) || val <= 0) return
    setSavingWeight(true)
    const body = type === 'start' ? { weight_start: val } : { weight_end: val }
    const res = await fetch(`/api/marathons/${marathon.id}/measurements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const { measurement: m } = await res.json() as { measurement: Measurement }
      setMeasurement(m)
      if (type === 'start') setWeightInput('')
      else setWeightEndInput('')
    }
    setSavingWeight(false)
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--muted)' }}>
        Загружаем марафон…
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 40px' }}>
      {/* Mobile header */}
      <div className="lg:hidden" style={{
        background: '#fff', padding: '10px 16px 9px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Link href="/dashboard" style={{
          width: 32, height: 32, background: 'var(--pur-lt)', border: 'none', borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          textDecoration: 'none',
        }}>←</Link>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
            Марафон
          </div>
          {marathon && (
            <div style={{ fontSize: 10, color: 'var(--pale)', fontWeight: 600 }}>
              {marathon.month_label ?? marathon.title}
            </div>
          )}
        </div>
        <div style={{ width: 32 }} />
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        {marathon?.status === 'active' ? (
          <ActiveMarathon
            marathon={marathon}
            days={days}
            completions={completions}
            measurement={measurement}
            trackerWeight={trackerWeight}
            weightInput={weightInput}
            weightEndInput={weightEndInput}
            setWeightInput={setWeightInput}
            setWeightEndInput={setWeightEndInput}
            savingWeight={savingWeight}
            completing={completing}
            completedToday={completedToday}
            onComplete={handleComplete}
            onSaveWeight={handleSaveWeight}
          />
        ) : marathon?.status === 'planned' ? (
          <PlannedMarathon
            marathon={marathon}
            reminderSet={reminderSet}
            onSetReminder={handleSetReminder}
          />
        ) : (
          <NoMarathon />
        )}

        {past.length > 0 && <PastMarathons marathons={past} />}
      </div>
    </div>
  )
}

function ActiveMarathon({
  marathon, days, completions, measurement, trackerWeight,
  weightInput, weightEndInput, setWeightInput, setWeightEndInput,
  savingWeight, completing, completedToday, onComplete, onSaveWeight,
}: {
  marathon: Marathon
  days: MarathonDay[]
  completions: Set<number>
  measurement: Measurement | null
  trackerWeight: number | null
  weightInput: string
  weightEndInput: string
  setWeightInput: (v: string) => void
  setWeightEndInput: (v: string) => void
  savingWeight: boolean
  completing: boolean
  completedToday: boolean
  onComplete: (day: number) => void
  onSaveWeight: (type: 'start' | 'end') => void
}) {
  const currentDay = marathon.starts_at
    ? getCurrentDay(marathon.starts_at, marathon.duration_days)
    : 1
  const progress = Math.round((completions.size / marathon.duration_days) * 100)
  const todayData = days.find(d => d.day_number === currentDay)
  const isLastDay = currentDay === marathon.duration_days
  const isDayCompleted = completions.has(currentDay)
  const weightDiff = measurement?.weight_start && measurement?.weight_end
    ? (measurement.weight_start - measurement.weight_end).toFixed(1)
    : null

  return (
    <>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #FF6B35, #FF9F43)',
        borderRadius: 20, padding: 16, marginBottom: 14, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -20, fontSize: 80, opacity: 0.12, lineHeight: 1 }}>
          {marathon.emoji ?? '🔥'}
        </div>
        <div style={{
          display: 'inline-flex', background: 'rgba(255,255,255,0.2)', borderRadius: 18,
          padding: '3px 11px', fontSize: 10, fontWeight: 800, color: '#fff',
          marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {marathon.month_label ?? 'Марафон'}
        </div>
        <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 5 }}>
          {marathon.title}
        </div>
        {marathon.description && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 12, lineHeight: 1.5 }}>
            {marathon.description}
          </div>
        )}
        {/* Day circles */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
          {Array.from({ length: marathon.duration_days }, (_, i) => {
            const dn = i + 1
            const isDone = completions.has(dn)
            const isToday = dn === currentDay
            const isFuture = dn > currentDay
            return (
              <div key={dn} style={{
                width: 26, height: 26, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isToday ? 11 : 10, fontWeight: 800, flexShrink: 0,
                background: isToday ? '#fff' : isDone ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)',
                color: isToday ? '#FF6B35' : isFuture ? 'rgba(255,255,255,0.45)' : '#fff',
              }}>
                {dn}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
            День {currentDay} из {marathon.duration_days}
          </div>
          <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 16, fontWeight: 800, color: '#fff' }}>
            {progress}%
          </div>
        </div>
      </div>

      {/* Chat button */}
      {marathon.chat_channel_slug && (
        <Link
          href={`/dashboard/channel?slug=${marathon.chat_channel_slug}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'var(--pur)', color: '#fff', borderRadius: 14, padding: '12px 16px',
            textDecoration: 'none', fontSize: 14, fontWeight: 700, marginBottom: 14,
            minHeight: 48,
          }}
        >
          💬 Чат марафона
        </Link>
      )}

      {/* Weight card */}
      <div style={{
        background: '#fff', border: '2px solid var(--border)', borderRadius: 16,
        padding: '13px 14px', marginBottom: 12,
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>⚖️ Замеры</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Start weight */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--pale)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Старт
            </div>
            {measurement?.weight_start ? (
              <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                {measurement.weight_start} <span style={{ fontSize: 13, fontWeight: 600 }}>кг</span>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 11, color: 'var(--pale)', marginBottom: 6 }}>
                  {trackerWeight ? `Последний: ${trackerWeight} кг` : 'Введи вес'}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="number"
                    step="0.1"
                    placeholder={trackerWeight ? String(trackerWeight) : '70.0'}
                    value={weightInput}
                    onChange={e => setWeightInput(e.target.value)}
                    style={{
                      flex: 1, border: '2px solid var(--border)', borderRadius: 8, padding: '5px 8px',
                      fontSize: 13, color: 'var(--text)', outline: 'none', width: '70px',
                    }}
                  />
                  <button
                    onClick={() => onSaveWeight('start')}
                    disabled={savingWeight}
                    style={{
                      background: 'var(--pur)', color: '#fff', border: 'none', borderRadius: 8,
                      padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    ✓
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ fontSize: 22, flexShrink: 0, color: 'var(--grn-dk)' }}>→</div>

          {/* End weight or diff */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--pale)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {measurement?.weight_end ? 'Финиш' : 'Результат'}
            </div>
            {measurement?.weight_end ? (
              <>
                <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                  {measurement.weight_end} <span style={{ fontSize: 13, fontWeight: 600 }}>кг</span>
                </div>
                {weightDiff && (
                  <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 16, fontWeight: 800, color: '#2D6A4F', marginTop: 4 }}>
                    -{weightDiff} кг
                  </div>
                )}
              </>
            ) : isLastDay ? (
              <div>
                <div style={{ fontSize: 11, color: 'var(--pale)', marginBottom: 6 }}>Финальный вес</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="67.0"
                    value={weightEndInput}
                    onChange={e => setWeightEndInput(e.target.value)}
                    style={{
                      flex: 1, border: '2px solid var(--border)', borderRadius: 8, padding: '5px 8px',
                      fontSize: 13, color: 'var(--text)', outline: 'none', width: '70px',
                    }}
                  />
                  <button
                    onClick={() => onSaveWeight('end')}
                    disabled={savingWeight}
                    style={{
                      background: 'var(--grn-dk)', color: '#fff', border: 'none', borderRadius: 8,
                      padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    ✓
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 14, color: 'var(--pale)' }}>—</div>
            )}
          </div>
        </div>
      </div>

      {/* Today's task */}
      {todayData ? (
        <div style={{
          background: '#fff', border: '2px solid var(--border)', borderRadius: 16,
          overflow: 'hidden', marginBottom: 12,
        }}>
          <div style={{
            background: 'linear-gradient(90deg, var(--pur), #9B6BFF)',
            padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 9,
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                День {currentDay}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                {todayData.task_title ?? 'Задание дня'}
              </div>
            </div>
          </div>
          <div style={{ padding: '12px 14px' }}>
            {todayData.task_text && (
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, fontWeight: 600, marginBottom: 12 }}>
                {todayData.task_text}
              </div>
            )}
            {isDayCompleted || completedToday ? (
              <div style={{
                width: '100%', background: '#A8E6CF', color: '#2D6A4F', borderRadius: 11,
                padding: 12, fontSize: 14, fontWeight: 800, textAlign: 'center',
              }}>
                ✅ День {currentDay} засчитан!
              </div>
            ) : (
              <button
                onClick={() => onComplete(currentDay)}
                disabled={completing}
                style={{
                  width: '100%', background: '#A8E6CF', color: '#2D6A4F', border: 'none',
                  borderRadius: 11, padding: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  fontFamily: 'var(--font-nunito)', minHeight: 48,
                  opacity: completing ? 0.6 : 1,
                }}
              >
                {completing ? '…' : '✅ Я выполнила!'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{
          background: '#fff', border: '2px solid var(--border)', borderRadius: 16,
          padding: '20px 14px', marginBottom: 12, textAlign: 'center', color: 'var(--muted)',
        }}>
          Задание на день {currentDay} ещё не добавлено
        </div>
      )}

      {/* Coach comment */}
      {todayData?.coach_comment && (
        <div style={{
          background: 'var(--pur-lt)', border: '2px solid var(--pur-br)', borderRadius: 16,
          padding: '13px 14px', marginBottom: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pur)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            💜 Слово Наташи
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
            {todayData.coach_comment}
          </div>
        </div>
      )}

      {/* Day ration */}
      {todayData?.ration_text && (
        <div style={{
          background: '#fff', border: '2px solid var(--border)', borderRadius: 16,
          padding: '13px 14px', marginBottom: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
            🥗 Рацион дня {currentDay}
          </div>
          <div
            style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: todayData.ration_text }}
          />
        </div>
      )}

      {/* Full ration PDF */}
      {marathon.ration_pdf_url && (
        <a
          href={marathon.ration_pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            background: '#FFF5E8', border: '2px solid #FFD4A0', borderRadius: 14,
            padding: '9px 12px', marginBottom: 12, textDecoration: 'none',
          }}
        >
          <div style={{
            width: 32, height: 32, background: '#FF9F43', borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
          }}>📄</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#8B4A00' }}>Полный рацион марафона</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#FF9F43' }}>PDF ↓</div>
        </a>
      )}

      {/* Full ration HTML */}
      {marathon.ration_html && <RationAccordion html={marathon.ration_html} />}

      {/* Shopping list */}
      {marathon.shopping_list && <ShoppingList text={marathon.shopping_list} />}
    </>
  )
}

function PlannedMarathon({
  marathon, reminderSet, onSetReminder,
}: {
  marathon: Marathon
  reminderSet: boolean
  onSetReminder: () => void
}) {
  return (
    <>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--pur), #9B6BFF)',
        borderRadius: 20, padding: 18, marginBottom: 14, textAlign: 'center',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
          Следующий марафон
        </div>
        <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 6 }}>
          {marathon.announce_title ?? marathon.title}
        </div>
        {marathon.starts_at && (
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 14 }}>
            Старт {formatDate(marathon.starts_at)}
          </div>
        )}
        {marathon.starts_at && <Countdown startsAt={marathon.starts_at} />}
        <button
          onClick={onSetReminder}
          disabled={reminderSet}
          style={{
            width: '100%', background: reminderSet ? 'rgba(255,255,255,0.2)' : '#FFD93D',
            color: reminderSet ? '#fff' : '#5C4200', border: 'none', borderRadius: 12,
            padding: 13, fontSize: 14, fontWeight: 800, cursor: reminderSet ? 'default' : 'pointer',
            fontFamily: 'var(--font-nunito)', minHeight: 48,
          }}
        >
          {reminderSet ? '✅ Напомним за 3 дня' : '🔔 Напомни мне о старте'}
        </button>
      </div>

      {/* Features */}
      {marathon.announce_features && marathon.announce_features.length > 0 && (
        <div style={{ background: '#fff', border: '2px solid var(--border)', borderRadius: 16, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 11 }}>
            Что тебя ждёт
          </div>
          {marathon.announce_features.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 9 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 11, background: 'var(--pur-lt)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
              }}>
                {f.emoji}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{f.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prepare text */}
      {marathon.announce_prepare_text && (
        <div style={{
          background: 'var(--pur-lt)', border: '2px solid var(--pur-br)',
          borderRadius: 16, padding: '13px 14px', marginBottom: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pur)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            💜 Как подготовиться
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
            {marathon.announce_prepare_text}
          </div>
        </div>
      )}
    </>
  )
}

function NoMarathon() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--pur), #9B6BFF)',
      borderRadius: 20, padding: 32, textAlign: 'center', marginBottom: 14,
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🏃‍♀️</div>
      <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
        Марафон скоро!
      </div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
        Следи за объявлениями в клубе
      </div>
    </div>
  )
}

function PastMarathons({ marathons }: { marathons: PastMarathon[] }) {
  return (
    <div style={{ background: '#fff', border: '2px solid var(--border)', borderRadius: 16, padding: 14, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
        🏆 Прошлые марафоны
      </div>
      {marathons.map(m => (
        <div key={m.id} style={{
          background: '#F8F5FF', borderRadius: 11, padding: '10px 12px',
          marginBottom: 7, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ fontSize: 22, flexShrink: 0 }}>{m.emoji ?? '🔥'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 1 }}>{m.title}</div>
            <div style={{ fontSize: 11, color: 'var(--pale)' }}>
              {m.month_label ?? formatDateFull(m.starts_at)}
            </div>
          </div>
          <div style={{
            fontSize: 11, fontWeight: 800, color: '#2D6A4F', background: '#A8E6CF',
            borderRadius: 8, padding: '3px 8px', flexShrink: 0,
          }}>
            Завершён
          </div>
        </div>
      ))}
    </div>
  )
}
