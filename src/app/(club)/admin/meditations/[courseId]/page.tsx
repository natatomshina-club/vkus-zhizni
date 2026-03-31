'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'

type Meditation = {
  id: string
  course_id: string
  title: string
  description: string | null
  duration_seconds: number | null
  audio_url: string | null
  emoji: string | null
  sort_order: number
  is_visible: boolean
  play_count: number
}

type Course = {
  id: string
  title: string
  emoji: string | null
  gradient_from: string
  gradient_to: string
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  if (seconds < 3600) return `${Math.round(seconds / 60)} мин`
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1.5px solid var(--border)', borderRadius: 10,
  padding: '9px 12px', fontSize: 14, color: 'var(--text)', background: '#FAF8FF', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4,
}

const emptyForm = { title: '', description: '', emoji: '🧘', sort_order: '0', is_visible: true }

export default function AdminCourseMeditationsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params)
  const [course, setCourse] = useState<Course | null>(null)
  const [meditations, setMeditations] = useState<Meditation[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ ...emptyForm })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadMsg, setUploadMsg] = useState<Record<string, string>>({})
  const [toggling, setToggling] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    // Load course info
    const coursesRes = await fetch('/api/admin/meditations/courses')
    if (coursesRes.ok) {
      const { courses } = await coursesRes.json() as { courses: Course[] }
      const c = courses.find(x => x.id === courseId)
      if (c) setCourse(c)
    }
    // Load meditations
    const medsRes = await fetch(`/api/admin/meditations/courses/${courseId}/meditations`)
    if (medsRes.ok) {
      const { meditations: m } = await medsRes.json() as { meditations: Meditation[] }
      setMeditations(m ?? [])
    }
    setLoading(false)
  }, [courseId])

  useEffect(() => { load() }, [load])

  function startEdit(m: Meditation) {
    setEditId(m.id)
    setShowCreate(false)
    setEditForm({
      title: m.title, description: m.description ?? '',
      emoji: m.emoji ?? '🧘', sort_order: String(m.sort_order), is_visible: m.is_visible,
    })
    setSaveErr('')
  }

  function cancelForm() {
    setEditId(null)
    setShowCreate(false)
    setEditForm({ ...emptyForm })
    setSaveErr('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveErr('')
    const payload = { ...editForm, sort_order: parseInt(editForm.sort_order) || 0 }
    const url = editId
      ? `/api/admin/meditations/${editId}`
      : `/api/admin/meditations/courses/${courseId}/meditations`
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
    const res = await fetch(`/api/admin/meditations/${id}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    if (res.ok) load()
  }

  async function handleToggleVisible(m: Meditation) {
    setToggling(m.id)
    await fetch(`/api/admin/meditations/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_visible: !m.is_visible }),
    })
    setToggling(null)
    load()
  }

  async function handleUpload(medId: string, file: File) {
    if (file.size > 200 * 1024 * 1024) {
      setUploadMsg(prev => ({ ...prev, [medId]: 'Ошибка: файл слишком большой (максимум 200 МБ)' }))
      return
    }
    setUploadingId(medId)
    setUploadMsg(prev => ({ ...prev, [medId]: '' }))
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/admin/meditations/${medId}/upload`, { method: 'POST', body: fd })
      const text = await res.text()
      let d: { url?: string; error?: string } = {}
      try { d = JSON.parse(text) } catch { d = { error: text || `HTTP ${res.status}` } }
      setUploadingId(null)
      if (!res.ok) {
        const msg = d.error ?? `HTTP ${res.status}`
        console.error('[upload] error:', medId, msg, text)
        setUploadMsg(prev => ({ ...prev, [medId]: `Ошибка: ${msg}` }))
      } else {
        setUploadMsg(prev => ({ ...prev, [medId]: '✅ Загружено' }))
        load()
      }
    } catch (err) {
      setUploadingId(null)
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[upload] exception:', medId, err)
      setUploadMsg(prev => ({ ...prev, [medId]: `Ошибка: ${msg}` }))
    }
  }

  if (loading) return <div style={{ padding: 32, color: 'var(--muted)', textAlign: 'center' }}>Загружаем…</div>

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Link href="/admin/meditations" style={{
          fontSize: 13, color: 'var(--muted)', textDecoration: 'none',
          padding: '8px 12px', borderRadius: 10, background: 'var(--pur-lt)',
        }}>← Назад</Link>
        <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 16, fontWeight: 700, color: '#3D2B8A', margin: 0, flex: 1 }}>
          {course?.emoji} {course?.title ?? 'Медитации курса'}
        </h1>
        <button
          onClick={() => { setShowCreate(s => !s); setEditId(null); setEditForm({ ...emptyForm }); setSaveErr('') }}
          style={{
            background: 'var(--pur)', color: '#fff', border: 'none', borderRadius: 12,
            padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 48,
          }}
        >
          + Добавить медитацию
        </button>
      </div>

      {/* Course gradient strip */}
      {course && (
        <div style={{
          height: 8, borderRadius: 8, marginBottom: 20,
          background: `linear-gradient(90deg, ${course.gradient_from}, ${course.gradient_to})`,
        }} />
      )}

      {/* Create/Edit form */}
      {(showCreate || editId) && (
        <form onSubmit={handleSave} style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 20,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
            {editId ? 'Редактировать медитацию' : 'Новая медитация'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Название *</label>
              <input required value={editForm.title}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Утренний настрой" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Описание</label>
              <textarea value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="Короткое описание медитации…"
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
            <div>
              <label style={labelStyle}>Эмодзи</label>
              <input value={editForm.emoji}
                onChange={e => setEditForm(f => ({ ...f, emoji: e.target.value }))}
                placeholder="🧘" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Порядок (sort_order)</label>
              <input type="number" value={editForm.sort_order}
                onChange={e => setEditForm(f => ({ ...f, sort_order: e.target.value }))}
                style={inputStyle} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="med_visible" checked={editForm.is_visible}
                onChange={e => setEditForm(f => ({ ...f, is_visible: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <label htmlFor="med_visible" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>
                Видимая
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

      {/* Meditations list */}
      {meditations.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: 16,
          padding: 32, textAlign: 'center', color: 'var(--muted)',
        }}>
          Медитаций нет. Добавь первую!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {meditations.map(m => (
            <div key={m.id} style={{
              background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden',
            }}>
              {/* Gradient mini-bar */}
              {course && (
                <div style={{ height: 4, background: `linear-gradient(90deg, ${course.gradient_from}, ${course.gradient_to})` }} />
              )}
              <div style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>{m.emoji ?? '🧘'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                      {m.title}
                    </div>
                    {m.description && (
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{m.description}</div>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {m.audio_url ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#2D6A4F', background: '#A8E6CF', borderRadius: 6, padding: '2px 8px' }}>
                          ✅ {formatDuration(m.duration_seconds) || 'Аудио есть'}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', background: 'var(--pur-lt)', borderRadius: 6, padding: '2px 8px' }}>
                          ⬜ Нет файла
                        </span>
                      )}
                      {m.play_count > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--pale)' }}>👁 {m.play_count} прослушиваний</span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--pale)' }}>#{m.sort_order}</span>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                    {/* Visibility toggle */}
                    <button
                      onClick={() => handleToggleVisible(m)}
                      disabled={toggling === m.id}
                      style={{
                        background: m.is_visible ? '#E8FBF3' : 'var(--pur-lt)',
                        color: m.is_visible ? '#2D6A4F' : 'var(--muted)',
                        border: 'none', borderRadius: 8, padding: '5px 10px',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      {m.is_visible ? '👁 Видима' : '🙈 Скрыта'}
                    </button>
                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => startEdit(m)} style={{
                        background: 'var(--pur-lt)', color: 'var(--pur)', border: 'none', borderRadius: 8,
                        padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      }}>
                        Изменить
                      </button>
                      {deleteId === m.id ? (
                        <>
                          <button onClick={() => handleDelete(m.id)} disabled={deleting} style={{
                            background: '#FF6B6B', color: '#fff', border: 'none', borderRadius: 8,
                            padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          }}>
                            {deleting ? '…' : 'Удалить'}
                          </button>
                          <button onClick={() => setDeleteId(null)} style={{
                            background: 'var(--pur-lt)', color: 'var(--pur)', border: 'none', borderRadius: 8,
                            padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          }}>
                            ✕
                          </button>
                        </>
                      ) : (
                        <button onClick={() => setDeleteId(m.id)} style={{
                          background: '#FFF0F0', color: '#E53E3E', border: 'none', borderRadius: 8,
                          padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        }}>
                          Удалить
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Audio upload */}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginBottom: 6 }}>
                    🎵 Аудиофайл (MP3 или M4A)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <label style={{
                      background: uploadingId === m.id ? 'var(--pur-lt)' : 'var(--pur)',
                      color: uploadingId === m.id ? 'var(--pur)' : '#fff',
                      borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 700,
                      cursor: uploadingId === m.id ? 'not-allowed' : 'pointer', display: 'inline-block',
                    }}>
                      {uploadingId === m.id ? 'Загружаем…' : m.audio_url ? '🔄 Заменить аудио' : '⬆️ Загрузить аудио'}
                      <input
                        type="file" accept=".mp3,.m4a,audio/mpeg,audio/mp4"
                        style={{ display: 'none' }}
                        disabled={uploadingId === m.id}
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) handleUpload(m.id, file)
                          e.target.value = ''
                        }}
                      />
                    </label>
                    {m.audio_url && (
                      <a href={m.audio_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: 'var(--pur)', fontWeight: 700 }}>
                        ▶ Прослушать ↗
                      </a>
                    )}
                    {uploadMsg[m.id] && (
                      <span style={{
                        fontSize: 12,
                        color: uploadMsg[m.id].startsWith('✅') ? '#2D6A4F' : '#E53E3E',
                      }}>
                        {uploadMsg[m.id]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
