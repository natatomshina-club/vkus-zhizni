'use client'

import { useState, useEffect } from 'react'

interface Attachment { name: string; url: string }

interface HelpMaterial {
  id: string
  title: string
  description: string | null
  format: string
  content_url: string | null
  thumbnail_url: string | null
  duration_label: string | null
  sort_order: number
  views_count: number
  is_published: boolean
  attachments: Attachment[] | null
}

const FORMAT_OPTIONS = [
  { value: 'video',   label: '🎥 Видео' },
  { value: 'article', label: '📄 Статья' },
  { value: 'pdf',     label: '📎 PDF' },
  { value: 'audio',   label: '🎧 Аудио' },
]

const FORMAT_BADGE: Record<string, { bg: string; color: string; icon: string }> = {
  video:   { bg: '#F0EEFF', color: '#7C5CFC', icon: '🎥' },
  article: { bg: '#E8F4FF', color: '#1A6FC4', icon: '📄' },
  pdf:     { bg: '#FFF0E8', color: '#C05C00', icon: '📎' },
  audio:   { bg: '#D8F3DC', color: '#2D6A4F', icon: '🎧' },
}

const INPUT: React.CSSProperties = {
  padding: '8px 10px', borderRadius: 8, fontSize: 13,
  border: '1px solid #DDD5FF', outline: 'none',
  fontFamily: 'var(--font-nunito)', color: 'var(--text)',
  background: '#fff', boxSizing: 'border-box', width: '100%',
}
const TEXTAREA: React.CSSProperties = { ...INPUT, resize: 'vertical', minHeight: 80 }
const BTN_PUR: React.CSSProperties = {
  padding: '8px 16px', background: 'var(--pur)', color: '#fff',
  border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'var(--font-nunito)',
}
const BTN_RED: React.CSSProperties = {
  padding: '5px 10px', background: '#FFF0F0', color: '#C0392B',
  border: '1px solid #FFD0D0', borderRadius: 8, fontSize: 11, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'var(--font-nunito)',
}
const BTN_GHOST: React.CSSProperties = {
  padding: '5px 8px', background: '#F0EEFF', color: '#3D2B8A',
  border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'var(--font-nunito)',
}

const EMPTY_FORM = {
  title: '', description: '', format: 'video', content_url: '',
  thumbnail_url: '', duration_label: '', sort_order: 0, is_published: true,
}

export default function AdminHelpPage() {
  const [materials, setMaterials] = useState<HelpMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMat, setEditingMat] = useState<HelpMaterial | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/help/materials')
    if (res.ok) {
      const { materials: data } = await res.json() as { materials: HelpMaterial[] }
      setMaterials(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditingMat(null)
    setForm({ ...EMPTY_FORM })
    setAttachments([])
    setError('')
    setShowForm(true)
  }

  function openEdit(m: HelpMaterial) {
    setEditingMat(m)
    setForm({
      title: m.title,
      description: m.description ?? '',
      format: m.format,
      content_url: m.content_url ?? '',
      thumbnail_url: m.thumbnail_url ?? '',
      duration_label: m.duration_label ?? '',
      sort_order: m.sort_order,
      is_published: m.is_published,
    })
    setAttachments(m.attachments ?? [])
    setError('')
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Укажи название'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        description: form.description || null,
        content_url: form.content_url || null,
        thumbnail_url: form.thumbnail_url || null,
        duration_label: form.duration_label || null,
        attachments,
      }
      const url = editingMat ? `/api/help/materials/${editingMat.id}` : '/api/help/materials'
      const method = editingMat ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const e = await res.json() as { error?: string }
        throw new Error(e.error ?? 'Ошибка')
      }
      await load()
      setShowForm(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить материал?')) return
    await fetch(`/api/help/materials/${id}`, { method: 'DELETE' })
    setMaterials(prev => prev.filter(m => m.id !== id))
  }

  async function togglePublished(m: HelpMaterial) {
    const res = await fetch(`/api/help/materials/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !m.is_published }),
    })
    if (res.ok) {
      const updated = await res.json() as HelpMaterial
      setMaterials(prev => prev.map(x => x.id === m.id ? { ...x, is_published: updated.is_published } : x))
    }
  }

  async function moveOrder(m: HelpMaterial, dir: -1 | 1) {
    const idx = materials.findIndex(x => x.id === m.id)
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= materials.length) return
    const swap = materials[swapIdx]
    await Promise.all([
      fetch(`/api/help/materials/${m.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: swap.sort_order }) }),
      fetch(`/api/help/materials/${swap.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: m.sort_order }) }),
    ])
    await load()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 800, color: '#3D2B8A', margin: 0 }}>
            🗺 Карта помощи
          </h1>
          <p style={{ fontSize: 12, color: '#7B6FAA', margin: '4px 0 0', fontFamily: 'var(--font-nunito)' }}>
            Материалы для участниц — управление контентом
          </p>
        </div>
        <button style={BTN_PUR} onClick={openCreate}>+ Добавить материал</button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1.5px solid #DDD5FF', borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#3D2B8A', marginBottom: 16, fontFamily: 'var(--font-nunito)' }}>
            {editingMat ? 'Редактировать материал' : 'Новый материал'}
          </p>
          {error && <p style={{ color: '#C0392B', fontSize: 12, marginBottom: 12, fontFamily: 'var(--font-nunito)' }}>{error}</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {FORMAT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, format: opt.value }))}
                  style={{
                    ...BTN_GHOST,
                    background: form.format === opt.value ? 'var(--pur)' : '#F0EEFF',
                    color: form.format === opt.value ? '#fff' : '#3D2B8A',
                    fontSize: 12,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <input style={INPUT} placeholder="Название *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <textarea style={TEXTAREA} placeholder="Описание" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <input style={INPUT} placeholder="URL контента (видео iframe/ссылка, PDF, аудио, статья)" value={form.content_url} onChange={e => setForm(f => ({ ...f, content_url: e.target.value }))} />
            <input style={INPUT} placeholder="URL обложки (thumbnail)" value={form.thumbnail_url} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...INPUT, flex: 1 }} placeholder="Длительность (напр. 15 мин)" value={form.duration_label} onChange={e => setForm(f => ({ ...f, duration_label: e.target.value }))} />
              <input style={{ ...INPUT, width: 100 }} type="number" placeholder="Порядок" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: +e.target.value }))} />
            </div>

            {/* Attachments */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#7B6FAA', marginBottom: 6, fontFamily: 'var(--font-nunito)' }}>Вложения</p>
              {attachments.map((att, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                  <input style={{ ...INPUT, flex: 1 }} placeholder="Название" value={att.name} onChange={e => setAttachments(prev => prev.map((a, j) => j === i ? { ...a, name: e.target.value } : a))} />
                  <input style={{ ...INPUT, flex: 2 }} placeholder="URL" value={att.url} onChange={e => setAttachments(prev => prev.map((a, j) => j === i ? { ...a, url: e.target.value } : a))} />
                  <button type="button" style={BTN_RED} onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
              <button type="button" style={BTN_GHOST} onClick={() => setAttachments(prev => [...prev, { name: '', url: '' }])}>+ Вложение</button>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#3D2B8A', fontFamily: 'var(--font-nunito)', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
              Опубликован
            </label>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button style={{ ...BTN_PUR, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
                {saving ? 'Сохраняю...' : 'Сохранить'}
              </button>
              <button style={BTN_GHOST} onClick={() => setShowForm(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p style={{ color: '#7B6FAA', fontFamily: 'var(--font-nunito)', fontSize: 14 }}>Загрузка...</p>
      ) : materials.length === 0 ? (
        <p style={{ color: '#7B6FAA', fontFamily: 'var(--font-nunito)', fontSize: 14 }}>Материалов пока нет. Добавь первый!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {materials.map((m, idx) => {
            const badge = FORMAT_BADGE[m.format] ?? FORMAT_BADGE.article
            return (
              <div key={m.id} style={{ background: '#fff', border: '1px solid #EDE8FF', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 14, opacity: m.is_published ? 1 : 0.65 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ background: badge.bg, color: badge.color, fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, fontFamily: 'var(--font-nunito)' }}>
                      {badge.icon} {m.format.toUpperCase()}
                    </span>
                    {!m.is_published && (
                      <span style={{ background: '#FFECEC', color: '#C0392B', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, fontFamily: 'var(--font-nunito)' }}>
                        Черновик
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: '#9B8FCC', fontFamily: 'var(--font-nunito)' }}>#{m.sort_order} · 👁 {m.views_count}</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#3D2B8A', margin: 0, fontFamily: 'var(--font-nunito)' }}>{m.title}</p>
                  {m.description && <p style={{ fontSize: 12, color: '#7B6FAA', margin: '2px 0 0', fontFamily: 'var(--font-nunito)' }}>{m.description}</p>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button style={BTN_GHOST} onClick={() => moveOrder(m, -1)} disabled={idx === 0} title="Вверх">↑</button>
                  <button style={BTN_GHOST} onClick={() => moveOrder(m, 1)} disabled={idx === materials.length - 1} title="Вниз">↓</button>
                  <button
                    style={{ ...BTN_GHOST, background: m.is_published ? '#E8F5E9' : '#F0EEFF', color: m.is_published ? '#2D6A4F' : '#3D2B8A' }}
                    onClick={() => togglePublished(m)}
                  >
                    {m.is_published ? '✓ Опубл.' : 'Опубликовать'}
                  </button>
                  <button style={BTN_GHOST} onClick={() => openEdit(m)}>✏️ Изменить</button>
                  <button style={BTN_RED} onClick={() => handleDelete(m.id)}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
