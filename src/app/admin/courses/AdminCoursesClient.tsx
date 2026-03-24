'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Material {
  id: string
  title: string
  url: string
  sort_order: number
}

interface Lesson {
  id: string
  sort_order: number
  title: string
  lesson_type: 'video' | 'text'
  video_url: string | null
  bonus_video_url: string | null
  text_content: string | null
  is_visible: boolean
  intro_lesson_materials: Material[]
}

interface Course {
  id: string
  slug: string
  title: string
  description: string | null
  sort_order: number
  intro_lessons: Lesson[]
}

// ── Helpers ────────────────────────────────────────────
function slugify(str: string): string {
  return str.toLowerCase()
    .replace(/[а-яё]/g, c => {
      const map: Record<string, string> = {
        а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'j',
        к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
        х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
      }
      return map[c] ?? c
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const INPUT = {
  padding: '8px 10px', borderRadius: 8, fontSize: 13,
  border: '1px solid #DDD5FF', outline: 'none',
  fontFamily: 'var(--font-nunito)', color: 'var(--text)',
  background: '#fff', boxSizing: 'border-box' as const, width: '100%',
}

const BTN_PUR = {
  padding: '9px 18px', background: 'var(--pur)', color: '#fff',
  border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'var(--font-nunito)',
}

const BTN_RED = {
  padding: '5px 10px', background: '#FFF0F0', color: '#C0392B',
  border: '1px solid #FFD0D0', borderRadius: 8, fontSize: 11, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'var(--font-nunito)',
}

const BTN_GHOST = {
  padding: '5px 10px', background: '#F0F0F0', color: '#555',
  border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'var(--font-nunito)',
}

// ── LessonEditor ───────────────────────────────────────
function LessonEditor({ lesson, isFirst, isLast, onUpdate, onDelete, onMoveUp, onMoveDown }: {
  lesson: Lesson
  isFirst: boolean
  isLast: boolean
  onUpdate: (updated: Lesson) => void
  onDelete: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [title, setTitle] = useState(lesson.title)
  const [videoUrl, setVideoUrl] = useState(lesson.video_url ?? '')
  const [bonusUrl, setBonusUrl] = useState(lesson.bonus_video_url ?? '')
  const [textContent, setTextContent] = useState(lesson.text_content ?? '')
  const [visible, setVisible] = useState(lesson.is_visible)
  const [materials, setMaterials] = useState<Material[]>(lesson.intro_lesson_materials ?? [])
  const [newMatTitle, setNewMatTitle] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'done'>('idle')
  const [addingMat, setAddingMat] = useState(false)
  const [matError, setMatError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function saveLesson(overrides?: Record<string, unknown>) {
    setSaving(true)
    setSaveError('')
    const body: Record<string, unknown> = { title, is_visible: visible, ...overrides }
    if (lesson.lesson_type === 'video') {
      body.video_url = videoUrl
      body.bonus_video_url = bonusUrl
    } else {
      body.text_content = textContent
    }
    try {
      const res = await fetch(`/api/admin/intro-lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        onUpdate({
          ...lesson,
          title,
          video_url: videoUrl || null,
          bonus_video_url: bonusUrl || null,
          text_content: textContent || null,
          is_visible: (overrides?.is_visible ?? visible) as boolean,
        })
      } else {
        const d = await res.json().catch(() => ({})) as { error?: string }
        setSaveError(d.error ?? `Ошибка ${res.status}`)
      }
    } catch {
      setSaveError('Сетевая ошибка')
    } finally {
      setSaving(false)
    }
  }

  async function toggleVisible() {
    const next = !visible
    setVisible(next)
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`/api/admin/intro-lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_visible: next }),
      })
      if (res.ok) {
        onUpdate({ ...lesson, is_visible: next })
      } else {
        setVisible(!next)
        const d = await res.json().catch(() => ({})) as { error?: string }
        setSaveError(d.error ?? `Ошибка ${res.status}`)
      }
    } catch {
      setVisible(!next)
      setSaveError('Сетевая ошибка')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/intro-lessons/${lesson.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete(lesson.id)
      } else {
        const d = await res.json().catch(() => ({})) as { error?: string }
        setSaveError(d.error ?? `Ошибка удаления ${res.status}`)
        setConfirmDelete(false)
      }
    } catch {
      setSaveError('Сетевая ошибка')
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  async function addMaterial(file: File) {
    const t = newMatTitle.trim() || file.name.replace(/\.pdf$/i, '')
    setAddingMat(true)
    setMatError('')
    setUploadProgress('uploading')
    try {
      const supabase = createClient()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `intro-courses/${lesson.id}/${Date.now()}_${safeName}`

      const { error: upErr } = await supabase.storage
        .from('webinar-materials')
        .upload(path, file, { contentType: 'application/pdf', upsert: true })

      if (upErr) throw new Error(upErr.message)

      const { data: { publicUrl } } = supabase.storage.from('webinar-materials').getPublicUrl(path)
      setUploadProgress('done')

      const res = await fetch(`/api/admin/intro-lessons/${lesson.id}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t, url: publicUrl }),
      })
      const data = await res.json().catch(() => ({})) as { material?: Material; error?: string }
      if (res.ok && data.material) {
        setMaterials(prev => [...prev, data.material!])
        setNewMatTitle('')
        setPendingFile(null)
        setUploadProgress('idle')
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        setMatError(data.error ?? `Ошибка сохранения ${res.status}`)
        setUploadProgress('idle')
      }
    } catch (e) {
      console.error('addMaterial error:', e)
      setMatError(e instanceof Error ? e.message : 'Ошибка загрузки')
      setUploadProgress('idle')
    } finally {
      setAddingMat(false)
    }
  }

  async function deleteMaterial(matId: string) {
    try {
      const res = await fetch(`/api/admin/intro-materials/${matId}`, { method: 'DELETE' })
      if (res.ok) setMaterials(prev => prev.filter(m => m.id !== matId))
      else {
        const d = await res.json().catch(() => ({})) as { error?: string }
        setMatError(d.error ?? `Ошибка удаления`)
      }
    } catch {
      setMatError('Сетевая ошибка при удалении')
    }
  }

  const isDirty =
    title !== lesson.title ||
    (lesson.lesson_type === 'video' && (videoUrl !== (lesson.video_url ?? '') || bonusUrl !== (lesson.bonus_video_url ?? ''))) ||
    (lesson.lesson_type === 'text' && textContent !== (lesson.text_content ?? ''))

  return (
    <div style={{
      border: '1px solid #EDE8FF', borderRadius: 12, overflow: 'hidden',
      opacity: visible ? 1 : 0.6,
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
        background: expanded ? '#F8F5FF' : '#fff',
      }}>
        {/* Sort buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
          <button
            onClick={() => onMoveUp(lesson.id)}
            disabled={isFirst}
            title="Выше"
            style={{ ...BTN_GHOST, padding: '1px 6px', fontSize: 10, opacity: isFirst ? 0.3 : 1 }}
          >▲</button>
          <button
            onClick={() => onMoveDown(lesson.id)}
            disabled={isLast}
            title="Ниже"
            style={{ ...BTN_GHOST, padding: '1px 6px', fontSize: 10, opacity: isLast ? 0.3 : 1 }}
          >▼</button>
        </div>

        <div
          onClick={() => setExpanded(!expanded)}
          style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <div style={{
            width: 26, height: 26, borderRadius: 8, flexShrink: 0,
            background: visible ? 'var(--pur-lt)' : '#F0F0F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: visible ? 'var(--pur)' : '#999',
          }}>
            {lesson.sort_order}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{lesson.title}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 0' }}>
              {lesson.lesson_type === 'video' ? '🎥 Видеоурок' : '📝 Текстовый'}
              {!visible && ' · скрыт'}
              {materials.length > 0 && ` · ${materials.length} PDF`}
            </p>
          </div>
          <span style={{ fontSize: 13, color: 'var(--pale)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '14px', borderTop: '1px solid #EDE8FF', background: '#FAFAFF' }}>

          {/* Title */}
          <label style={{ display: 'block', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Название урока</span>
            <input value={title} onChange={e => setTitle(e.target.value)} style={INPUT} />
          </label>

          {/* Video fields */}
          {lesson.lesson_type === 'video' && (
            <>
              <label style={{ display: 'block', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Kinescope URL (основное видео)</span>
                <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://kinescope.io/VIDEO_ID" style={INPUT} />
              </label>
              <label style={{ display: 'block', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Kinescope URL (бонус, необязательно)</span>
                <input value={bonusUrl} onChange={e => setBonusUrl(e.target.value)} placeholder="https://kinescope.io/VIDEO_ID" style={INPUT} />
              </label>
            </>
          )}

          {/* Text content */}
          {lesson.lesson_type === 'text' && (
            <label style={{ display: 'block', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Текст урока</span>
              <textarea
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                rows={8}
                style={{ ...INPUT, resize: 'vertical', lineHeight: 1.6 }}
              />
            </label>
          )}

          {/* Visibility */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={visible}
              onChange={toggleVisible}
              disabled={saving}
              style={{ width: 16, height: 16, accentColor: 'var(--pur)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
              Урок виден участницам
              {saving && <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 6 }}>сохраняю...</span>}
            </span>
          </label>

          {/* Save / error */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            {isDirty && (
              <button onClick={() => saveLesson()} disabled={saving} style={{ ...BTN_PUR, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Сохраняю...' : '💾 Сохранить'}
              </button>
            )}
            {/* Delete */}
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} style={BTN_RED}>🗑 Удалить урок</button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#C0392B', fontWeight: 600 }}>Удалить урок?</span>
                <button onClick={handleDelete} disabled={deleting} style={{ ...BTN_RED, background: '#C0392B', color: '#fff' }}>
                  {deleting ? '...' : 'Да'}
                </button>
                <button onClick={() => setConfirmDelete(false)} style={BTN_GHOST}>Нет</button>
              </div>
            )}
          </div>

          {saveError && (
            <p style={{ fontSize: 12, color: '#C0392B', margin: '0 0 10px', background: '#FFF0F0', padding: '6px 10px', borderRadius: 8 }}>
              ❌ {saveError}
            </p>
          )}

          {/* Materials */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #DDD5FF' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              PDF-материалы
            </p>
            {materials.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--pale)', marginBottom: 8 }}>Нет материалов</p>
            )}
            {materials.map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                padding: '8px 10px', background: '#FFF5E8', border: '1px solid #FFD4A0', borderRadius: 8,
              }}>
                <span style={{ fontSize: 16 }}>📄</span>
                <a href={m.url} target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#8B4A00', textDecoration: 'none' }}>
                  {m.title}
                </a>
                <button onClick={() => deleteMaterial(m.id)} style={BTN_RED}>Удалить</button>
              </div>
            ))}

            {/* Add material */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {matError && (
                <p style={{ fontSize: 12, color: '#C0392B', margin: 0, background: '#FFF0F0', padding: '6px 10px', borderRadius: 8 }}>
                  ❌ {matError}
                </p>
              )}

              <input
                value={newMatTitle}
                onChange={e => { setNewMatTitle(e.target.value); setMatError('') }}
                placeholder="Название (если пусто — возьмётся из имени файла)"
                style={{ ...INPUT, fontSize: 12 }}
              />

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) { setPendingFile(f); setMatError('') }
                }}
              />

              {/* File pick button or selected file */}
              {!pendingFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={addingMat}
                  style={{
                    padding: '8px 14px', background: '#fff', color: 'var(--pur)',
                    border: '2px dashed var(--pur-br)', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'var(--font-nunito)', textAlign: 'left' as const,
                  }}
                >
                  📎 Выбрать PDF с компьютера
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#FFF5E8', border: '1px solid #FFD4A0', borderRadius: 8 }}>
                  <span style={{ fontSize: 16 }}>📄</span>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#8B4A00', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pendingFile.name}
                  </span>
                  {!addingMat && (
                    <button
                      type="button"
                      onClick={() => { setPendingFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#999', padding: '0 2px' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              {/* Upload button */}
              {pendingFile && (
                <button
                  type="button"
                  onClick={() => addMaterial(pendingFile)}
                  disabled={addingMat}
                  style={{ ...BTN_GHOST, background: '#FF9F43', color: '#fff', alignSelf: 'flex-start', opacity: addingMat ? 0.7 : 1 }}
                >
                  {uploadProgress === 'uploading' ? '⏳ Загружаю...' : uploadProgress === 'done' ? '✓ Сохраняю...' : '⬆ Загрузить'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── AddLessonForm ──────────────────────────────────────
function AddLessonForm({ courseId, nextOrder, onAdded, onCancel }: {
  courseId: string
  nextOrder: number
  onAdded: (lesson: Lesson) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'video' | 'text'>('video')
  const [videoUrl, setVideoUrl] = useState('')
  const [textContent, setTextContent] = useState('')
  const [sortOrder, setSortOrder] = useState(String(nextOrder))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!title.trim()) { setError('Введи название'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/intro-courses/${courseId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          lesson_type: type,
          video_url: type === 'video' ? videoUrl : undefined,
          text_content: type === 'text' ? textContent : undefined,
          sort_order: parseInt(sortOrder) || nextOrder,
        }),
      })
      const data = await res.json().catch(() => ({})) as { lesson?: Lesson; error?: string }
      if (res.ok && data.lesson) {
        onAdded(data.lesson)
      } else {
        setError(data.error ?? `Ошибка ${res.status}`)
      }
    } catch {
      setError('Сетевая ошибка')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ border: '2px dashed #A78BFA', borderRadius: 12, padding: 14, background: '#FAFAFF' }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--pur)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Новый урок
      </p>

      {error && (
        <p style={{ fontSize: 12, color: '#C0392B', background: '#FFF0F0', padding: '6px 10px', borderRadius: 8, marginBottom: 10 }}>❌ {error}</p>
      )}

      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Название</span>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Название урока" style={INPUT} autoFocus />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        {(['video', 'text'] as const).map(t => (
          <button
            key={t}
            onClick={() => setType(t)}
            style={{
              padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              border: `2px solid ${type === t ? 'var(--pur)' : '#DDD5FF'}`,
              background: type === t ? 'var(--pur-lt)' : '#fff',
              color: type === t ? 'var(--pur)' : 'var(--muted)',
              cursor: 'pointer', fontFamily: 'var(--font-nunito)',
            }}
          >
            {t === 'video' ? '🎥 Видео' : '📝 Текст'}
          </button>
        ))}
      </div>

      {type === 'video' && (
        <label style={{ display: 'block', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Kinescope URL</span>
          <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://kinescope.io/VIDEO_ID" style={INPUT} />
        </label>
      )}

      {type === 'text' && (
        <label style={{ display: 'block', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Текст урока</span>
          <textarea
            value={textContent}
            onChange={e => setTextContent(e.target.value)}
            rows={5}
            style={{ ...INPUT, resize: 'vertical' }}
          />
        </label>
      )}

      <label style={{ display: 'block', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Порядок (sort_order)</span>
        <input
          type="number"
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value)}
          style={{ ...INPUT, width: 80 }}
        />
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={submit} disabled={saving} style={{ ...BTN_PUR, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Создаю...' : '+ Добавить урок'}
        </button>
        <button onClick={onCancel} style={BTN_GHOST}>Отмена</button>
      </div>
    </div>
  )
}

// ── CourseSection ──────────────────────────────────────
function CourseSection({ course, onDelete }: {
  course: Course
  onDelete: (id: string) => void
}) {
  const [lessons, setLessons] = useState<Lesson[]>(
    [...(course.intro_lessons ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  )
  const [showAddLesson, setShowAddLesson] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  function handleLessonUpdate(updated: Lesson) {
    setLessons(prev => prev.map(l => l.id === updated.id ? { ...l, ...updated } : l))
  }

  function handleLessonDelete(id: string) {
    setLessons(prev => prev.filter(l => l.id !== id))
  }

  async function handleMoveUp(id: string) {
    const idx = lessons.findIndex(l => l.id === id)
    if (idx <= 0) return
    await swapLessons(idx, idx - 1)
  }

  async function handleMoveDown(id: string) {
    const idx = lessons.findIndex(l => l.id === id)
    if (idx < 0 || idx >= lessons.length - 1) return
    await swapLessons(idx, idx + 1)
  }

  async function swapLessons(i: number, j: number) {
    const a = lessons[i]
    const b = lessons[j]
    const newOrder = [...lessons]
    newOrder[i] = { ...a, sort_order: b.sort_order }
    newOrder[j] = { ...b, sort_order: a.sort_order }
    setLessons([...newOrder].sort((x, y) => x.sort_order - y.sort_order))
    // Patch both
    await Promise.all([
      fetch(`/api/admin/intro-lessons/${a.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: b.sort_order }),
      }),
      fetch(`/api/admin/intro-lessons/${b.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: a.sort_order }),
      }),
    ])
  }

  async function handleDeleteCourse() {
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch(`/api/admin/intro-courses/${course.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDelete(course.id)
      } else {
        const d = await res.json().catch(() => ({})) as { error?: string }
        setDeleteError(d.error ?? `Ошибка ${res.status}`)
        setConfirmDelete(false)
      }
    } catch {
      setDeleteError('Сетевая ошибка')
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  const nextOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.sort_order)) + 1 : 1

  return (
    <div style={{ background: '#fff', border: '1px solid #EDE8FF', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
      {/* Course header */}
      <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, var(--pur) 0%, #9B7BFF 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
              {course.title}
            </p>
            {course.description && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', margin: 0 }}>{course.description}</p>
            )}
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '6px 0 0' }}>
              slug: {course.slug} · {lessons.length} уроков
            </p>
          </div>
          {/* Delete course */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
            >
              🗑 Удалить курс
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{ fontSize: 11, color: '#FFD0D0', fontWeight: 700 }}>Удалить курс и все уроки?</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleDeleteCourse}
                  disabled={deleting}
                  style={{ background: '#C0392B', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                >
                  {deleting ? '...' : 'Да, удалить'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}
                >
                  Нет
                </button>
              </div>
            </div>
          )}
        </div>
        {deleteError && (
          <p style={{ fontSize: 11, color: '#FFD0D0', margin: '8px 0 0' }}>❌ {deleteError}</p>
        )}
      </div>

      {/* Lessons */}
      <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lessons.map((l, idx) => (
          <LessonEditor
            key={l.id}
            lesson={l}
            isFirst={idx === 0}
            isLast={idx === lessons.length - 1}
            onUpdate={handleLessonUpdate}
            onDelete={handleLessonDelete}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        ))}
        {lessons.length === 0 && !showAddLesson && (
          <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>Уроков пока нет</p>
        )}

        {showAddLesson ? (
          <AddLessonForm
            courseId={course.id}
            nextOrder={nextOrder}
            onAdded={lesson => {
              setLessons(prev => [...prev, lesson].sort((a, b) => a.sort_order - b.sort_order))
              setShowAddLesson(false)
            }}
            onCancel={() => setShowAddLesson(false)}
          />
        ) : (
          <button
            onClick={() => setShowAddLesson(true)}
            style={{
              padding: '9px', border: '2px dashed #A78BFA', borderRadius: 10,
              background: 'transparent', color: 'var(--pur)', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font-nunito)',
            }}
          >
            + Добавить урок
          </button>
        )}
      </div>
    </div>
  )
}

// ── AddCourseForm ──────────────────────────────────────
function AddCourseForm({ onAdded, onCancel }: {
  onAdded: (course: Course) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleTitleChange(v: string) {
    setTitle(v)
    if (!slugEdited) setSlug(slugify(v))
  }

  async function submit() {
    if (!title.trim() || !slug.trim()) { setError('Введи название и slug'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/intro-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null, slug: slug.trim() }),
      })
      const data = await res.json().catch(() => ({})) as { course?: Course; error?: string }
      if (res.ok && data.course) {
        onAdded(data.course)
      } else {
        setError(data.error ?? `Ошибка ${res.status}`)
      }
    } catch {
      setError('Сетевая ошибка')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ border: '2px solid var(--pur)', borderRadius: 16, padding: 20, background: 'var(--pur-lt)', marginBottom: 24 }}>
      <p style={{ fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 800, color: 'var(--pur)', margin: '0 0 16px' }}>
        Новый курс
      </p>

      {error && (
        <p style={{ fontSize: 12, color: '#C0392B', background: '#FFF0F0', padding: '6px 10px', borderRadius: 8, marginBottom: 12 }}>❌ {error}</p>
      )}

      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Название курса</span>
        <input
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          placeholder="Например: Основы питания"
          style={INPUT}
          autoFocus
        />
      </label>

      <label style={{ display: 'block', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>
          Slug (латиницей, уникальный)
        </span>
        <input
          value={slug}
          onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
          placeholder="osnovy-pitaniya"
          style={INPUT}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Описание (необязательно)</span>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          style={{ ...INPUT, resize: 'none' }}
          placeholder="Краткое описание курса"
        />
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={submit} disabled={saving} style={{ ...BTN_PUR, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Создаю...' : '✓ Создать курс'}
        </button>
        <button onClick={onCancel} style={BTN_GHOST}>Отмена</button>
      </div>
    </div>
  )
}

// ── AdminCoursesClient ─────────────────────────────────
export default function AdminCoursesClient() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddCourse, setShowAddCourse] = useState(false)

  useEffect(() => {
    fetch('/api/admin/intro-courses')
      .then(r => r.json())
      .then((d: { courses?: Course[]; error?: string }) => {
        if (d.error) setError(d.error)
        else if (Array.isArray(d.courses)) setCourses(d.courses)
        else setError('Неожиданный ответ API')
      })
      .catch(() => setError('Ошибка запроса к API'))
      .finally(() => setLoading(false))
  }, [])

  function handleCourseDelete(id: string) {
    setCourses(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 60px', fontFamily: 'var(--font-nunito)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <Link
          href="/admin"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--muted)', textDecoration: 'none',
            padding: '8px 12px', borderRadius: 10, background: '#F0EEFF',
          }}
        >
          ← Панель
        </Link>
        <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0, flex: 1 }}>
          Курсы
        </h1>
        <button
          onClick={() => setShowAddCourse(v => !v)}
          style={{ ...BTN_PUR, padding: '8px 14px', fontSize: 12 }}
        >
          {showAddCourse ? '✕ Отмена' : '+ Добавить курс'}
        </button>
      </div>

      {showAddCourse && (
        <AddCourseForm
          onAdded={course => { setCourses(prev => [...prev, course]); setShowAddCourse(false) }}
          onCancel={() => setShowAddCourse(false)}
        />
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: 14 }}>Загружаю...</div>
      )}

      {!loading && error && (
        <div style={{ background: '#FFF0F0', border: '2px solid #FFD0D0', borderRadius: 14, padding: '16px', marginBottom: 24, fontSize: 13, color: '#C0392B' }}>
          {error}
        </div>
      )}

      {!loading && courses.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: 14 }}>
          Курсов пока нет. Нажми «+ Добавить курс».
        </div>
      )}

      {courses.map(c => (
        <CourseSection key={c.id} course={c} onDelete={handleCourseDelete} />
      ))}
    </div>
  )
}
