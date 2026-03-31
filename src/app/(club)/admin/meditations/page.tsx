'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Course = {
  id: string
  slug: string
  title: string
  description: string | null
  emoji: string | null
  gradient_from: string
  gradient_to: string
  sort_order: number
  is_visible: boolean
  meditation_count?: number
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1.5px solid var(--border)', borderRadius: 10,
  padding: '9px 12px', fontSize: 14, color: 'var(--text)', background: '#FAF8FF', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4,
}

const emptyForm = {
  title: '', description: '', slug: '', emoji: '🧘',
  gradient_from: '#7C5CFC', gradient_to: '#9B7CFF', sort_order: '0', is_visible: true,
}

export default function AdminMeditationsPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [form, setForm] = useState({ ...emptyForm })
  const [toggling, setToggling] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/meditations/courses')
    if (res.ok) {
      const { courses: c } = await res.json() as { courses: Course[] }
      setCourses(c ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function startEdit(c: Course) {
    setEditId(c.id)
    setShowCreate(false)
    setForm({
      title: c.title, description: c.description ?? '',
      slug: c.slug, emoji: c.emoji ?? '🧘',
      gradient_from: c.gradient_from, gradient_to: c.gradient_to,
      sort_order: String(c.sort_order), is_visible: c.is_visible,
    })
    setSaveErr('')
  }

  function cancelForm() {
    setEditId(null)
    setShowCreate(false)
    setForm({ ...emptyForm })
    setSaveErr('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveErr('')
    const payload = { ...form, sort_order: parseInt(form.sort_order) || 0 }
    const url = editId
      ? `/api/admin/meditations/courses/${editId}`
      : '/api/admin/meditations/courses'
    const method = editId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const d = await res.json().catch(() => ({})) as { error?: string }
    setSaving(false)
    if (!res.ok) { setSaveErr(d.error ?? 'Ошибка'); return }
    cancelForm()
    load()
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    const res = await fetch(`/api/admin/meditations/courses/${id}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    if (res.ok) load()
  }

  async function handleToggleVisible(c: Course) {
    setToggling(c.id)
    await fetch(`/api/admin/meditations/courses/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_visible: !c.is_visible }),
    })
    setToggling(null)
    load()
  }

  const GradientPreview = ({ from, to }: { from: string; to: string }) => (
    <div style={{
      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
      background: `linear-gradient(135deg, ${from}, ${to})`,
    }} />
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link href="/admin" style={{
          fontSize: 13, color: 'var(--muted)', textDecoration: 'none',
          padding: '8px 12px', borderRadius: 10, background: 'var(--pur-lt)',
        }}>← Назад</Link>
        <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, color: '#3D2B8A', margin: 0, flex: 1 }}>
          🧘 Медитации
        </h1>
        <button
          onClick={() => { setShowCreate(s => !s); setEditId(null); setForm({ ...emptyForm }); setSaveErr('') }}
          style={{
            background: 'var(--pur)', color: '#fff', border: 'none', borderRadius: 12,
            padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 48,
          }}
        >
          + Добавить курс
        </button>
      </div>

      {/* Create/Edit form */}
      {(showCreate || editId) && (
        <form onSubmit={handleSave} style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 20,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
            {editId ? 'Редактировать курс' : 'Новый курс'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Название *</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Утренние медитации" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Описание</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Короткое описание курса" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Slug (латиница)</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="morning" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Эмодзи</label>
              <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                placeholder="🧘" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Цвет от (gradient_from)</label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="color" value={form.gradient_from}
                  onChange={e => setForm(f => ({ ...f, gradient_from: e.target.value }))}
                  style={{ width: 40, height: 38, border: 'none', cursor: 'pointer', borderRadius: 8 }} />
                <input value={form.gradient_from}
                  onChange={e => setForm(f => ({ ...f, gradient_from: e.target.value }))}
                  style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Цвет до (gradient_to)</label>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="color" value={form.gradient_to}
                  onChange={e => setForm(f => ({ ...f, gradient_to: e.target.value }))}
                  style={{ width: 40, height: 38, border: 'none', cursor: 'pointer', borderRadius: 8 }} />
                <input value={form.gradient_to}
                  onChange={e => setForm(f => ({ ...f, gradient_to: e.target.value }))}
                  style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Превью</label>
              <div style={{
                height: 40, borderRadius: 10,
                background: `linear-gradient(135deg, ${form.gradient_from}, ${form.gradient_to})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>{form.emoji}</div>
            </div>
            <div>
              <label style={labelStyle}>Порядок (sort_order)</label>
              <input type="number" value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                style={inputStyle} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="is_visible" checked={form.is_visible}
                onChange={e => setForm(f => ({ ...f, is_visible: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <label htmlFor="is_visible" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>
                Видимый (показывать участницам)
              </label>
            </div>
          </div>
          {saveErr && <div style={{ color: '#E53E3E', fontSize: 13, marginBottom: 10 }}>{saveErr}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={saving} style={{
              background: 'var(--pur)', color: '#fff', border: 'none', borderRadius: 10,
              padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44,
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Сохраняем…' : editId ? 'Сохранить' : 'Создать'}
            </button>
            <button type="button" onClick={cancelForm} style={{
              background: 'var(--pur-lt)', color: 'var(--pur)', border: 'none', borderRadius: 10,
              padding: '10px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Courses list */}
      {loading ? (
        <div style={{ color: 'var(--muted)', padding: '20px 0', textAlign: 'center' }}>Загружаем…</div>
      ) : courses.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 16,
          padding: 32, textAlign: 'center', color: 'var(--muted)',
        }}>
          Курсов нет. Создай первый!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {courses.map(c => (
            <div key={c.id} style={{
              background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden',
            }}>
              {/* Gradient strip */}
              <div style={{ height: 6, background: `linear-gradient(90deg, ${c.gradient_from}, ${c.gradient_to})` }} />
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <GradientPreview from={c.gradient_from} to={c.gradient_to} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                    {c.emoji} {c.title}
                  </div>
                  {c.description && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{c.description}</div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--pale)', marginTop: 3 }}>
                    {c.meditation_count ?? 0} медитаций · slug: {c.slug}
                  </div>
                </div>
                {/* Visibility toggle */}
                <button
                  onClick={() => handleToggleVisible(c)}
                  disabled={toggling === c.id}
                  style={{
                    background: c.is_visible ? '#E8FBF3' : 'var(--pur-lt)',
                    color: c.is_visible ? '#2D6A4F' : 'var(--muted)',
                    border: 'none', borderRadius: 8, padding: '6px 12px',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {c.is_visible ? '👁 Видимый' : '🙈 Скрытый'}
                </button>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <Link href={`/admin/meditations/${c.id}`} style={{
                    background: '#FFF3E0', color: '#8B4A00', borderRadius: 9,
                    padding: '7px 13px', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  }}>
                    Медитации →
                  </Link>
                  <button onClick={() => startEdit(c)} style={{
                    background: 'var(--pur-lt)', color: 'var(--pur)', border: 'none', borderRadius: 9,
                    padding: '7px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>
                    Редактировать
                  </button>
                  {deleteId === c.id ? (
                    <>
                      <button onClick={() => handleDelete(c.id)} disabled={deleting} style={{
                        background: '#FF6B6B', color: '#fff', border: 'none', borderRadius: 9,
                        padding: '7px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      }}>
                        {deleting ? '…' : 'Удалить'}
                      </button>
                      <button onClick={() => setDeleteId(null)} style={{
                        background: 'var(--pur-lt)', color: 'var(--pur)', border: 'none', borderRadius: 9,
                        padding: '7px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      }}>
                        Отмена
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setDeleteId(c.id)} style={{
                      background: '#FFF0F0', color: '#E53E3E', border: 'none', borderRadius: 9,
                      padding: '7px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
