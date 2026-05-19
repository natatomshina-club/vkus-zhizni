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
  shopping_list_pdf_url: string | null
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
  is_active: boolean
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

function TrialLockBlock() {
  return (
    <div style={{
      background: 'var(--pur-lt)', border: '2px solid var(--pur-br)',
      borderRadius: 16, padding: '22px 16px', marginBottom: 14, textAlign: 'center',
    }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>🔒</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 8, fontFamily: 'var(--font-nunito)' }}>
        Контент марафона доступен только участницам клуба
      </div>
      <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 18, fontFamily: 'var(--font-nunito)' }}>
        Откройте полный доступ, чтобы получить рационы, планы питания и участвовать в марафоне вместе со всеми.
      </div>
      <Link
        href="/dashboard/upgrade"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          background: 'linear-gradient(135deg, #2A9D5C 0%, #52C98D 100%)',
          color: '#fff', borderRadius: 12, padding: '12px 24px',
          fontSize: 14, fontWeight: 800, textDecoration: 'none',
          fontFamily: 'var(--font-nunito)',
        }}
      >
        🌿 Открыть полный доступ
      </Link>
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
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Список продуктов
        </span>
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
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('')
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
      const { marathon: m, past: p, subscription_status: ss } = await r.json() as { marathon: Marathon | null; past: PastMarathon[]; subscription_status: string | null }
      setSubscriptionStatus(ss ?? '')
      // Нормализуем announce_features: могут прийти как строки (старый text[])
      // или как объекты (после миграции в jsonb). Поддерживаем оба формата.
      if (m && m.announce_features) {
        m.announce_features = (m.announce_features as unknown as (AnnounceFeature | string)[])
          .map(f => {
            if (typeof f === 'string') {
              try { return JSON.parse(f) as AnnounceFeature } catch { return null }
            }
            return f
          })
          .filter((f): f is AnnounceFeature => !!f && typeof f === 'object')
      }
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
    console.log('COMPLETE START:', { dayNumber, completionsBefore: [...completions] })
    setCompleting(true)
    const res = await fetch(`/api/marathons/${marathon.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_number: dayNumber }),
    })
    const data = await res.json().catch(() => ({}))
    setCompleting(false)
    console.log('COMPLETE RESPONSE:', { ok: res.ok, status: res.status, data })
    if (res.ok) {
      setCompletions(prev => {
        const next = new Set([...prev, dayNumber])
        console.log('COMPLETE SET:', { dayNumber, completionsAfter: [...next], size: next.size })
        return next
      })
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
            isTrial={subscriptionStatus === 'trial'}
          />
        ) : marathon?.status === 'planned' ? (
          <PlannedMarathon
            marathon={marathon}
            reminderSet={reminderSet}
            onSetReminder={handleSetReminder}
            isTrial={subscriptionStatus === 'trial'}
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
  savingWeight, completing, completedToday, onComplete, onSaveWeight, isTrial,
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
  isTrial: boolean
}) {
  const activeDayNumbers = days.filter(d => d.is_active).map(d => d.day_number)
  const currentDay = activeDayNumbers.length > 0
    ? Math.max(...activeDayNumbers)
    : (marathon.starts_at ? getCurrentDay(marathon.starts_at, marathon.duration_days) : 1)
  const progress = Math.round((completions.size / marathon.duration_days) * 100)
  const [selectedDay, setSelectedDay] = useState(currentDay)
  useEffect(() => { setSelectedDay(currentDay) }, [currentDay])
  const isViewingCurrentDay = selectedDay === currentDay
  const selectedDayData = days.find(d => d.day_number === selectedDay)
  const todayData = selectedDayData
  const isLastDay = currentDay === marathon.duration_days
  const isDayCompleted = completions.has(selectedDay)
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
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {marathon.description}
          </div>
        )}
        {/* Day circles */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
          {Array.from({ length: marathon.duration_days }, (_, i) => {
            const dn = i + 1
            const isDone = completions.has(dn)
            const isToday = dn === currentDay
            const isSelected = dn === selectedDay
            const isActive = days.find(d => d.day_number === dn)?.is_active ?? false
            const isLocked = !isActive && !isToday
            const isClickable = isActive || isToday
            return (
              <div
                key={dn}
                onClick={isClickable ? () => setSelectedDay(dn) : undefined}
                style={{
                  width: 26, height: 26, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isSelected ? 11 : 10, fontWeight: 800, flexShrink: 0,
                  background: isSelected && isToday ? '#fff' : isSelected ? 'rgba(255,255,255,0.9)' : isDone ? 'rgba(255,255,255,0.35)' : isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)',
                  color: isSelected && isToday ? '#FF6B35' : isSelected ? '#FF6B35' : isLocked ? 'rgba(255,255,255,0.3)' : '#fff',
                  cursor: isClickable ? 'pointer' : 'default',
                  outline: isSelected && !isToday ? '2px solid rgba(255,255,255,0.6)' : 'none',
                }}
              >
                {dn}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
            {isViewingCurrentDay ? `День ${currentDay} из ${marathon.duration_days}` : `День ${selectedDay} из ${marathon.duration_days} · сейчас день ${currentDay}`}
          </div>
          <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 16, fontWeight: 800, color: '#fff' }}>
            {progress}%
          </div>
        </div>
      </div>

      {/* Chat button */}
      {!isTrial && marathon.chat_channel_slug && (
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

      {/* Trial lock block */}
      {isTrial && <TrialLockBlock />}

      {/* Weight card */}
      {!isTrial && <div style={{
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
      </div>}

      {/* Today's task */}
      {!isTrial && (todayData ? (
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
                День {selectedDay}
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                {todayData.task_title ?? 'Задание дня'}
              </div>
            </div>
          </div>
          <div style={{ padding: '12px 14px' }}>
            {todayData.task_text && (
              <div
                style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, fontWeight: 600, marginBottom: 12 }}
                dangerouslySetInnerHTML={{ __html: todayData.task_text.replace(/\n/g, '<br/>') }}
              />
            )}
            {isDayCompleted || (isViewingCurrentDay && completedToday) ? (
              <div style={{
                width: '100%', background: '#A8E6CF', color: '#2D6A4F', borderRadius: 11,
                padding: 12, fontSize: 14, fontWeight: 800, textAlign: 'center',
              }}>
                ✅ День {selectedDay} засчитан!
              </div>
            ) : (
              <button
                onClick={() => onComplete(selectedDay)}
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
          Задание на день {selectedDay} ещё не добавлено
        </div>
      ))}

      {/* Coach comment */}
      {!isTrial && todayData?.coach_comment && (
        <div style={{
          background: 'var(--pur-lt)', border: '2px solid var(--pur-br)', borderRadius: 16,
          padding: '13px 14px', marginBottom: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pur)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            💜 Слово Наташи
          </div>
          <div
            style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: todayData.coach_comment.replace(/\n/g, '<br/>') }}
          />
        </div>
      )}

      {/* Day ration */}
      {!isTrial && todayData?.ration_text && (
        <div style={{
          background: '#fff', border: '2px solid var(--border)', borderRadius: 16,
          padding: '13px 14px', marginBottom: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
            🥗 Рацион дня {selectedDay}
          </div>
          <div
            style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: todayData.ration_text.replace(/\n/g, '<br>') }}
          />
        </div>
      )}

      {/* Full ration PDF */}
      {marathon.ration_pdf_url && (
        isTrial ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            background: '#FFF5E8', border: '2px solid #FFD4A0', borderRadius: 14,
            padding: '9px 12px', marginBottom: 12, opacity: 0.6, cursor: 'default',
          }}>
            <div style={{
              width: 32, height: 32, background: '#FF9F43', borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
            }}>📄</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#8B4A00' }}>Полный рацион марафона</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FF9F43' }}>🔒 После оплаты</div>
          </div>
        ) : (
          <Link
            href={`/dashboard/body/pdf?url=${encodeURIComponent(marathon.ration_pdf_url)}`}
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
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FF9F43' }}>PDF →</div>
          </Link>
        )
      )}

      {/* Shopping list PDF */}
      {marathon.shopping_list_pdf_url && (
        isTrial ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#F0EEFF', border: '2px solid #DDD5FF', borderRadius: 14,
            padding: '9px 12px', marginBottom: 12, opacity: 0.6, cursor: 'default',
          }}>
            <div style={{
              width: 32, height: 32, background: 'var(--pur)', borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#3D2B8A' }}>Список продуктов</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pur)' }}>🔒 После оплаты</div>
          </div>
        ) : (
          <Link
            href={`/dashboard/body/pdf?url=${encodeURIComponent(marathon.shopping_list_pdf_url)}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#F0EEFF', border: '2px solid #DDD5FF', borderRadius: 14,
              padding: '9px 12px', marginBottom: 12, textDecoration: 'none',
            }}
          >
            <div style={{
              width: 32, height: 32, background: 'var(--pur)', borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#3D2B8A' }}>Список продуктов</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pur)' }}>PDF →</div>
          </Link>
        )
      )}
    </>
  )
}

function PlannedMarathon({
  marathon, reminderSet, onSetReminder, isTrial,
}: {
  marathon: Marathon
  reminderSet: boolean
  onSetReminder: () => void
  isTrial: boolean
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
      {!isTrial && marathon.announce_prepare_text && (
        <div style={{
          background: 'var(--pur-lt)', border: '2px solid var(--pur-br)',
          borderRadius: 16, padding: '13px 14px', marginBottom: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pur)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            💜 Как подготовиться
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {marathon.announce_prepare_text}
          </div>
        </div>
      )}

      {/* Trial lock block */}
      {isTrial && <TrialLockBlock />}

      {/* Ration PDF */}
      {marathon.ration_pdf_url && (
        isTrial ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            background: '#FFF5E8', border: '2px solid #FFD4A0', borderRadius: 14,
            padding: '9px 12px', marginBottom: 12, opacity: 0.6, cursor: 'default',
          }}>
            <div style={{
              width: 32, height: 32, background: '#FF9F43', borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
            }}>📄</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#8B4A00' }}>Полный рацион марафона</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FF9F43' }}>🔒 После оплаты</div>
          </div>
        ) : (
          <Link
            href={`/dashboard/body/pdf?url=${encodeURIComponent(marathon.ration_pdf_url)}`}
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
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FF9F43' }}>PDF →</div>
          </Link>
        )
      )}

      {/* Shopping list PDF */}
      {marathon.shopping_list_pdf_url && (
        isTrial ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#F0EEFF', border: '2px solid #DDD5FF', borderRadius: 14,
            padding: '9px 12px', marginBottom: 12, opacity: 0.6, cursor: 'default',
          }}>
            <div style={{
              width: 32, height: 32, background: 'var(--pur)', borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#3D2B8A' }}>Список продуктов</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pur)' }}>🔒 После оплаты</div>
          </div>
        ) : (
          <Link
            href={`/dashboard/body/pdf?url=${encodeURIComponent(marathon.shopping_list_pdf_url)}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#F0EEFF', border: '2px solid #DDD5FF', borderRadius: 14,
              padding: '9px 12px', marginBottom: 12, textDecoration: 'none',
            }}
          >
            <div style={{
              width: 32, height: 32, background: 'var(--pur)', borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#3D2B8A' }}>Список продуктов</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pur)' }}>PDF →</div>
          </Link>
        )
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
