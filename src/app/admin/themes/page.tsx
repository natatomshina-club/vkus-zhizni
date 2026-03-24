'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type SeasonalTheme = {
  id: string
  slug: string
  title: string
  emoji: string
  particle_type: string
  accent_color: string
  accent_light: string
  start_date: string
  end_date: string
  is_forced: boolean
}

const PARTICLE_OPTIONS = [
  { value: 'snow',      label: 'Снег ❄️' },
  { value: 'hearts',   label: 'Сердечки 💜' },
  { value: 'petals',   label: 'Лепестки 🌸' },
  { value: 'stars',    label: 'Звёзды ✨' },
  { value: 'leaves',   label: 'Листья 🍂' },
  { value: 'confetti', label: 'Конфетти 🎊' },
]

const PRESET_THEMES = [
  { slug: 'new_year',      title: 'Новый год',              emoji: '🎄', particle_type: 'snow',     accent_color: '#2A9D5C', accent_light: '#D0F5E8', start_date: '12-15', end_date: '01-10', is_system: true },
  { slug: 'valentine',     title: 'День влюблённых',        emoji: '💝', particle_type: 'hearts',   accent_color: '#E91E8C', accent_light: '#FFE4F5', start_date: '02-10', end_date: '02-16', is_system: true },
  { slug: 'womens_day',    title: '8 марта',                emoji: '🌷', particle_type: 'petals',   accent_color: '#FF6B9D', accent_light: '#FFE4F0', start_date: '03-06', end_date: '03-10', is_system: true },
  { slug: 'easter',        title: 'Пасха',                  emoji: '🥚', particle_type: 'stars',    accent_color: '#A8E6CF', accent_light: '#E8FFF5', start_date: '04-18', end_date: '04-21', is_system: true },
  { slug: 'may_day',       title: '1 мая',                  emoji: '🌿', particle_type: 'leaves',   accent_color: '#4CAF78', accent_light: '#E8F5EE', start_date: '04-30', end_date: '05-01', is_system: true },
  { slug: 'victory_day',   title: '9 мая',                  emoji: '🎆', particle_type: 'stars',    accent_color: '#E74C3C', accent_light: '#FFE8E8', start_date: '05-08', end_date: '05-09', is_system: true },
  { slug: 'new_school',    title: '1 сентября',             emoji: '🍂', particle_type: 'leaves',   accent_color: '#FF9F43', accent_light: '#FFF3E0', start_date: '09-01', end_date: '09-01', is_system: true },
  { slug: 'club_birthday', title: 'День рождения клуба',   emoji: '🎂', particle_type: 'confetti', accent_color: '#7C5CFC', accent_light: '#F0EEFF', start_date: '10-15', end_date: '10-15', is_system: true },
]

function slugify(s: string) {
  const latin = s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '')
  return latin || null
}

function makeSlug(title: string, existing: string): string {
  return existing || slugify(title) || `theme-${Date.now()}`
}

/** Проверяет, попадает ли сегодня в диапазон MM-DD..MM-DD */
function isActiveByDate(start: string, end: string): boolean {
  const now = new Date()
  const today = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  if (start <= end) return today >= start && today <= end
  return today >= start || today <= end   // переход через Новый год
}

function getStatus(t: SeasonalTheme): 'forced' | 'auto' | 'inactive' {
  if (t.is_forced) return 'forced'
  if (isActiveByDate(t.start_date, t.end_date)) return 'auto'
  return 'inactive'
}

const STATUS_CONFIG = {
  forced:   { label: 'Включена вручную',      bg: '#D0F5E8', color: '#1A5C3A', dot: '#2A9D5C' },
  auto:     { label: 'Активна автоматически', bg: '#EDE8FF', color: '#4C1D95', dot: '#7C5CFC' },
  inactive: { label: 'Неактивна',             bg: '#F4F4F4', color: '#888',    dot: '#CCC' },
}

export default function ThemesPage() {
  const [themes, setThemes] = useState<SeasonalTheme[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState({
    title: '', slug: '', emoji: '✨', particle_type: 'stars',
    accent_color: '#7C5CFC', accent_light: '#F0EEFF',
    start_date: '', end_date: '', is_system: false,
  })

  async function load() {
    setLoading(true)
    setLoadError('')
    const res = await fetch('/api/admin/themes')
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setLoadError(data.error ?? `Ошибка загрузки (${res.status})`)
    } else {
      setThemes(data.themes ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleForce(t: SeasonalTheme) {
    setTogglingId(t.id)
    await fetch('/api/admin/themes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, is_forced: !t.is_forced }),
    })
    setTogglingId(null)
    load()
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    await fetch(`/api/admin/themes?id=${id}`, { method: 'DELETE' })
    setDeleting(false)
    setConfirmDeleteId(null)
    load()
  }

  function applyPreset(preset: typeof PRESET_THEMES[0]) {
    setForm(prev => ({
      ...prev,
      title: preset.title,
      slug: preset.slug,
      emoji: preset.emoji,
      particle_type: preset.particle_type,
      accent_color: preset.accent_color,
      accent_light: preset.accent_light,
      start_date: preset.start_date,
      end_date: preset.end_date,
      is_system: preset.is_system,
    }))
    setShowForm(true)
    setTimeout(() => document.getElementById('theme-form')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function handleCreate() {
    if (!form.title || !form.start_date || !form.end_date) return
    setSaving(true)
    setCreateError('')
    const res = await fetch('/api/admin/themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, slug: makeSlug(form.title, form.slug) }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      setCreateError(data.error ?? `Ошибка создания (${res.status})`)
      return
    }
    setShowForm(false)
    setCreateError('')
    setForm({ title: '', slug: '', emoji: '✨', particle_type: 'stars', accent_color: '#7C5CFC', accent_light: '#F0EEFF', start_date: '', end_date: '', is_system: false })
    load()
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border text-sm outline-none'
  const inputSt = { borderColor: '#EDE8FF', background: '#FAF8FF', color: '#2D1F6E', fontFamily: 'var(--font-nunito)' }

  const activeTheme = themes.find(t => t.is_forced) ?? themes.find(t => isActiveByDate(t.start_date, t.end_date))

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto" style={{ background: 'var(--bg)', fontFamily: 'var(--font-nunito)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="text-sm px-3 py-1.5 rounded-xl" style={{ background: 'var(--pur-light)', color: 'var(--pur)' }}>
          ← Назад
        </Link>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
          Оформление
        </h1>
      </div>

      {/* ── Текущая активная тема ── */}
      {activeTheme ? (
        <div
          className="rounded-2xl px-5 py-4 mb-6 flex items-center gap-4"
          style={{ background: `linear-gradient(135deg, ${activeTheme.accent_color} 0%, ${activeTheme.accent_color}CC 100%)` }}
        >
          <span className="text-3xl shrink-0">{activeTheme.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{activeTheme.title}</p>
            <p className="text-xs text-white/75 mt-0.5">
              {activeTheme.is_forced ? 'Включена вручную' : 'Активна по расписанию'} · {activeTheme.start_date} – {activeTheme.end_date}
            </p>
          </div>
          <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}>
            Сейчас активна
          </span>
        </div>
      ) : (
        <div className="rounded-2xl px-5 py-4 mb-6 flex items-center gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <span className="text-2xl">💤</span>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Сейчас нет активной темы — частицы не показываются</p>
        </div>
      )}

      {/* ── Список тем ── */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>
          Все темы
          {!loading && <span className="ml-2 text-xs font-normal" style={{ color: 'var(--muted)' }}>({themes.length})</span>}
        </p>

        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-xl" style={{ background: 'linear-gradient(90deg, #f0eeff 25%, #e8e0ff 50%, #f0eeff 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            ))}
            <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
          </div>
        )}

        {!loading && loadError && (
          <div className="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: '#FFE4E4', color: '#C0392B' }}>
            {loadError}
          </div>
        )}

        {!loading && !loadError && themes.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Тем ещё нет</p>
            <p className="text-xs mt-1" style={{ color: 'var(--pale)' }}>Используй пресеты ниже чтобы быстро создать тему</p>
          </div>
        )}

        {!loading && themes.length > 0 && (
          <div className="flex flex-col gap-3">
            {themes.map(t => {
              const status = getStatus(t)
              const sc = STATUS_CONFIG[status]
              const isActive = status !== 'inactive'

              return (
                <div
                  key={t.id}
                  className="rounded-2xl p-4"
                  style={{
                    background: isActive ? t.accent_light : 'var(--bg)',
                    border: `2px solid ${isActive ? t.accent_color + '80' : 'var(--border)'}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Emoji + info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl shrink-0 leading-none">{t.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-bold leading-none" style={{ color: 'var(--text)' }}>{t.title}</p>
                          {/* Status badge */}
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{ background: sc.bg, color: sc.color }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: sc.dot }} />
                            {sc.label}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          {PARTICLE_OPTIONS.find(o => o.value === t.particle_type)?.label}
                          {' · '}
                          {t.start_date} – {t.end_date}
                        </p>
                        {/* Color swatches */}
                        <div className="flex gap-1.5 mt-1.5 items-center">
                          <span className="w-3.5 h-3.5 rounded-full" style={{ background: t.accent_color }} />
                          <span className="w-3.5 h-3.5 rounded-full border" style={{ background: t.accent_light, borderColor: '#EDE8FF' }} />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {/* Toggle forced */}
                      {t.is_forced ? (
                        <button
                          onClick={() => handleForce(t)}
                          disabled={togglingId === t.id}
                          className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
                          style={{ background: '#FFE4E4', color: '#C0392B', border: '1px solid #FFD0D0', opacity: togglingId === t.id ? 0.6 : 1 }}
                        >
                          Выключить
                        </button>
                      ) : (
                        <button
                          onClick={() => handleForce(t)}
                          disabled={togglingId === t.id}
                          className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
                          style={{ background: '#D0F5E8', color: '#1A5C3A', border: '1px solid #A8E6CF', opacity: togglingId === t.id ? 0.6 : 1 }}
                        >
                          Включить сейчас
                        </button>
                      )}

                      {/* Delete */}
                      {confirmDeleteId === t.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold" style={{ color: '#C0392B' }}>Удалить?</span>
                          <button
                            onClick={() => handleDelete(t.id)}
                            disabled={deleting}
                            className="text-xs px-2.5 py-1.5 rounded-xl font-bold"
                            style={{ background: '#C0392B', color: '#fff', opacity: deleting ? 0.6 : 1 }}
                          >
                            Да
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs px-2.5 py-1.5 rounded-xl font-semibold"
                            style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}
                          >
                            Нет
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(t.id)}
                          className="text-xs px-2.5 py-1.5 rounded-xl font-semibold"
                          style={{ background: '#FFF0F0', color: '#C0392B', border: '1px solid #FFD0D0' }}
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Пресеты ── */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-bold mb-3" style={{ color: 'var(--text)' }}>Быстрые пресеты</p>
        <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Нажми на пресет — заполнит форму создания</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_THEMES.map(p => (
            <button
              key={p.title}
              onClick={() => applyPreset(p)}
              className="text-xs px-3 py-2 rounded-xl font-semibold transition-all hover:opacity-80"
              style={{ background: p.accent_light, color: p.accent_color, border: `1px solid ${p.accent_color}40` }}
            >
              {p.emoji} {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* ── Форма создания ── */}
      <div id="theme-form" className="rounded-2xl p-5 mb-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Новая тема</p>
          <button
            onClick={() => setShowForm(p => !p)}
            className="text-xs px-3 py-1.5 rounded-xl font-semibold"
            style={{ background: 'var(--pur-light)', color: 'var(--pur)' }}
          >
            {showForm ? 'Свернуть' : '+ Создать'}
          </button>
        </div>

        {showForm && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Название</p>
                <input
                  className={inputCls} style={inputSt}
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value, slug: slugify(e.target.value) ?? '' }))}
                  placeholder="Новый год"
                />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Emoji</p>
                <input className={inputCls} style={inputSt} value={form.emoji} onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))} placeholder="✨" />
              </div>
            </div>

            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>Тип частиц</p>
              <div className="flex flex-wrap gap-2">
                {PARTICLE_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setForm(p => ({ ...p, particle_type: o.value }))}
                    className="text-xs px-3 py-2 rounded-xl font-semibold"
                    style={{
                      background: form.particle_type === o.value ? 'var(--pur)' : 'var(--bg)',
                      color: form.particle_type === o.value ? '#fff' : 'var(--muted)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Цвет акцента</p>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.accent_color} onChange={e => setForm(p => ({ ...p, accent_color: e.target.value }))} className="w-10 h-9 rounded-lg border cursor-pointer" style={{ borderColor: '#EDE8FF' }} />
                  <input className={inputCls} style={inputSt} value={form.accent_color} onChange={e => setForm(p => ({ ...p, accent_color: e.target.value }))} />
                </div>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Светлый фон</p>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.accent_light} onChange={e => setForm(p => ({ ...p, accent_light: e.target.value }))} className="w-10 h-9 rounded-lg border cursor-pointer" style={{ borderColor: '#EDE8FF' }} />
                  <input className={inputCls} style={inputSt} value={form.accent_light} onChange={e => setForm(p => ({ ...p, accent_light: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Начало (MM-DD)</p>
                <input className={inputCls} style={inputSt} value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} placeholder="12-15" />
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Конец (MM-DD)</p>
                <input className={inputCls} style={inputSt} value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} placeholder="01-10" />
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: form.accent_light, border: `1px solid ${form.accent_color}40` }}>
              <span className="text-2xl">{form.emoji || '✨'}</span>
              <div>
                <p className="text-sm font-bold" style={{ color: form.accent_color }}>{form.title || 'Название темы'}</p>
                <p className="text-xs" style={{ color: form.accent_color, opacity: 0.7 }}>
                  {PARTICLE_OPTIONS.find(o => o.value === form.particle_type)?.label} · {form.start_date || '??-??'} – {form.end_date || '??-??'}
                </p>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={saving || !form.title || !form.start_date || !form.end_date}
              className="py-3 rounded-2xl text-white text-sm font-bold disabled:opacity-50"
              style={{ background: 'var(--pur)' }}
            >
              {saving ? 'Сохраняем...' : '✅ Создать тему'}
            </button>
            {createError && (
              <div className="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: '#FFE4E4', color: '#C0392B' }}>
                {createError}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
        Частицы показываются автоматически в период дат или при ручном включении.<br />
        Одновременно активна только одна тема.
      </p>
    </div>
  )
}
