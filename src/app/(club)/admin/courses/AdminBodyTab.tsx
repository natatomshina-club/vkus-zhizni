'use client'

import { useState, useEffect, useRef } from 'react'
import SimpleEditor from './SimpleEditor'

interface Attachment { name: string; url: string }

interface BodyMaterial {
  id: string
  title: string
  description: string | null
  format: string
  content_url: string | null
  video_urls: string[] | null
  thumbnail_url: string | null
  duration_label: string | null
  sort_order: number
  is_published: boolean
  views_count: number
  attachments: Attachment[] | null
}

interface BodySection {
  id: string
  title: string
  emoji: string
  sort_order: number
  is_active: boolean
  body_materials: BodyMaterial[]
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
  cursor: 'pointer', fontFamily: 'var(--font-nunito)', whiteSpace: 'nowrap',
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

const EMPTY_MAT = {
  title: '', description: '', format: 'video', content_url: '',
  duration_label: '', sort_order: 0, is_published: true,
}

export default function AdminBodyTab() {
  const [sections, setSections] = useState<BodySection[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Section form
  const [newSectEmoji, setNewSectEmoji] = useState('📁')
  const [newSectTitle, setNewSectTitle] = useState('')
  const [addingSect, setAddingSect] = useState(false)
  const [sectSaving, setSectSaving] = useState(false)

  // Edit section
  const [editingSectId, setEditingSectId] = useState<string | null>(null)
  const [editSectEmoji, setEditSectEmoji] = useState('')
  const [editSectTitle, setEditSectTitle] = useState('')

  // Material form
  const [showMatForm, setShowMatForm] = useState(false)
  const [editingMat, setEditingMat] = useState<BodyMaterial | null>(null)
  const [matForm, setMatForm] = useState({ ...EMPTY_MAT })
  const [matSaving, setMatSaving] = useState(false)
  const [matError, setMatError] = useState('')

  // Video URLs (multiple)
  const [videoUrls, setVideoUrls] = useState<string[]>([])

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const attachRef = useRef<HTMLInputElement>(null)
  const [attachUploading, setAttachUploading] = useState(false)

  // Content file upload (pdf/audio)
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileUploading, setFileUploading] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/body/sections')
    if (res.ok) {
      const { sections: data } = await res.json() as { sections: BodySection[] }
      setSections(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const selected = sections.find(s => s.id === selectedId) ?? null
  const materials = selected
    ? [...(selected.body_materials ?? [])].sort((a, b) => a.sort_order - b.sort_order)
    : []

  // ── Section actions ────────────────────────────────────

  async function addSection() {
    if (!newSectTitle.trim()) return
    setSectSaving(true)
    await fetch('/api/admin/body/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newSectTitle.trim(), emoji: newSectEmoji, sort_order: sections.length }),
    })
    setNewSectTitle('')
    setNewSectEmoji('📁')
    setAddingSect(false)
    setSectSaving(false)
    await load()
  }

  async function saveEditSection() {
    if (!editingSectId) return
    setSectSaving(true)
    await fetch(`/api/admin/body/sections/${editingSectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editSectTitle.trim(), emoji: editSectEmoji }),
    })
    setEditingSectId(null)
    setSectSaving(false)
    await load()
  }

  async function deleteSection(id: string, title: string) {
    if (!confirm(`Удалить раздел «${title}» и все его материалы?`)) return
    await fetch(`/api/admin/body/sections/${id}`, { method: 'DELETE' })
    if (selectedId === id) setSelectedId(null)
    await load()
  }

  async function moveSection(id: string, dir: 'up' | 'down') {
    const idx = sections.findIndex(s => s.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === sections.length - 1) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    const a = sections[idx], b = sections[swapIdx]
    await Promise.all([
      fetch(`/api/admin/body/sections/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: b.sort_order }) }),
      fetch(`/api/admin/body/sections/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: a.sort_order }) }),
    ])
    await load()
  }

  // ── Material actions ───────────────────────────────────

  function openAddMat() {
    setEditingMat(null)
    setMatForm({ ...EMPTY_MAT, sort_order: materials.length })
    setAttachments([])
    setVideoUrls([])
    setMatError('')
    setShowMatForm(true)
  }

  function openEditMat(m: BodyMaterial) {
    setEditingMat(m)
    setMatForm({
      title: m.title, description: m.description ?? '', format: m.format,
      content_url: m.content_url ?? '',
      duration_label: m.duration_label ?? '', sort_order: m.sort_order,
      is_published: m.is_published,
    })
    setAttachments(m.attachments ?? [])
    setVideoUrls(m.video_urls ?? [])
    setMatError('')
    setShowMatForm(true)
  }

  async function saveMat() {
    if (!matForm.title.trim()) { setMatError('Введите заголовок'); return }
    if (!selectedId) return
    setMatSaving(true)
    setMatError('')

    const body = {
      title: matForm.title.trim(),
      description: matForm.description || null,
      format: matForm.format,
      content_url: matForm.content_url || null,
      video_urls: matForm.format === 'video' ? videoUrls.filter(u => u.trim() !== '') : [],
      duration_label: matForm.duration_label || null,
      sort_order: Number(matForm.sort_order) || 0,
      is_published: matForm.is_published,
      attachments: attachments.length > 0 ? attachments : [],
    }

    if (editingMat) {
      await fetch(`/api/admin/body/materials/${editingMat.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
    } else {
      await fetch('/api/admin/body/materials', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, section_id: selectedId }),
      })
    }

    setMatSaving(false)
    setShowMatForm(false)
    await load()
  }

  async function deleteMat(m: BodyMaterial) {
    if (!confirm(`Удалить материал «${m.title}»?`)) return
    await fetch(`/api/admin/body/materials/${m.id}`, { method: 'DELETE' })
    await load()
  }

  async function moveMat(id: string, dir: 'up' | 'down') {
    const idx = materials.findIndex(m => m.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === materials.length - 1) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    const a = materials[idx], b = materials[swapIdx]
    await Promise.all([
      fetch(`/api/admin/body/materials/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: b.sort_order }) }),
      fetch(`/api/admin/body/materials/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sort_order: a.sort_order }) }),
    ])
    await load()
  }

  // ── Upload helpers ─────────────────────────────────────

  async function uploadContentFile(file: File) {
    if (file.size > 10 * 1024 * 1024) { alert('Файл слишком большой. Максимум 10 МБ'); return }
    setFileUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'files')
      const res = await fetch('/api/admin/body/upload', { method: 'POST', body: fd })
      const json = await res.json() as { url?: string; error?: string }
      if (!res.ok || json.error) {
        alert('Ошибка загрузки: ' + (json.error ?? res.status))
      } else {
        setMatForm(f => ({ ...f, content_url: json.url! }))
      }
    } catch (e) {
      alert('Ошибка: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setFileUploading(false)
    }
  }

  async function uploadAttachment(file: File) {
    if (file.size > 10 * 1024 * 1024) { alert('Файл слишком большой. Максимум 10 МБ'); return }
    setAttachUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/body/upload', { method: 'POST', body: fd })
      const json = await res.json() as { url?: string; name?: string; error?: string }
      if (!res.ok || json.error) {
        alert('Ошибка загрузки: ' + (json.error ?? res.status))
      } else {
        setAttachments(prev => [...prev, { name: json.name ?? file.name, url: json.url! }])
      }
    } catch (e) {
      alert('Ошибка: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setAttachUploading(false)
      if (attachRef.current) attachRef.current.value = ''
    }
  }

  if (loading) return <p style={{ color: 'var(--muted)', fontSize: 14 }}>Загрузка…</p>

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

      {/* ── Left: sections ── */}
      <div style={{ width: 260, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', margin: 0 }}>Разделы</p>
          <button onClick={() => { setAddingSect(true); setNewSectTitle(''); setNewSectEmoji('📁') }} style={BTN_PUR}>
            + Раздел
          </button>
        </div>

        {addingSect && (
          <div style={{ background: '#F9F8FF', border: '1px solid #DDD5FF', borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input value={newSectEmoji} onChange={e => setNewSectEmoji(e.target.value)} style={{ ...INPUT, width: 50, textAlign: 'center', fontSize: 18 }} maxLength={4} />
              <input value={newSectTitle} onChange={e => setNewSectTitle(e.target.value)} placeholder="Название раздела" style={INPUT} autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={addSection} disabled={sectSaving || !newSectTitle.trim()} style={BTN_PUR}>
                {sectSaving ? '…' : 'Сохранить'}
              </button>
              <button onClick={() => setAddingSect(false)} style={BTN_GHOST}>Отмена</button>
            </div>
          </div>
        )}

        {sections.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Нет разделов. Добавьте первый.</p>
        )}

        {sections.map((s, idx) => (
          <div
            key={s.id}
            onClick={() => { setSelectedId(s.id); setShowMatForm(false) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 12, cursor: 'pointer', marginBottom: 4,
              background: selectedId === s.id ? 'var(--pur-lt)' : '#fff',
              border: `1.5px solid ${selectedId === s.id ? 'var(--pur-br)' : 'var(--border)'}`,
            }}
          >
            {editingSectId === s.id ? (
              <div style={{ flex: 1, display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                <input value={editSectEmoji} onChange={e => setEditSectEmoji(e.target.value)} style={{ ...INPUT, width: 44, textAlign: 'center', padding: '4px 6px' }} maxLength={4} />
                <input value={editSectTitle} onChange={e => setEditSectTitle(e.target.value)} style={{ ...INPUT, padding: '4px 8px', fontSize: 12 }} />
                <button onClick={saveEditSection} style={{ ...BTN_PUR, padding: '4px 8px', fontSize: 11 }}>✓</button>
                <button onClick={() => setEditingSectId(null)} style={{ ...BTN_GHOST, padding: '4px 8px', fontSize: 11 }}>✕</button>
              </div>
            ) : (
              <>
                <span style={{ fontSize: 18 }}>{s.emoji}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: selectedId === s.id ? 700 : 400, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.title}
                </span>
                <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => moveSection(s.id, 'up')} disabled={idx === 0} style={{ ...BTN_GHOST, padding: '2px 5px', opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                  <button onClick={() => moveSection(s.id, 'down')} disabled={idx === sections.length - 1} style={{ ...BTN_GHOST, padding: '2px 5px', opacity: idx === sections.length - 1 ? 0.3 : 1 }}>↓</button>
                  <button onClick={() => { setEditingSectId(s.id); setEditSectEmoji(s.emoji); setEditSectTitle(s.title) }} style={{ ...BTN_GHOST, padding: '2px 5px' }}>✏️</button>
                  <button onClick={() => deleteSection(s.id, s.title)} style={{ ...BTN_RED, padding: '2px 5px' }}>🗑️</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Right: materials ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!selected ? (
          <div style={{ background: '#F9F8FF', border: '1.5px dashed #DDD5FF', borderRadius: 16, padding: '40px 24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>← Выберите раздел</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', margin: 0 }}>
                {selected.emoji} {selected.title}
                <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>
                  {materials.length} материал{materials.length === 1 ? '' : materials.length < 5 ? 'а' : 'ов'}
                </span>
              </p>
              <button onClick={openAddMat} style={BTN_PUR}>+ Материал</button>
            </div>

            {/* Material form */}
            {showMatForm && (
              <div style={{ background: '#F9F8FF', border: '1.5px solid #DDD5FF', borderRadius: 14, padding: 20, marginBottom: 20 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', margin: '0 0 14px' }}>
                  {editingMat ? 'Редактировать материал' : 'Новый материал'}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>Заголовок *</label>
                    <input value={matForm.title} onChange={e => setMatForm(f => ({ ...f, title: e.target.value }))} style={{ ...INPUT, marginTop: 4 }} placeholder="Название материала" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>Формат *</label>
                    <select value={matForm.format} onChange={e => setMatForm(f => ({ ...f, format: e.target.value }))} style={{ ...INPUT, marginTop: 4 }}>
                      {FORMAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>Длительность</label>
                    <input value={matForm.duration_label} onChange={e => setMatForm(f => ({ ...f, duration_label: e.target.value }))} style={{ ...INPUT, marginTop: 4 }} placeholder="14 мин" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>Описание</label>
                    <textarea value={matForm.description} onChange={e => setMatForm(f => ({ ...f, description: e.target.value }))} style={{ ...TEXTAREA, marginTop: 4 }} placeholder="Краткое описание" />
                  </div>
                </div>

                {/* Content by format */}
                <div style={{ marginBottom: 10 }}>
                  {matForm.format === 'article' ? (
                    <>
                      <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                        Текст статьи
                      </label>
                      <SimpleEditor
                        value={matForm.content_url}
                        onChange={val => setMatForm(f => ({ ...f, content_url: val }))}
                      />
                    </>
                  ) : matForm.format === 'video' ? (
                    <>
                      <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                        Видео (Kinescope) — можно добавить несколько
                      </label>
                      {videoUrls.map((url, index) => (
                        <div key={index} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                          <input
                            value={url}
                            onChange={e => {
                              const updated = [...videoUrls]
                              updated[index] = e.target.value
                              setVideoUrls(updated)
                            }}
                            placeholder="https://kinescope.io/..."
                            style={{ ...INPUT, fontFamily: 'monospace', fontSize: 12, flex: 1 }}
                          />
                          <button
                            onClick={() => setVideoUrls(videoUrls.filter((_, i) => i !== index))}
                            style={{ ...BTN_RED, padding: '5px 10px', flexShrink: 0 }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setVideoUrls([...videoUrls, ''])}
                        style={BTN_GHOST}
                      >
                        + Добавить видео
                      </button>
                    </>
                  ) : (
                    <>
                      <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>
                        URL файла
                      </label>
                      <textarea
                        value={matForm.content_url}
                        onChange={e => setMatForm(f => ({ ...f, content_url: e.target.value }))}
                        style={{ ...TEXTAREA, marginTop: 4, minHeight: 60, fontFamily: 'monospace', fontSize: 12 }}
                        placeholder="https://..."
                      />
                      {(matForm.format === 'pdf' || matForm.format === 'audio') && (
                        <div style={{ marginTop: 6 }}>
                          <input ref={fileRef} type="file" accept={matForm.format === 'pdf' ? '.pdf' : 'audio/*'} style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) uploadContentFile(f) }} />
                          <button onClick={() => fileRef.current?.click()} style={BTN_GHOST}>
                            {fileUploading ? 'Загрузка…' : '📎 Загрузить файл'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Attachments */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, display: 'block', marginBottom: 6 }}>
                    📎 Вложения (PDF, документы, изображения)
                  </label>

                  {/* Existing attachments list */}
                  {attachments.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                      {attachments.map((att, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F9F8FF', border: '1px solid #DDD5FF', borderRadius: 8, padding: '6px 10px' }}>
                          <span style={{ fontSize: 14 }}>📄</span>
                          <span style={{ flex: 1, fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {att.name}
                          </span>
                          <button
                            onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0392B', fontSize: 14, padding: '0 2px', lineHeight: 1 }}
                            title="Удалить"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  <input
                    ref={attachRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadAttachment(f) }}
                  />
                  <button onClick={() => attachRef.current?.click()} disabled={attachUploading} style={BTN_GHOST}>
                    {attachUploading ? '⏳ Загрузка…' : '📎 Прикрепить файл'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>Порядок</label>
                    <input type="number" value={matForm.sort_order} onChange={e => setMatForm(f => ({ ...f, sort_order: Number(e.target.value) }))} style={{ ...INPUT, marginTop: 4 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                      <input type="checkbox" checked={matForm.is_published} onChange={e => setMatForm(f => ({ ...f, is_published: e.target.checked }))} />
                      Опубликован
                    </label>
                  </div>
                </div>

                {matError && <p style={{ color: '#C0392B', fontSize: 12, marginBottom: 8 }}>{matError}</p>}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveMat} disabled={matSaving} style={BTN_PUR}>
                    {matSaving ? 'Сохраняем…' : editingMat ? 'Сохранить изменения' : 'Добавить материал'}
                  </button>
                  <button onClick={() => setShowMatForm(false)} style={BTN_GHOST}>Отмена</button>
                </div>
              </div>
            )}

            {/* Materials list */}
            {materials.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>В этом разделе пока нет материалов</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {materials.map((m, idx) => {
                  const badge = FORMAT_BADGE[m.format] ?? FORMAT_BADGE.article
                  return (
                    <div key={m.id} style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ background: badge.bg, color: badge.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                            {badge.icon} {m.format.toUpperCase()}
                          </span>
                          {!m.is_published && (
                            <span style={{ background: '#FFF0F0', color: '#C0392B', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                              черновик
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.title}
                        </p>
                        {m.duration_label && (
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>⏱ {m.duration_label}</p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button onClick={() => moveMat(m.id, 'up')} disabled={idx === 0} style={{ ...BTN_GHOST, padding: '4px 7px', opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                        <button onClick={() => moveMat(m.id, 'down')} disabled={idx === materials.length - 1} style={{ ...BTN_GHOST, padding: '4px 7px', opacity: idx === materials.length - 1 ? 0.3 : 1 }}>↓</button>
                        <button onClick={() => openEditMat(m)} style={BTN_GHOST}>✏️</button>
                        <button onClick={() => deleteMat(m)} style={BTN_RED}>🗑️</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
