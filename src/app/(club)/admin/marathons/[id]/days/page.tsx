'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'

type DayForm = {
  day_number: number
  task_title: string
  task_text: string
  coach_comment: string
  ration_text: string
  open: boolean
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1.5px solid var(--border)', borderRadius: 10,
  padding: '9px 12px', fontSize: 13, color: 'var(--text)', background: '#FAF8FF', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 3,
}

export default function AdminMarathonDaysPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [marathonTitle, setMarathonTitle] = useState('')
  const [durationDays, setDurationDays] = useState(10)
  const [days, setDays] = useState<DayForm[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveOk, setSaveOk] = useState(false)
  const [saveErr, setSaveErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    // Get marathon info
    const mRes = await fetch(`/api/admin/marathons?status=all`)
    let duration = 10
    let title = ''
    if (mRes.ok) {
      const { marathons } = await mRes.json() as { marathons: { id: string; title: string; duration_days: number }[] }
      const m = marathons.find(x => x.id === id)
      if (m) { duration = m.duration_days ?? 10; title = m.title ?? '' }
    }
    setDurationDays(duration)
    setMarathonTitle(title)

    // Get existing days
    const dRes = await fetch(`/api/admin/marathons/${id}/days`)
    let existingDays: Record<number, { task_title?: string; task_text?: string; coach_comment?: string; ration_text?: string }> = {}
    if (dRes.ok) {
      const { days: d } = await dRes.json() as { days: { day_number: number; task_title?: string; task_text?: string; coach_comment?: string; ration_text?: string }[] }
      for (const day of (d ?? [])) {
        existingDays[day.day_number] = day
      }
    }

    // Build form for all days
    const forms: DayForm[] = Array.from({ length: duration }, (_, i) => {
      const dn = i + 1
      const ex = existingDays[dn]
      return {
        day_number: dn,
        task_title: ex?.task_title ?? '',
        task_text: ex?.task_text ?? '',
        coach_comment: ex?.coach_comment ?? '',
        ration_text: ex?.ration_text ?? '',
        open: false,
      }
    })
    setDays(forms)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  function toggleDay(i: number) {
    setDays(prev => prev.map((d, idx) => idx === i ? { ...d, open: !d.open } : d))
  }

  function updateDay(i: number, key: keyof Omit<DayForm, 'day_number' | 'open'>, val: string) {
    setDays(prev => prev.map((d, idx) => idx === i ? { ...d, [key]: val } : d))
  }

  function openAll() {
    setDays(prev => prev.map(d => ({ ...d, open: true })))
  }
  function closeAll() {
    setDays(prev => prev.map(d => ({ ...d, open: false })))
  }

  async function handleSave() {
    setSaving(true)
    setSaveErr('')
    setSaveOk(false)
    const records = days.map(d => ({
      day_number: d.day_number,
      task_title: d.task_title || null,
      task_text: d.task_text || null,
      coach_comment: d.coach_comment || null,
      ration_text: d.ration_text || null,
    }))
    const res = await fetch(`/api/admin/marathons/${id}/days`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: records }),
    })
    const d = await res.json().catch(() => ({})) as { error?: string }
    setSaving(false)
    if (!res.ok) { setSaveErr(d.error ?? 'Ошибка'); return }
    setSaveOk(true)
    setTimeout(() => setSaveOk(false), 3000)
  }

  const filledDays = days.filter(d => d.task_title || d.task_text).length

  if (loading) return <div style={{ padding: 32, color: 'var(--muted)', textAlign: 'center' }}>Загружаем…</div>

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <Link href={`/admin/marathons/${id}`} style={{
          fontSize: 13, color: 'var(--muted)', textDecoration: 'none',
          padding: '8px 12px', borderRadius: 10, background: 'var(--pur-lt)',
        }}>
          ← К марафону
        </Link>
        <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 16, fontWeight: 700, color: '#3D2B8A', margin: 0, flex: 1 }}>
          Дни: {marathonTitle}
        </h1>
      </div>

      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
        Заполнено {filledDays} из {durationDays} дней
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={openAll} style={{
          background: 'var(--pur-lt)', color: 'var(--pur)', border: 'none', borderRadius: 8,
          padding: '7px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>
          Развернуть все
        </button>
        <button onClick={closeAll} style={{
          background: 'var(--pur-lt)', color: 'var(--pur)', border: 'none', borderRadius: 8,
          padding: '7px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>
          Свернуть все
        </button>
      </div>

      {/* Days accordion */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {days.map((day, i) => {
          const isFilled = !!(day.task_title || day.task_text)
          return (
            <div key={day.day_number} style={{
              background: '#fff', border: `1.5px solid ${isFilled ? 'var(--pur-br)' : 'var(--border)'}`,
              borderRadius: 14, overflow: 'hidden',
            }}>
              {/* Header */}
              <button
                onClick={() => toggleDay(i)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: isFilled ? 'var(--pur)' : 'var(--pur-lt)',
                    color: isFilled ? '#fff' : 'var(--pur)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800,
                  }}>
                    {day.day_number}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                      {day.task_title || <span style={{ color: 'var(--pale)', fontStyle: 'italic' }}>Задание не заполнено</span>}
                    </div>
                    {day.task_text && (
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                        {day.task_text.slice(0, 60)}{day.task_text.length > 60 ? '…' : ''}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {isFilled && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: '#2D6A4F', background: '#A8E6CF',
                      borderRadius: 6, padding: '2px 7px',
                    }}>
                      Заполнен
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: 'var(--muted)', transition: 'transform 0.2s', display: 'block', transform: day.open ? 'rotate(180deg)' : 'none' }}>
                    ▼
                  </span>
                </div>
              </button>

              {/* Body */}
              {day.open && (
                <div style={{ padding: '4px 16px 16px', borderTop: '1.5px solid var(--border)' }}>
                  <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                    <div>
                      <label style={labelStyle}>Заголовок задания</label>
                      <input value={day.task_title}
                        onChange={e => updateDay(i, 'task_title', e.target.value)}
                        placeholder="Выпей 2 литра воды"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Текст задания</label>
                      <textarea value={day.task_text}
                        onChange={e => updateDay(i, 'task_text', e.target.value)}
                        rows={3} placeholder="Подробное описание задания на этот день…"
                        style={{ ...inputStyle, resize: 'vertical' }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>💜 Слово Наташи (coach_comment)</label>
                      <textarea value={day.coach_comment}
                        onChange={e => updateDay(i, 'coach_comment', e.target.value)}
                        rows={2} placeholder="Личный комментарий или мотивация от Наташи…"
                        style={{ ...inputStyle, resize: 'vertical' }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>🥗 Рацион дня (текст или HTML)</label>
                      <textarea value={day.ration_text}
                        onChange={e => updateDay(i, 'ration_text', e.target.value)}
                        rows={4} placeholder="Завтрак: омлет с овощами&#10;Обед: куриный суп&#10;Ужин: запечённая рыба"
                        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Save */}
      {saveErr && (
        <div style={{ background: '#FFF0F0', border: '1px solid #FFB3B3', borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: '#E53E3E', fontSize: 13 }}>
          {saveErr}
        </div>
      )}
      {saveOk && (
        <div style={{ background: '#E8FBF3', border: '1px solid #A8E6CF', borderRadius: 10, padding: '10px 14px', marginBottom: 12, color: '#2D6A4F', fontSize: 13, fontWeight: 700 }}>
          ✅ Все дни сохранены!
        </div>
      )}
      <button onClick={handleSave} disabled={saving} style={{
        background: 'var(--pur)', color: '#fff', border: 'none', borderRadius: 12,
        padding: '14px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', minHeight: 48,
        width: '100%', opacity: saving ? 0.7 : 1,
      }}>
        {saving ? 'Сохраняем…' : `💾 Сохранить все ${durationDays} дней`}
      </button>
    </div>
  )
}
