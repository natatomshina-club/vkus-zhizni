'use client'

import { useState, useRef } from 'react'
import type { WebinarRow, WebinarMaterial } from '@/types/webinars'

// ── Types ──────────────────────────────────────────────────────────────────

interface LessonWithMaterials {
  id: string
  webinar_id: string
  title: string
  video_id: string | null
  sort_order: number
  materials: WebinarMaterial[]
}

interface WebinarAdmin extends WebinarRow {
  lessons_count: number
  pending_count: number
}

interface SelectionWithDetails {
  id: string
  member_id: string
  webinar_id: string
  status: string
  selected_at: string
  member: { id: string; full_name: string | null; email: string } | null
  webinar: { id: string; title: string; emoji: string } | null
}

interface Props {
  initialWebinars: WebinarAdmin[]
  initialSelections: SelectionWithDetails[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function Toast({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 300, background: '#2D1F6E', color: '#fff',
      padding: '12px 22px', borderRadius: 14, fontSize: 14, fontWeight: 600,
      boxShadow: '0 4px 24px rgba(44,30,110,0.22)',
      whiteSpace: 'nowrap', maxWidth: '90vw',
      animation: 'fadeUp 0.25s ease',
    }}>
      {msg}
    </div>
  )
}

// ── PDF Upload form ────────────────────────────────────────────────────────

function PdfUploadForm({
  uploadUrl,
  onUploaded,
  onCancel,
}: {
  uploadUrl: string
  onUploaded: (material: WebinarMaterial) => void
  onCancel: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) { setErr('Выберите файл'); return }
    if (!title.trim()) { setErr('Введите название'); return }

    setUploading(true)
    setProgress(10)
    setErr('')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('title', title.trim())

    try {
      setProgress(40)
      const res = await fetch(uploadUrl, { method: 'POST', body: fd })
      setProgress(80)
      if (!res.ok) {
        const e = await res.json().catch(() => ({})) as { error?: string }
        setErr(e.error ?? 'Ошибка загрузки')
        setProgress(0)
        return
      }
      const data = await res.json() as { material: WebinarMaterial }
      setProgress(100)
      setTimeout(() => onUploaded(data.material), 200)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      background: '#F9F8FF', border: '1px solid #EDE8FF', borderRadius: 12,
      padding: '14px 16px', marginTop: 8,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          style={{ fontSize: 13, color: '#3D2B8A' }}
        />
        <input
          type="text"
          placeholder="Название файла"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{
            padding: '8px 12px', borderRadius: 10, border: '1px solid #EDE8FF',
            fontSize: 13, color: '#3D2B8A', background: '#fff',
            fontFamily: 'var(--font-nunito)', outline: 'none',
          }}
        />
        {uploading && (
          <div style={{ height: 6, borderRadius: 3, background: '#EDE8FF', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: '#4CAF78',
              width: `${progress}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        )}
        {err && <p style={{ fontSize: 12, color: '#C0392B', margin: 0 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              padding: '8px 16px', borderRadius: 10, border: 'none',
              background: '#4CAF78', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer',
              minHeight: 40, opacity: uploading ? 0.7 : 1,
            }}
          >
            {uploading ? `Загружаю... ${progress}%` : 'Загрузить'}
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 12px', borderRadius: 10,
              border: '1px solid #EDE8FF', background: '#fff',
              color: '#7B6FAA', fontSize: 13, cursor: 'pointer', minHeight: 40,
            }}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Grant access inline ────────────────────────────────────────────────────

function GrantAccessForm({
  webinarId,
  onSuccess,
  onCancel,
}: {
  webinarId: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ id: string; full_name: string | null; email: string }[]>([])
  const [selected, setSelected] = useState<{ id: string; full_name: string | null; email: string } | null>(null)
  const [searching, setSearching] = useState(false)
  const [granting, setGranting] = useState(false)
  const [err, setErr] = useState('')

  async function handleSearch(q: string) {
    setQuery(q)
    setSelected(null)
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    const res = await fetch(`/api/admin/members?search=${encodeURIComponent(q)}&limit=8`)
    setSearching(false)
    if (!res.ok) return
    const data = await res.json() as { members: { id: string; full_name: string | null; email: string }[] }
    setResults(data.members ?? [])
  }

  async function handleGrant() {
    if (!selected) return
    setGranting(true)
    setErr('')
    const res = await fetch(`/api/admin/webinars/${webinarId}/grant-manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: selected.id }),
    })
    setGranting(false)
    if (!res.ok) {
      const e = await res.json().catch(() => ({})) as { error?: string }
      setErr(e.error ?? 'Ошибка')
      return
    }
    onSuccess()
  }

  return (
    <div style={{
      background: '#F9F8FF', border: '1px solid #EDE8FF', borderRadius: 12,
      padding: '14px 16px', marginTop: 8,
    }}>
      <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#3D2B8A' }}>
        Открыть доступ участнице
      </p>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Поиск по имени или email"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #EDE8FF',
            fontSize: 13, color: '#3D2B8A', background: '#fff',
            fontFamily: 'var(--font-nunito)', outline: 'none', boxSizing: 'border-box',
          }}
        />
        {results.length > 0 && !selected && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: '#fff', border: '1px solid #EDE8FF', borderRadius: 10,
            boxShadow: '0 4px 16px rgba(60,30,130,0.10)',
            maxHeight: 200, overflowY: 'auto',
          }}>
            {results.map(m => (
              <button
                key={m.id}
                onClick={() => { setSelected(m); setResults([]); setQuery(m.full_name ?? m.email) }}
                style={{
                  width: '100%', padding: '9px 12px', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: '#3D2B8A', fontFamily: 'var(--font-nunito)',
                  borderBottom: '1px solid #EDE8FF',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F0EEFF')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <span style={{ fontWeight: 600 }}>{m.full_name ?? '—'}</span>
                <span style={{ color: '#7B6FAA', marginLeft: 8 }}>{m.email}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {searching && <p style={{ fontSize: 12, color: '#7B6FAA', margin: '6px 0 0' }}>Поиск...</p>}
      {err && <p style={{ fontSize: 12, color: '#C0392B', margin: '6px 0 0' }}>{err}</p>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button
          onClick={handleGrant}
          disabled={!selected || granting}
          style={{
            padding: '9px 18px', borderRadius: 10, border: 'none',
            background: selected ? '#4CAF78' : '#C0B8D8', color: '#fff',
            fontSize: 13, fontWeight: 700,
            cursor: !selected || granting ? 'not-allowed' : 'pointer',
            minHeight: 40,
          }}
        >
          {granting ? 'Открываю...' : '✅ Открыть доступ'}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '9px 12px', borderRadius: 10, border: '1px solid #EDE8FF',
            background: '#fff', color: '#7B6FAA', fontSize: 13, cursor: 'pointer', minHeight: 40,
          }}
        >
          Отмена
        </button>
      </div>
    </div>
  )
}

// ── Lesson row ─────────────────────────────────────────────────────────────

function LessonRow({
  lesson,
  webinarId,
  index,
  onUpdated,
  onDeleted,
  onMaterialAdded,
  onMaterialDeleted,
  showToast,
}: {
  lesson: LessonWithMaterials
  webinarId: string
  index: number
  onUpdated: (l: LessonWithMaterials) => void
  onDeleted: (id: string) => void
  onMaterialAdded: (lessonId: string, mat: WebinarMaterial) => void
  onMaterialDeleted: (lessonId: string, matId: string) => void
  showToast: (msg: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(lesson.title)
  const [editVideoUrl, setEditVideoUrl] = useState(lesson.video_id ? `https://kinescope.io/embed/${lesson.video_id}` : '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showPdfForm, setShowPdfForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleSave() {
    if (!editTitle.trim()) return
    setSaving(true)
    const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle, video_url: editVideoUrl }),
    })
    setSaving(false)
    if (!res.ok) { showToast('Ошибка сохранения'); return }
    const data = await res.json() as { lesson: LessonWithMaterials }
    onUpdated({ ...data.lesson, materials: lesson.materials })
    setEditing(false)
    showToast('✅ Урок сохранён')
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/admin/lessons/${lesson.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (!res.ok) { showToast('Ошибка удаления'); return }
    onDeleted(lesson.id)
    showToast('Урок удалён')
  }

  async function handleDeleteMaterial(matId: string) {
    const res = await fetch(`/api/admin/materials/${matId}`, { method: 'DELETE' })
    if (!res.ok) { showToast('Ошибка удаления'); return }
    onMaterialDeleted(lesson.id, matId)
    showToast('Файл удалён')
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid #EDE8FF', borderRadius: 12,
      padding: '12px 14px', marginBottom: 8,
    }}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="text"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            placeholder="Название урока"
            style={{
              padding: '8px 12px', borderRadius: 10, border: '1px solid #EDE8FF',
              fontSize: 13, color: '#3D2B8A', background: '#FAF8FF',
              fontFamily: 'var(--font-nunito)', outline: 'none',
            }}
          />
          <input
            type="text"
            value={editVideoUrl}
            onChange={e => setEditVideoUrl(e.target.value)}
            placeholder="Ссылка на Kinescope (https://kinescope.io/...)"
            style={{
              padding: '8px 12px', borderRadius: 10, border: '1px solid #EDE8FF',
              fontSize: 13, color: '#3D2B8A', background: '#FAF8FF',
              fontFamily: 'var(--font-nunito)', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '8px 16px', borderRadius: 10, border: 'none',
                background: '#4CAF78', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                minHeight: 38,
              }}
            >
              {saving ? 'Сохраняю...' : 'Сохранить'}
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{
                padding: '8px 12px', borderRadius: 10, border: '1px solid #EDE8FF',
                background: '#fff', color: '#7B6FAA', fontSize: 13, cursor: 'pointer', minHeight: 38,
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#3D2B8A' }}>
                Урок {index + 1}: {lesson.title}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: '#7B6FAA' }}>
                Видео:{' '}
                {lesson.video_id
                  ? <span style={{ color: '#4CAF78' }}>{lesson.video_id} ✅</span>
                  : <span style={{ color: '#FF9F43' }}>не добавлено ⚠️</span>
                }
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: '1px solid #EDE8FF',
                  background: '#F0EEFF', color: '#7C5CFC', fontSize: 12, cursor: 'pointer',
                }}
              >
                ✏️ Ред.
              </button>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, border: '1px solid #FFD0D0',
                    background: '#FFF5F5', color: '#C0392B', fontSize: 12, cursor: 'pointer',
                  }}
                >
                  🗑
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      padding: '6px 10px', borderRadius: 8, border: 'none',
                      background: '#C0392B', color: '#fff', fontSize: 12,
                      cursor: deleting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {deleting ? '...' : 'Да'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    style={{
                      padding: '6px 10px', borderRadius: 8, border: '1px solid #EDE8FF',
                      background: '#fff', color: '#7B6FAA', fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    Нет
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Materials */}
          {lesson.materials.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {lesson.materials.map(m => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 10px', borderRadius: 8, background: '#FAF8FF',
                  border: '1px solid #EDE8FF',
                }}>
                  <span style={{ fontSize: 14 }}>📎</span>
                  <a
                    href={m.url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ flex: 1, fontSize: 13, color: '#7C5CFC', textDecoration: 'none' }}
                  >
                    {m.title}
                  </a>
                  <button
                    onClick={() => handleDeleteMaterial(m.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 14, color: '#C0392B', padding: '2px 6px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add PDF */}
          <div style={{ marginTop: 8 }}>
            {!showPdfForm ? (
              <button
                onClick={() => setShowPdfForm(true)}
                style={{
                  fontSize: 12, color: '#7C5CFC', background: 'none', border: 'none',
                  cursor: 'pointer', padding: '4px 0', fontWeight: 600,
                }}
              >
                + Добавить PDF к уроку
              </button>
            ) : (
              <PdfUploadForm
                uploadUrl={`/api/admin/lessons/${lesson.id}/materials`}
                onUploaded={mat => { onMaterialAdded(lesson.id, mat); setShowPdfForm(false) }}
                onCancel={() => setShowPdfForm(false)}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Webinar card ───────────────────────────────────────────────────────────

function WebinarCard({
  webinar,
  showToast,
}: {
  webinar: WebinarAdmin
  showToast: (msg: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [grantOpen, setGrantOpen] = useState(false)
  const [lessons, setLessons] = useState<LessonWithMaterials[]>([])
  const [generalMaterials, setGeneralMaterials] = useState<WebinarMaterial[]>([])
  const [loadingLessons, setLoadingLessons] = useState(false)
  const [showAddLesson, setShowAddLesson] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [addingLesson, setAddingLesson] = useState(false)
  const [showGeneralPdf, setShowGeneralPdf] = useState(false)

  async function loadLessons() {
    if (lessons.length > 0) return
    setLoadingLessons(true)
    const res = await fetch(`/api/admin/webinars/${webinar.id}/lessons`)
    setLoadingLessons(false)
    if (!res.ok) return
    const data = await res.json() as { lessons: LessonWithMaterials[]; general_materials: WebinarMaterial[] }
    setLessons(data.lessons ?? [])
    setGeneralMaterials(data.general_materials ?? [])
  }

  function handleToggle() {
    if (!open) loadLessons()
    setOpen(v => !v)
  }

  async function handleAddLesson() {
    if (!newTitle.trim()) return
    setAddingLesson(true)
    const res = await fetch(`/api/admin/webinars/${webinar.id}/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, video_url: newVideoUrl, sort_order: lessons.length }),
    })
    setAddingLesson(false)
    if (!res.ok) { showToast('Ошибка создания урока'); return }
    const data = await res.json() as { lesson: LessonWithMaterials }
    setLessons(prev => [...prev, data.lesson])
    setNewTitle('')
    setNewVideoUrl('')
    setShowAddLesson(false)
    showToast('✅ Урок добавлен')
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid #EDE8FF', borderRadius: 16,
      marginBottom: 12, overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        background: `linear-gradient(135deg, ${webinar.color_from}22, ${webinar.color_to}22)`,
        borderBottom: '1px solid #EDE8FF',
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 28 }}>{webinar.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-unbounded)', color: '#3D2B8A' }}>
              {webinar.title}
            </p>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: webinar.content_type === 'course' ? '#F0EEFF' : '#E8F5E9',
              color: webinar.content_type === 'course' ? '#7C5CFC' : '#2D6A4F',
            }}>
              {webinar.content_type === 'course' ? 'КУРС' : 'ВЕБИНАР'}
            </span>
            {!webinar.is_published && (
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 20,
                background: '#FFF3C0', color: '#5C4200', fontWeight: 600,
              }}>
                скрыт
              </span>
            )}
          </div>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7B6FAA' }}>
            Цена: {webinar.price.toLocaleString('ru-RU')} ₽
            &nbsp;•&nbsp;Уроков: {webinar.lessons_count}
            {webinar.pending_count > 0 && (
              <span style={{ marginLeft: 6, background: '#FFD93D', color: '#5C4200', padding: '1px 8px', borderRadius: 20, fontWeight: 700 }}>
                ⏳ {webinar.pending_count} ожидают
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '10px 18px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={handleToggle}
          style={{
            padding: '8px 14px', borderRadius: 10,
            border: '1px solid #EDE8FF',
            background: open ? '#7C5CFC' : '#F0EEFF',
            color: open ? '#fff' : '#7C5CFC',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 40,
          }}
        >
          {open ? '▲ Скрыть уроки' : '▼ Управление уроками'}
        </button>
        <button
          onClick={() => { setGrantOpen(v => !v); setOpen(false) }}
          style={{
            padding: '8px 14px', borderRadius: 10, border: 'none',
            background: '#4CAF78', color: '#fff',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 40,
          }}
        >
          Открыть доступ
        </button>
      </div>

      {/* Grant access inline */}
      {grantOpen && (
        <div style={{ padding: '0 18px 16px' }}>
          <GrantAccessForm
            webinarId={webinar.id}
            onSuccess={() => { setGrantOpen(false); showToast('✅ Доступ открыт, участница получила уведомление') }}
            onCancel={() => setGrantOpen(false)}
          />
        </div>
      )}

      {/* Lessons accordion */}
      {open && (
        <div style={{ padding: '0 18px 18px' }}>
          <div style={{
            background: '#FAF8FF', border: '1px solid #EDE8FF', borderRadius: 14, padding: '14px',
          }}>
            <p style={{
              margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#7B6FAA',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              Уроки
            </p>

            {loadingLessons && (
              <p style={{ fontSize: 13, color: '#7B6FAA' }}>Загружаю...</p>
            )}

            {lessons.map((lesson, idx) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                webinarId={webinar.id}
                index={idx}
                onUpdated={updated => setLessons(prev => prev.map(l => l.id === updated.id ? updated : l))}
                onDeleted={id => setLessons(prev => prev.filter(l => l.id !== id))}
                onMaterialAdded={(lessonId, mat) =>
                  setLessons(prev => prev.map(l =>
                    l.id === lessonId ? { ...l, materials: [...l.materials, mat] } : l
                  ))
                }
                onMaterialDeleted={(lessonId, matId) =>
                  setLessons(prev => prev.map(l =>
                    l.id === lessonId ? { ...l, materials: l.materials.filter(m => m.id !== matId) } : l
                  ))
                }
                showToast={showToast}
              />
            ))}

            {/* Add lesson form */}
            {!showAddLesson ? (
              <button
                onClick={() => setShowAddLesson(true)}
                style={{
                  fontSize: 13, color: '#7C5CFC', background: 'none', border: 'none',
                  cursor: 'pointer', padding: '6px 0', fontWeight: 600,
                }}
              >
                + Добавить урок
              </button>
            ) : (
              <div style={{
                background: '#fff', border: '1px solid #EDE8FF', borderRadius: 12,
                padding: '12px 14px', marginTop: 4,
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Название урока"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    style={{
                      padding: '8px 12px', borderRadius: 10, border: '1px solid #EDE8FF',
                      fontSize: 13, color: '#3D2B8A', background: '#FAF8FF',
                      fontFamily: 'var(--font-nunito)', outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Ссылка на Kinescope (вставь — ID извлечётся автоматически)"
                    value={newVideoUrl}
                    onChange={e => setNewVideoUrl(e.target.value)}
                    style={{
                      padding: '8px 12px', borderRadius: 10, border: '1px solid #EDE8FF',
                      fontSize: 13, color: '#3D2B8A', background: '#FAF8FF',
                      fontFamily: 'var(--font-nunito)', outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={handleAddLesson}
                      disabled={addingLesson || !newTitle.trim()}
                      style={{
                        padding: '8px 16px', borderRadius: 10, border: 'none',
                        background: newTitle.trim() ? '#4CAF78' : '#C0B8D8', color: '#fff',
                        fontSize: 13, fontWeight: 700,
                        cursor: addingLesson || !newTitle.trim() ? 'not-allowed' : 'pointer',
                        minHeight: 38,
                      }}
                    >
                      {addingLesson ? 'Добавляю...' : 'Сохранить'}
                    </button>
                    <button
                      onClick={() => setShowAddLesson(false)}
                      style={{
                        padding: '8px 12px', borderRadius: 10, border: '1px solid #EDE8FF',
                        background: '#fff', color: '#7B6FAA', fontSize: 13, cursor: 'pointer', minHeight: 38,
                      }}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* General materials section */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #EDE8FF' }}>
              <p style={{
                margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#7B6FAA',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Общие материалы вебинара
              </p>
              {generalMaterials.map(m => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 10px', borderRadius: 8, background: '#fff',
                  border: '1px solid #EDE8FF', marginBottom: 4,
                }}>
                  <span style={{ fontSize: 14 }}>📎</span>
                  <a href={m.url ?? '#'} target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, fontSize: 13, color: '#7C5CFC', textDecoration: 'none' }}>
                    {m.title}
                  </a>
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/admin/materials/${m.id}`, { method: 'DELETE' })
                      if (res.ok) {
                        setGeneralMaterials(prev => prev.filter(x => x.id !== m.id))
                        showToast('Файл удалён')
                      }
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#C0392B', padding: '2px 6px' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {!showGeneralPdf ? (
                <button
                  onClick={() => setShowGeneralPdf(true)}
                  style={{ fontSize: 12, color: '#7C5CFC', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontWeight: 600 }}
                >
                  + Добавить общий PDF
                </button>
              ) : (
                <PdfUploadForm
                  uploadUrl={`/api/admin/webinars/${webinar.id}/materials`}
                  onUploaded={mat => { setGeneralMaterials(prev => [...prev, mat]); setShowGeneralPdf(false) }}
                  onCancel={() => setShowGeneralPdf(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Selections tab ─────────────────────────────────────────────────────────

function SelectionsTab({
  initialSelections,
  showToast,
}: {
  initialSelections: SelectionWithDetails[]
  showToast: (msg: string) => void
}) {
  const [selections, setSelections] = useState(initialSelections)
  const [grantingId, setGrantingId] = useState<string | null>(null)

  async function handleGrant(sel: SelectionWithDetails) {
    setGrantingId(sel.id)
    const res = await fetch(`/api/admin/webinar-selections/${sel.id}/grant`, { method: 'PATCH' })
    setGrantingId(null)
    if (!res.ok) { showToast('Ошибка подтверждения'); return }
    setSelections(prev => prev.filter(s => s.id !== sel.id))
    showToast('✅ Доступ открыт, участница получила уведомление')
  }

  if (selections.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px', color: '#7B6FAA', fontSize: 15 }}>
        🎉 Все запросы обработаны
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {selections.map(sel => (
        <div key={sel.id} style={{
          background: '#fff', border: '1px solid #EDE8FF', borderRadius: 14, padding: '16px 18px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>{sel.webinar?.emoji ?? '📹'}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#3D2B8A' }}>
                {sel.webinar?.title ?? 'Неизвестный вебинар'}
              </p>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: '#7B6FAA' }}>
                Участница: <span style={{ color: '#3D2B8A', fontWeight: 600 }}>{sel.member?.full_name ?? '—'}</span>
              </p>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: '#7B6FAA' }}>
                Email: {sel.member?.email ?? '—'}
              </p>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9B8FCC' }}>
                Запрос: {formatDate(sel.selected_at)}
              </p>
              <button
                onClick={() => handleGrant(sel)}
                disabled={grantingId === sel.id}
                style={{
                  padding: '10px 20px', borderRadius: 12, border: 'none',
                  background: '#4CAF78', color: '#fff',
                  fontSize: 14, fontWeight: 700,
                  cursor: grantingId === sel.id ? 'not-allowed' : 'pointer',
                  minHeight: 44, opacity: grantingId === sel.id ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {grantingId === sel.id ? '⏳ Открываю...' : 'Открыть доступ'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function WebinarsAdminClient({ initialWebinars, initialSelections }: Props) {
  const [tab, setTab] = useState<'webinars' | 'pending'>('webinars')
  const [toast, setToast] = useState('')
  const [pendingCount, setPendingCount] = useState(initialSelections.length)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  return (
    <div>
      {toast && <Toast msg={toast} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <a
          href="/admin"
          style={{
            fontSize: 13, color: '#7B6FAA', textDecoration: 'none',
            padding: '8px 12px', borderRadius: 10, background: '#F0EEFF',
          }}
        >
          ← Назад
        </a>
        <h1 style={{
          fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700,
          color: '#3D2B8A', margin: 0,
        }}>
          Вебинары
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setTab('webinars')}
          style={{
            padding: '10px 18px', borderRadius: 12, border: 'none',
            background: tab === 'webinars' ? '#7C5CFC' : '#F0EEFF',
            color: tab === 'webinars' ? '#fff' : '#7C5CFC',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44,
          }}
        >
          📋 Вебинары и курсы
        </button>
        <button
          onClick={() => setTab('pending')}
          style={{
            padding: '10px 18px', borderRadius: 12, border: 'none',
            background: tab === 'pending' ? '#7C5CFC' : '#F0EEFF',
            color: tab === 'pending' ? '#fff' : '#7C5CFC',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44,
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          ⏳ Ожидают подтверждения
          {pendingCount > 0 && (
            <span style={{
              background: '#FFD93D', color: '#5C4200',
              fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
            }}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      {tab === 'webinars' ? (
        <div>
          {initialWebinars.length === 0 ? (
            <p style={{ color: '#7B6FAA', fontSize: 14 }}>Вебинаров пока нет</p>
          ) : (
            initialWebinars.map(w => (
              <WebinarCard key={w.id} webinar={w} showToast={showToast} />
            ))
          )}
        </div>
      ) : (
        <SelectionsTab
          initialSelections={initialSelections}
          showToast={(msg) => {
            showToast(msg)
            setPendingCount(prev => Math.max(0, prev - 1))
          }}
        />
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateX(-50%) translateY(8px) }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) }
        }
      `}</style>
    </div>
  )
}
