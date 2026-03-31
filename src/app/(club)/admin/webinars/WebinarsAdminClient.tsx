'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
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

const INPUT_STYLE: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 10, border: '1px solid #EDE8FF',
  fontSize: 13, color: '#3D2B8A', background: '#FAF8FF',
  fontFamily: 'var(--font-nunito)', outline: 'none', width: '100%', boxSizing: 'border-box',
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#7B6FAA',
  textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4,
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

// ── PDF Upload form (via API route, for lesson-level PDFs) ─────────────────

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
  const [fileName, setFileName] = useState('')
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')

  function pickFile() {
    fileRef.current?.click()
  }

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
    <div style={{ background: '#F9F8FF', border: '1px solid #EDE8FF', borderRadius: 12, padding: '14px 16px', marginTop: 8 }}>
      <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => setFileName(e.target.files?.[0]?.name ?? '')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button type="button" onClick={pickFile} style={{ padding: '8px 14px', borderRadius: 10, border: '1px dashed #7C5CFC', background: '#fff', color: '#7C5CFC', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left', minHeight: 40 }}>
          {fileName ? `📄 ${fileName}` : '📎 Выбрать PDF файл'}
        </button>
        <input
          type="text" placeholder="Название файла" value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #EDE8FF', fontSize: 13, color: '#3D2B8A', background: '#fff', fontFamily: 'var(--font-nunito)', outline: 'none' }}
        />
        {uploading && (
          <div style={{ height: 6, borderRadius: 3, background: '#EDE8FF', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, background: '#4CAF78', width: `${progress}%`, transition: 'width 0.3s ease' }} />
          </div>
        )}
        {err && <p style={{ fontSize: 12, color: '#C0392B', margin: 0 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleUpload} disabled={uploading} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#4CAF78', color: '#fff', fontSize: 13, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', minHeight: 40, opacity: uploading ? 0.7 : 1 }}>
            {uploading ? `Загружаю... ${progress}%` : 'Загрузить'}
          </button>
          <button type="button" onClick={onCancel} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #EDE8FF', background: '#fff', color: '#7B6FAA', fontSize: 13, cursor: 'pointer', minHeight: 40 }}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Direct PDF Upload (client → Supabase Storage, no Vercel size limit) ───
// Generic: works for both webinar-level and lesson-level materials.
// storagePathPrefix: folder prefix inside 'webinar-materials' bucket
// saveUrl:           API endpoint to persist the DB record (accepts JSON { title, url, ...extra })
// extraBody:         additional JSON fields to send alongside title+url

function DirectPdfUpload({
  storagePathPrefix,
  saveUrl,
  extraBody,
  onUploaded,
  onCancel,
}: {
  storagePathPrefix: string
  saveUrl: string
  extraBody?: Record<string, string>
  onUploaded: (material: WebinarMaterial) => void
  onCancel: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [fileName, setFileName] = useState('')
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')

  function pickFile() {
    fileRef.current?.click()
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) { setErr('Выберите файл'); return }
    if (!title.trim()) { setErr('Введите название'); return }
    if (file.type !== 'application/pdf') { setErr('Только PDF файлы'); return }

    setUploading(true)
    setProgress(20)
    setErr('')

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const storagePath = `${storagePathPrefix}/${safeName}`

      setProgress(40)
      const { error: uploadErr } = await supabase.storage
        .from('webinar-materials')
        .upload(storagePath, file, { contentType: 'application/pdf', upsert: false })

      if (uploadErr) {
        setErr(`Ошибка загрузки: ${uploadErr.message}`)
        setProgress(0)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('webinar-materials')
        .getPublicUrl(storagePath)

      setProgress(80)

      const res = await fetch(saveUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), url: publicUrl, ...extraBody }),
      })

      if (!res.ok) {
        const e = await res.json().catch(() => ({})) as { error?: string }
        setErr(e.error ?? 'Ошибка сохранения')
        setProgress(0)
        return
      }

      const data = await res.json() as { material: WebinarMaterial }
      setProgress(100)
      setTimeout(() => onUploaded(data.material), 200)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка')
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ background: '#F0EEFF', border: '1px solid #DDD5FF', borderRadius: 12, padding: '14px 16px', marginTop: 8 }}>
      <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => setFileName(e.target.files?.[0]?.name ?? '')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button type="button" onClick={pickFile} style={{ padding: '8px 14px', borderRadius: 10, border: '1px dashed #7C5CFC', background: '#fff', color: '#7C5CFC', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left', minHeight: 40 }}>
          {fileName ? `📄 ${fileName}` : '📎 Выбрать PDF файл'}
        </button>
        <input
          type="text" placeholder="Название файла" value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #DDD5FF', fontSize: 13, color: '#3D2B8A', background: '#fff', fontFamily: 'var(--font-nunito)', outline: 'none' }}
        />
        {uploading && (
          <div style={{ height: 6, borderRadius: 3, background: '#DDD5FF', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, background: '#7C5CFC', width: `${progress}%`, transition: 'width 0.3s ease' }} />
          </div>
        )}
        {err && <p style={{ fontSize: 12, color: '#C0392B', margin: 0 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleUpload} disabled={uploading} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#7C5CFC', color: '#fff', fontSize: 13, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', minHeight: 40, opacity: uploading ? 0.7 : 1 }}>
            {uploading ? `Загружаю... ${progress}%` : '📤 Загрузить'}
          </button>
          <button type="button" onClick={onCancel} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #DDD5FF', background: '#fff', color: '#7B6FAA', fontSize: 13, cursor: 'pointer', minHeight: 40 }}>
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
    <div style={{ background: '#F9F8FF', border: '1px solid #EDE8FF', borderRadius: 12, padding: '14px 16px', marginTop: 8 }}>
      <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#3D2B8A' }}>Открыть доступ участнице</p>
      <div style={{ position: 'relative' }}>
        <input
          type="text" placeholder="Поиск по имени или email" value={query}
          onChange={e => handleSearch(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #EDE8FF', fontSize: 13, color: '#3D2B8A', background: '#fff', fontFamily: 'var(--font-nunito)', outline: 'none', boxSizing: 'border-box' }}
        />
        {results.length > 0 && !selected && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid #EDE8FF', borderRadius: 10, boxShadow: '0 4px 16px rgba(60,30,130,0.10)', maxHeight: 200, overflowY: 'auto' }}>
            {results.map(m => (
              <button
                key={m.id}
                onClick={() => { setSelected(m); setResults([]); setQuery(m.full_name ?? m.email) }}
                style={{ width: '100%', padding: '9px 12px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#3D2B8A', fontFamily: 'var(--font-nunito)', borderBottom: '1px solid #EDE8FF' }}
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
          onClick={handleGrant} disabled={!selected || granting}
          style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: selected ? '#4CAF78' : '#C0B8D8', color: '#fff', fontSize: 13, fontWeight: 700, cursor: !selected || granting ? 'not-allowed' : 'pointer', minHeight: 40 }}
        >
          {granting ? 'Открываю...' : '✅ Открыть доступ'}
        </button>
        <button onClick={onCancel} style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid #EDE8FF', background: '#fff', color: '#7B6FAA', fontSize: 13, cursor: 'pointer', minHeight: 40 }}>
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
    <div style={{ background: '#fff', border: '1px solid #EDE8FF', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Название урока" style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #EDE8FF', fontSize: 13, color: '#3D2B8A', background: '#FAF8FF', fontFamily: 'var(--font-nunito)', outline: 'none' }} />
          <input type="text" value={editVideoUrl} onChange={e => setEditVideoUrl(e.target.value)} placeholder="Ссылка на Kinescope (https://kinescope.io/...)" style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #EDE8FF', fontSize: 13, color: '#3D2B8A', background: '#FAF8FF', fontFamily: 'var(--font-nunito)', outline: 'none' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#4CAF78', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', minHeight: 38 }}>
              {saving ? 'Сохраняю...' : 'Сохранить'}
            </button>
            <button onClick={() => setEditing(false)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #EDE8FF', background: '#fff', color: '#7B6FAA', fontSize: 13, cursor: 'pointer', minHeight: 38 }}>
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#3D2B8A' }}>Урок {index + 1}: {lesson.title}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#7B6FAA' }}>
                Видео:{' '}
                {lesson.video_id
                  ? <span style={{ color: '#4CAF78' }}>{lesson.video_id} ✅</span>
                  : <span style={{ color: '#FF9F43' }}>не добавлено ⚠️</span>
                }
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => setEditing(true)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #EDE8FF', background: '#F0EEFF', color: '#7C5CFC', fontSize: 12, cursor: 'pointer' }}>
                ✏️ Ред.
              </button>
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #FFD0D0', background: '#FFF5F5', color: '#C0392B', fontSize: 12, cursor: 'pointer' }}>🗑</button>
              ) : (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={handleDelete} disabled={deleting} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#C0392B', color: '#fff', fontSize: 12, cursor: deleting ? 'not-allowed' : 'pointer' }}>
                    {deleting ? '...' : 'Да'}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #EDE8FF', background: '#fff', color: '#7B6FAA', fontSize: 12, cursor: 'pointer' }}>Нет</button>
                </div>
              )}
            </div>
          </div>

          {lesson.materials.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {lesson.materials.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: '#FAF8FF', border: '1px solid #EDE8FF' }}>
                  <span style={{ fontSize: 14 }}>📎</span>
                  <a href={m.url ?? '#'} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 13, color: '#7C5CFC', textDecoration: 'none' }}>{m.title}</a>
                  <button onClick={() => handleDeleteMaterial(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#C0392B', padding: '2px 6px' }}>✕</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            {!showPdfForm ? (
              <button onClick={() => setShowPdfForm(true)} style={{ fontSize: 12, color: '#7C5CFC', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontWeight: 600 }}>
                📎 Прикрепить PDF к уроку
              </button>
            ) : (
              <DirectPdfUpload
                storagePathPrefix={`webinars/${webinarId}/lessons/${lesson.id}`}
                saveUrl={`/api/admin/lessons/${lesson.id}/materials`}
                extraBody={{ webinar_id: webinarId }}
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
  webinar: initialWebinar,
  onUpdated,
  showToast,
}: {
  webinar: WebinarAdmin
  onUpdated: (w: WebinarAdmin) => void
  showToast: (msg: string) => void
}) {
  const [webinar, setWebinar] = useState(initialWebinar)
  const [open, setOpen] = useState(false)
  const [grantOpen, setGrantOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [lessons, setLessons] = useState<LessonWithMaterials[]>([])
  const [loadingLessons, setLoadingLessons] = useState(false)
  const [showAddLesson, setShowAddLesson] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [addingLesson, setAddingLesson] = useState(false)

  // Edit form state
  const [editEmoji, setEditEmoji] = useState(webinar.emoji)
  const [editTitle, setEditTitle] = useState(webinar.title)
  const [editSlug, setEditSlug] = useState(webinar.slug)
  const [editShortDesc, setEditShortDesc] = useState(webinar.short_desc)
  const [editFullDesc, setEditFullDesc] = useState(webinar.full_desc)
  const [editPrice, setEditPrice] = useState(String(webinar.price))
  const [editContentType, setEditContentType] = useState(webinar.content_type)
  const [editColorFrom, setEditColorFrom] = useState(webinar.color_from)
  const [editColorTo, setEditColorTo] = useState(webinar.color_to)
  const [editPublished, setEditPublished] = useState(webinar.is_published)
  const [editSortOrder, setEditSortOrder] = useState(String(webinar.sort_order))
  const [editMaterials, setEditMaterials] = useState<WebinarMaterial[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(false)
  const [showPdfUpload, setShowPdfUpload] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadLessons() {
    if (lessons.length > 0) return
    setLoadingLessons(true)
    const res = await fetch(`/api/admin/webinars/${webinar.id}/lessons`)
    setLoadingLessons(false)
    if (!res.ok) return
    const data = await res.json() as { lessons: LessonWithMaterials[] }
    setLessons(data.lessons ?? [])
  }

  async function loadEditMaterials() {
    setLoadingMaterials(true)
    const res = await fetch(`/api/admin/webinars/${webinar.id}/lessons`)
    setLoadingMaterials(false)
    if (!res.ok) return
    const data = await res.json() as { general_materials: WebinarMaterial[] }
    setEditMaterials(data.general_materials ?? [])
  }

  function handleToggle() {
    if (!open) loadLessons()
    setOpen(v => !v)
  }

  function handleEditOpen() {
    setEditOpen(true)
    setGrantOpen(false)
    setOpen(false)
    loadEditMaterials()
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/admin/webinars/${webinar.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emoji: editEmoji,
        title: editTitle,
        slug: editSlug,
        short_desc: editShortDesc,
        full_desc: editFullDesc,
        price: Number(editPrice) || 0,
        content_type: editContentType,
        color_from: editColorFrom,
        color_to: editColorTo,
        is_published: editPublished,
        sort_order: Number(editSortOrder) || 0,
      }),
    })
    setSaving(false)
    if (!res.ok) { showToast('Ошибка сохранения'); return }
    const data = await res.json() as { webinar: WebinarRow }
    const updated = { ...webinar, ...data.webinar }
    setWebinar(updated)
    onUpdated(updated)
    setEditOpen(false)
    showToast('✅ Вебинар сохранён')
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
    <div style={{ background: '#fff', border: '1px solid #EDE8FF', borderRadius: 16, marginBottom: 12, overflow: 'hidden' }}>
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
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-unbounded)', color: '#3D2B8A' }}>{webinar.title}</p>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: webinar.content_type === 'course' ? '#F0EEFF' : '#E8F5E9', color: webinar.content_type === 'course' ? '#7C5CFC' : '#2D6A4F' }}>
              {webinar.content_type === 'course' ? 'КУРС' : 'ВЕБИНАР'}
            </span>
            {!webinar.is_published && (
              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#FFF3C0', color: '#5C4200', fontWeight: 600 }}>скрыт</span>
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
          onClick={handleEditOpen}
          style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #EDE8FF', background: editOpen ? '#7C5CFC' : '#F0EEFF', color: editOpen ? '#fff' : '#7C5CFC', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 40 }}
        >
          ✏️ Редактировать
        </button>
        <button
          onClick={handleToggle}
          style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #EDE8FF', background: open ? '#3D2B8A' : '#F0EEFF', color: open ? '#fff' : '#7C5CFC', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 40 }}
        >
          {open ? '▲ Скрыть уроки' : '▼ Управление уроками'}
        </button>
        <button
          onClick={() => { setGrantOpen(v => !v); setOpen(false); setEditOpen(false) }}
          style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#4CAF78', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 40 }}
        >
          Открыть доступ
        </button>
      </div>

      {/* Edit form */}
      {editOpen && (
        <div style={{ padding: '0 18px 18px' }}>
          <div style={{ background: '#FAF8FF', border: '1px solid #EDE8FF', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#7B6FAA', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Редактирование вебинара</p>

            {/* Row 1: emoji + title */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
              <div>
                <label style={LABEL_STYLE}>Эмодзи</label>
                <input type="text" value={editEmoji} onChange={e => setEditEmoji(e.target.value)} style={{ ...INPUT_STYLE, textAlign: 'center', fontSize: 20 }} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Название</label>
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Название вебинара" style={INPUT_STYLE} />
              </div>
            </div>

            {/* Row 2: slug + type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 8 }}>
              <div>
                <label style={LABEL_STYLE}>Slug (URL)</label>
                <input type="text" value={editSlug} onChange={e => setEditSlug(e.target.value)} placeholder="slug-vebinara" style={INPUT_STYLE} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Тип</label>
                <select value={editContentType} onChange={e => setEditContentType(e.target.value as 'webinar' | 'course')} style={{ ...INPUT_STYLE }}>
                  <option value="webinar">Вебинар</option>
                  <option value="course">Курс</option>
                </select>
              </div>
            </div>

            {/* Short desc */}
            <div>
              <label style={LABEL_STYLE}>Краткое описание</label>
              <input type="text" value={editShortDesc} onChange={e => setEditShortDesc(e.target.value)} placeholder="Одна строка" style={INPUT_STYLE} />
            </div>

            {/* Full desc */}
            <div>
              <label style={LABEL_STYLE}>Полное описание</label>
              <textarea value={editFullDesc} onChange={e => setEditFullDesc(e.target.value)} placeholder="Подробное описание" rows={4}
                style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 80 }} />
            </div>

            {/* Row: price + sort + published */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
              <div>
                <label style={LABEL_STYLE}>Цена (₽)</label>
                <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} style={INPUT_STYLE} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Порядок</label>
                <input type="number" value={editSortOrder} onChange={e => setEditSortOrder(e.target.value)} style={INPUT_STYLE} />
              </div>
              <div>
                <label style={{ ...LABEL_STYLE, marginBottom: 8 }}>Опубл.</label>
                <button
                  onClick={() => setEditPublished(v => !v)}
                  style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: editPublished ? '#4CAF78' : '#EDE8FF', color: editPublished ? '#fff' : '#7B6FAA', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 38, whiteSpace: 'nowrap' }}
                >
                  {editPublished ? '✅ Да' : '⬜ Нет'}
                </button>
              </div>
            </div>

            {/* Colors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={LABEL_STYLE}>Цвет от</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={editColorFrom} onChange={e => setEditColorFrom(e.target.value)} style={{ width: 40, height: 36, borderRadius: 8, border: '1px solid #EDE8FF', cursor: 'pointer', padding: 2 }} />
                  <input type="text" value={editColorFrom} onChange={e => setEditColorFrom(e.target.value)} style={{ ...INPUT_STYLE, flex: 1 }} />
                </div>
              </div>
              <div>
                <label style={LABEL_STYLE}>Цвет до</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={editColorTo} onChange={e => setEditColorTo(e.target.value)} style={{ width: 40, height: 36, borderRadius: 8, border: '1px solid #EDE8FF', cursor: 'pointer', padding: 2 }} />
                  <input type="text" value={editColorTo} onChange={e => setEditColorTo(e.target.value)} style={{ ...INPUT_STYLE, flex: 1 }} />
                </div>
              </div>
            </div>

            {/* PDF materials */}
            <div style={{ borderTop: '1px solid #EDE8FF', paddingTop: 12 }}>
              <p style={{ ...LABEL_STYLE, marginBottom: 8 }}>📎 PDF-материалы вебинара</p>
              {loadingMaterials && <p style={{ fontSize: 13, color: '#7B6FAA', margin: '0 0 8px' }}>Загружаю...</p>}
              {editMaterials.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: '#fff', border: '1px solid #EDE8FF', marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>📄</span>
                  <a href={m.url ?? '#'} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: 13, color: '#7C5CFC', textDecoration: 'none' }}>{m.title}</a>
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/admin/materials/${m.id}`, { method: 'DELETE' })
                      if (res.ok) { setEditMaterials(prev => prev.filter(x => x.id !== m.id)); showToast('Файл удалён') }
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#C0392B', padding: '2px 6px' }}
                  >✕</button>
                </div>
              ))}
              {!showPdfUpload ? (
                <button onClick={() => setShowPdfUpload(true)} style={{ fontSize: 12, color: '#7C5CFC', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontWeight: 600 }}>
                  📎 Прикрепить PDF
                </button>
              ) : (
                <DirectPdfUpload
                  storagePathPrefix={`webinars/${webinar.id}`}
                  saveUrl={`/api/admin/webinars/${webinar.id}/materials`}
                  onUploaded={mat => { setEditMaterials(prev => [...prev, mat]); setShowPdfUpload(false); showToast('✅ PDF прикреплён') }}
                  onCancel={() => setShowPdfUpload(false)}
                />
              )}
            </div>

            {/* Save / Cancel */}
            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              <button
                onClick={handleSave} disabled={saving || !editTitle.trim()}
                style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#4CAF78', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', minHeight: 44, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Сохраняю...' : '✅ Сохранить'}
              </button>
              <button onClick={() => setEditOpen(false)} style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid #EDE8FF', background: '#fff', color: '#7B6FAA', fontSize: 14, cursor: 'pointer', minHeight: 44 }}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div style={{ background: '#FAF8FF', border: '1px solid #EDE8FF', borderRadius: 14, padding: '14px' }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#7B6FAA', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Уроки</p>

            {loadingLessons && <p style={{ fontSize: 13, color: '#7B6FAA' }}>Загружаю...</p>}

            {lessons.map((lesson, idx) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                webinarId={webinar.id}
                index={idx}
                onUpdated={updated => setLessons(prev => prev.map(l => l.id === updated.id ? updated : l))}
                onDeleted={id => setLessons(prev => prev.filter(l => l.id !== id))}
                onMaterialAdded={(lessonId, mat) =>
                  setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, materials: [...l.materials, mat] } : l))
                }
                onMaterialDeleted={(lessonId, matId) =>
                  setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, materials: l.materials.filter(m => m.id !== matId) } : l))
                }
                showToast={showToast}
              />
            ))}

            {/* Add lesson form */}
            {!showAddLesson ? (
              <button onClick={() => setShowAddLesson(true)} style={{ fontSize: 13, color: '#7C5CFC', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontWeight: 600 }}>
                + Добавить урок
              </button>
            ) : (
              <div style={{ background: '#fff', border: '1px solid #EDE8FF', borderRadius: 12, padding: '12px 14px', marginTop: 4 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input type="text" placeholder="Название урока" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #EDE8FF', fontSize: 13, color: '#3D2B8A', background: '#FAF8FF', fontFamily: 'var(--font-nunito)', outline: 'none' }} />
                  <input type="text" placeholder="Ссылка на Kinescope (вставь — ID извлечётся автоматически)" value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #EDE8FF', fontSize: 13, color: '#3D2B8A', background: '#FAF8FF', fontFamily: 'var(--font-nunito)', outline: 'none' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleAddLesson} disabled={addingLesson || !newTitle.trim()}
                      style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: newTitle.trim() ? '#4CAF78' : '#C0B8D8', color: '#fff', fontSize: 13, fontWeight: 700, cursor: addingLesson || !newTitle.trim() ? 'not-allowed' : 'pointer', minHeight: 38 }}>
                      {addingLesson ? 'Добавляю...' : 'Сохранить'}
                    </button>
                    <button onClick={() => setShowAddLesson(false)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #EDE8FF', background: '#fff', color: '#7B6FAA', fontSize: 13, cursor: 'pointer', minHeight: 38 }}>Отмена</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

// ── Create webinar form ────────────────────────────────────────────────────

function CreateWebinarForm({
  onCreated,
  onCancel,
  showToast,
}: {
  onCreated: (w: WebinarAdmin) => void
  onCancel: () => void
  showToast: (msg: string) => void
}) {
  const [emoji, setEmoji] = useState('📹')
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [fullDesc, setFullDesc] = useState('')
  const [price, setPrice] = useState('0')
  const [contentType, setContentType] = useState<'webinar' | 'course'>('webinar')
  const [colorFrom, setColorFrom] = useState('#7C5CFC')
  const [colorTo, setColorTo] = useState('#5B3FA8')
  const [isPublished, setIsPublished] = useState(false)
  const [sortOrder, setSortOrder] = useState('0')
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!title.trim()) { showToast('Введите название'); return }
    setSaving(true)
    const res = await fetch('/api/admin/webinars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emoji, title, slug: slug.trim() || undefined,
        short_desc: shortDesc, full_desc: fullDesc,
        price: Number(price) || 0,
        content_type: contentType,
        color_from: colorFrom, color_to: colorTo,
        is_published: isPublished,
        sort_order: Number(sortOrder) || 0,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const e = await res.json().catch(() => ({})) as { error?: string }
      showToast(e.error ?? 'Ошибка создания')
      return
    }
    const data = await res.json() as { webinar: WebinarAdmin }
    onCreated(data.webinar)
    showToast('✅ Вебинар создан')
  }

  return (
    <div style={{ background: '#fff', border: '1.5px solid #7C5CFC', borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <p style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-unbounded)', color: '#3D2B8A' }}>
        Новый вебинар / курс
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* emoji + title */}
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
          <div>
            <label style={LABEL_STYLE}>Эмодзи</label>
            <input type="text" value={emoji} onChange={e => setEmoji(e.target.value)} style={{ ...INPUT_STYLE, textAlign: 'center', fontSize: 20 }} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Название *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Название вебинара" style={INPUT_STYLE} />
          </div>
        </div>

        {/* slug + type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 8 }}>
          <div>
            <label style={LABEL_STYLE}>Slug (URL, необязательно)</label>
            <input type="text" value={slug} onChange={e => setSlug(e.target.value)} placeholder="авто из названия" style={INPUT_STYLE} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Тип</label>
            <select value={contentType} onChange={e => setContentType(e.target.value as 'webinar' | 'course')} style={{ ...INPUT_STYLE }}>
              <option value="webinar">Вебинар</option>
              <option value="course">Курс</option>
            </select>
          </div>
        </div>

        {/* short desc */}
        <div>
          <label style={LABEL_STYLE}>Краткое описание</label>
          <input type="text" value={shortDesc} onChange={e => setShortDesc(e.target.value)} placeholder="Одна строка" style={INPUT_STYLE} />
        </div>

        {/* full desc */}
        <div>
          <label style={LABEL_STYLE}>Полное описание</label>
          <textarea value={fullDesc} onChange={e => setFullDesc(e.target.value)} placeholder="Подробное описание" rows={3}
            style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 70 }} />
        </div>

        {/* price + sort + published */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
          <div>
            <label style={LABEL_STYLE}>Цена (₽)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Порядок</label>
            <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={{ ...LABEL_STYLE, marginBottom: 8 }}>Опубл.</label>
            <button
              onClick={() => setIsPublished(v => !v)}
              style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: isPublished ? '#4CAF78' : '#EDE8FF', color: isPublished ? '#fff' : '#7B6FAA', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 38, whiteSpace: 'nowrap' }}
            >
              {isPublished ? '✅ Да' : '⬜ Нет'}
            </button>
          </div>
        </div>

        {/* colors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={LABEL_STYLE}>Цвет от</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={colorFrom} onChange={e => setColorFrom(e.target.value)} style={{ width: 40, height: 36, borderRadius: 8, border: '1px solid #EDE8FF', cursor: 'pointer', padding: 2 }} />
              <input type="text" value={colorFrom} onChange={e => setColorFrom(e.target.value)} style={{ ...INPUT_STYLE, flex: 1 }} />
            </div>
          </div>
          <div>
            <label style={LABEL_STYLE}>Цвет до</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={colorTo} onChange={e => setColorTo(e.target.value)} style={{ width: 40, height: 36, borderRadius: 8, border: '1px solid #EDE8FF', cursor: 'pointer', padding: 2 }} />
              <input type="text" value={colorTo} onChange={e => setColorTo(e.target.value)} style={{ ...INPUT_STYLE, flex: 1 }} />
            </div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: '#9B8FCC', margin: 0 }}>
          💡 После создания откройте вебинар для редактирования чтобы загрузить PDF-материалы
        </p>

        {/* buttons */}
        <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
          <button
            onClick={handleCreate} disabled={saving || !title.trim()}
            style={{ padding: '10px 22px', borderRadius: 12, border: 'none', background: '#7C5CFC', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving || !title.trim() ? 'not-allowed' : 'pointer', minHeight: 44, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Создаю...' : '+ Создать'}
          </button>
          <button onClick={onCancel} style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid #EDE8FF', background: '#fff', color: '#7B6FAA', fontSize: 14, cursor: 'pointer', minHeight: 44 }}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Selections tab ─────────────────────────────────────────────────────────

function SelectionsTab({
  selections,
  setSelections,
  showToast,
}: {
  selections: SelectionWithDetails[]
  setSelections: React.Dispatch<React.SetStateAction<SelectionWithDetails[]>>
  showToast: (msg: string) => void
}) {
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
        <div key={sel.id} style={{ background: '#fff', border: '1px solid #EDE8FF', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>{sel.webinar?.emoji ?? '📹'}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#3D2B8A' }}>{sel.webinar?.title ?? 'Неизвестный вебинар'}</p>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: '#7B6FAA' }}>Участница: <span style={{ color: '#3D2B8A', fontWeight: 600 }}>{sel.member?.full_name ?? '—'}</span></p>
              <p style={{ margin: '0 0 2px', fontSize: 13, color: '#7B6FAA' }}>Email: {sel.member?.email ?? '—'}</p>
              <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9B8FCC' }}>Запрос: {formatDate(sel.selected_at)}</p>
              <button
                onClick={() => handleGrant(sel)} disabled={grantingId === sel.id}
                style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#4CAF78', color: '#fff', fontSize: 14, fontWeight: 700, cursor: grantingId === sel.id ? 'not-allowed' : 'pointer', minHeight: 44, opacity: grantingId === sel.id ? 0.7 : 1, transition: 'opacity 0.2s' }}
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
  const [webinars, setWebinars] = useState(initialWebinars)
  const [toast, setToast] = useState('')
  const [selections, setSelections] = useState(initialSelections)
  const [showCreate, setShowCreate] = useState(false)

  const pendingCount = selections.length

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const refreshSelections = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/webinar-selections')
      if (!res.ok) return
      const data = await res.json()
      setSelections(data.selections ?? [])
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(refreshSelections, 30_000)
    return () => clearInterval(interval)
  }, [refreshSelections])

  return (
    <div>
      {toast && <Toast msg={toast} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <a href="/admin" style={{ fontSize: 13, color: '#7B6FAA', textDecoration: 'none', padding: '8px 12px', borderRadius: 10, background: '#F0EEFF' }}>
          ← Назад
        </a>
        <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, color: '#3D2B8A', margin: 0, flex: 1 }}>
          Вебинары
        </h1>
        {tab === 'webinars' && (
          <button
            onClick={() => setShowCreate(v => !v)}
            style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: showCreate ? '#3D2B8A' : '#7C5CFC', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}
          >
            {showCreate ? '✕ Отмена' : '+ Загрузить новый вебинар'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setTab('webinars')}
          style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: tab === 'webinars' ? '#7C5CFC' : '#F0EEFF', color: tab === 'webinars' ? '#fff' : '#7C5CFC', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}
        >
          📋 Вебинары и курсы
        </button>
        <button
          onClick={() => setTab('pending')}
          style={{ padding: '10px 18px', borderRadius: 12, border: 'none', background: tab === 'pending' ? '#7C5CFC' : '#F0EEFF', color: tab === 'pending' ? '#fff' : '#7C5CFC', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          ⏳ Ожидают подтверждения
          {pendingCount > 0 && (
            <span style={{ background: '#FFD93D', color: '#5C4200', fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      {tab === 'webinars' ? (
        <div>
          {showCreate && (
            <CreateWebinarForm
              onCreated={w => { setWebinars(prev => [w, ...prev]); setShowCreate(false) }}
              onCancel={() => setShowCreate(false)}
              showToast={showToast}
            />
          )}
          {webinars.length === 0 && !showCreate ? (
            <p style={{ color: '#7B6FAA', fontSize: 14 }}>Вебинаров пока нет</p>
          ) : (
            webinars.map(w => (
              <WebinarCard
                key={w.id}
                webinar={w}
                onUpdated={updated => setWebinars(prev => prev.map(x => x.id === updated.id ? updated : x))}
                showToast={showToast}
              />
            ))
          )}
        </div>
      ) : (
        <SelectionsTab
          selections={selections}
          setSelections={setSelections}
          showToast={showToast}
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
