'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { extractKinescopeId } from '@/lib/kinescope'

const PREDEFINED_SCREENS = ['main']

interface LessonItem {
  screen: string
  label: string
  sort_order: number
  description: string
  video_url: string
  cover_url: string | null
  isCustom: boolean
}

type DeviceType = 'mobile' | 'desktop'

function slugify(str: string) {
  return str.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/gi, '')
}

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const maxSize = 1200
      let { width, height } = img
      if (width > maxSize || height > maxSize) {
        if (width > height) { height = Math.round(height / width * maxSize); width = maxSize }
        else { width = Math.round(width / height * maxSize); height = maxSize }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', 0.85)
    }
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = url
  })
}

export default function OnboardingKitchenPage() {
  const [device, setDevice] = useState<DeviceType>('mobile')
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [swapping, setSwapping] = useState(false)
  const [loading, setLoading] = useState(true)

  // Cover upload state
  const [coverUploading, setCoverUploading] = useState<Record<string, boolean>>({})
  const [coverToast, setCoverToast] = useState<string | null>(null)
  const coverToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Add lesson form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEmoji, setNewEmoji] = useState('')
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newVideo, setNewVideo] = useState('')
  const [addSaving, setAddSaving] = useState(false)
  const [addErr, setAddErr] = useState('')

  const fetchLessons = useCallback(async (dev: DeviceType) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/onboarding?section=kitchen&device=${dev}`)
      const json = await res.json()

      const items: LessonItem[] = (json.items ?? []).map((item: {
        screen: string; sort_order: number; description: string | null
        video_url: string | null; title: string | null; cover_url: string | null
      }, i: number) => ({
        screen: item.screen,
        label: item.screen === 'main'
          ? '🍳 Как пользоваться Умной Кухней?'
          : (item.title ?? item.screen),
        sort_order: item.sort_order ?? i,
        description: item.description ?? '',
        video_url: item.video_url ?? '',
        cover_url: item.cover_url ?? null,
        isCustom: !PREDEFINED_SCREENS.includes(item.screen),
      }))

      if (!items.find(i => i.screen === 'main')) {
        items.unshift({
          screen: 'main',
          label: '🍳 Как пользоваться Умной Кухней?',
          sort_order: 0,
          description: '',
          video_url: '',
          cover_url: null,
          isCustom: false,
        })
      }

      items.sort((a, b) => a.sort_order - b.sort_order)
      setLessons(items)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLessons(device) }, [device, fetchLessons])

  function showToast(msg: string) {
    if (coverToastTimer.current) clearTimeout(coverToastTimer.current)
    setCoverToast(msg)
    coverToastTimer.current = setTimeout(() => setCoverToast(null), 2500)
  }

  async function handleUploadCover(screen: string, file: File) {
    setCoverUploading(prev => ({ ...prev, [screen]: true }))
    try {
      const blob = await compressImage(file)
      const fd = new FormData()
      fd.append('file', new File([blob], 'cover.jpg', { type: 'image/jpeg' }))
      const res = await fetch('/api/admin/onboarding/upload-cover', { method: 'POST', body: fd })
      if (!res.ok) { showToast('Ошибка загрузки'); return }
      const { cover_url } = await res.json() as { cover_url: string }
      await Promise.all(['mobile', 'desktop'].map(d =>
        fetch('/api/admin/onboarding', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section: 'kitchen', screen, device: d, cover_url }),
        })
      ))
      setLessons(prev => prev.map(l => l.screen === screen ? { ...l, cover_url } : l))
      showToast('Обложка сохранена ✅')
    } catch {
      showToast('Ошибка загрузки')
    } finally {
      setCoverUploading(prev => { const n = { ...prev }; delete n[screen]; return n })
    }
  }

  async function handleDeleteCover(screen: string) {
    setCoverUploading(prev => ({ ...prev, [screen]: true }))
    try {
      await Promise.all(['mobile', 'desktop'].map(d =>
        fetch('/api/admin/onboarding', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section: 'kitchen', screen, device: d, cover_url: null }),
        })
      ))
      setLessons(prev => prev.map(l => l.screen === screen ? { ...l, cover_url: null } : l))
      showToast('Обложка удалена ✅')
    } catch {
      showToast('Ошибка')
    } finally {
      setCoverUploading(prev => { const n = { ...prev }; delete n[screen]; return n })
    }
  }

  const handleSave = async (item: LessonItem) => {
    const videoId = item.video_url ? extractKinescopeId(item.video_url) : null
    if (item.video_url && !videoId) {
      setErrors(e => ({ ...e, [item.screen]: 'Неверная ссылка Kinescope' }))
      return
    }
    setErrors(e => { const n = { ...e }; delete n[item.screen]; return n })
    setSaving(item.screen)
    try {
      const res = await fetch('/api/admin/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'kitchen',
          screen: item.screen,
          device,
          video_url: videoId ?? null,
          description: item.description.trim() || null,
          sort_order: item.sort_order,
          title: item.isCustom ? item.label : null,
        }),
      })
      if (res.ok) { setSaved(item.screen); setTimeout(() => setSaved(s => s === item.screen ? null : s), 2000) }
    } finally { setSaving(null) }
  }

  const handleDelete = async (screen: string) => {
    if (!confirm('Удалить этот урок? Действие нельзя отменить.')) return
    await fetch('/api/admin/onboarding', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'kitchen', screen, device }),
    })
    setLessons(prev => prev.filter(l => l.screen !== screen))
  }

  const updateLesson = (screen: string, field: 'description' | 'video_url', value: string) => {
    setLessons(prev => prev.map(l => l.screen === screen ? { ...l, [field]: value } : l))
    setErrors(e => { const n = { ...e }; delete n[screen]; return n })
  }

  const handleSwap = async (indexA: number, indexB: number) => {
    if (swapping) return
    setSwapping(true)
    try {
      const a = lessons[indexA]
      const b = lessons[indexB]
      const oA = a.sort_order === b.sort_order ? indexA : a.sort_order
      const oB = a.sort_order === b.sort_order ? indexB : b.sort_order

      await Promise.all([
        fetch('/api/admin/onboarding', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: 'kitchen', screen: a.screen, device,
            video_url: a.video_url ? (extractKinescopeId(a.video_url) ?? null) : null,
            description: a.description.trim() || null,
            sort_order: oB,
            title: a.isCustom ? a.label : null,
          }),
        }),
        fetch('/api/admin/onboarding', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: 'kitchen', screen: b.screen, device,
            video_url: b.video_url ? (extractKinescopeId(b.video_url) ?? null) : null,
            description: b.description.trim() || null,
            sort_order: oA,
            title: b.isCustom ? b.label : null,
          }),
        }),
      ])

      setLessons(prev => {
        const next = [...prev]
        next[indexA] = { ...a, sort_order: oB }
        next[indexB] = { ...b, sort_order: oA }
        return next.sort((x, y) => x.sort_order - y.sort_order)
      })
    } finally { setSwapping(false) }
  }

  const handleAddLesson = async () => {
    if (!newName.trim()) { setAddErr('Введите название урока'); return }
    const screen = slugify(newName) || `lesson_${Date.now()}`
    if (lessons.some(l => l.screen === screen)) { setAddErr('Урок с таким slug уже существует'); return }
    const videoId = newVideo ? extractKinescopeId(newVideo) : null
    if (newVideo && !videoId) { setAddErr('Неверная ссылка Kinescope'); return }
    setAddErr('')
    const label = ((newEmoji ? newEmoji + ' ' : '') + newName.trim()).trim()
    const maxOrder = lessons.reduce((m, l) => Math.max(m, l.sort_order), 0)
    const sort_order = maxOrder + 1
    setAddSaving(true)
    try {
      await fetch('/api/admin/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'kitchen',
          screen,
          device,
          title: label,
          description: newDesc.trim() || null,
          video_url: videoId ?? null,
          sort_order,
        }),
      })
      setLessons(prev => [...prev, { screen, label, sort_order, description: newDesc, video_url: newVideo, cover_url: null, isCustom: true }])
      setShowAddForm(false)
      setNewEmoji(''); setNewName(''); setNewDesc(''); setNewVideo('')
    } finally { setAddSaving(false) }
  }

  function CoverBlock({ screen, coverUrl }: { screen: string; coverUrl: string | null }) {
    const uploading = !!coverUploading[screen]
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-2"
          style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)', letterSpacing: '0.06em' }}>
          Обложка
        </p>
        <div className="rounded-xl overflow-hidden mb-2"
          style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <span style={{ fontSize: 28, opacity: 0.35 }}>📷</span>
          )}
        </div>
        <div className="flex gap-2">
          <label style={{ cursor: uploading ? 'wait' : 'pointer', display: 'inline-flex' }}>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadCover(screen, f); e.target.value = '' }}
            />
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: 'var(--pur-lt)', color: 'var(--pur)', fontFamily: 'var(--font-nunito)', opacity: uploading ? 0.7 : 1, userSelect: 'none' }}>
              {uploading ? 'Загрузка...' : coverUrl ? '📷 Заменить' : '📷 Загрузить обложку'}
            </span>
          </label>
          {coverUrl && (
            <button type="button" onClick={() => handleDeleteCover(screen)} disabled={uploading}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: '#fee2e2', color: '#dc2626', fontFamily: 'var(--font-nunito)', border: 'none', cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.5 : 1 }}>
              🗑 Удалить
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header
        className="lg:hidden flex items-center px-4 py-4 sticky top-0 z-40"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <a href="/admin/onboarding" className="mr-3 text-xl" style={{ color: 'var(--text)' }}>←</a>
        <h1 className="text-base font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
          Умная кухня
        </h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <div className="hidden lg:flex items-center gap-3 mb-6">
          <a href="/admin/onboarding" className="text-lg" style={{ color: 'var(--muted)' }}>← Назад</a>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
            Умная кухня 🍳
          </h1>
        </div>

        <p className="text-sm mb-5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Уроки показываются в аккордеоне «Как пользоваться Умной Кухней?» на странице кухни.
        </p>

        {/* Device switcher */}
        <div className="flex rounded-xl overflow-hidden mb-6" style={{ border: '1px solid var(--border)', display: 'inline-flex' }}>
          {(['mobile', 'desktop'] as DeviceType[]).map(d => (
            <button key={d} onClick={() => setDevice(d)} className="px-5 py-2 text-sm font-semibold"
              style={{ fontFamily: 'var(--font-nunito)', background: device === d ? 'var(--accent)' : 'var(--card)', color: device === d ? '#fff' : 'var(--muted)', border: 'none', cursor: 'pointer' }}>
              {d === 'mobile' ? '📱 Мобильный' : '🖥 Десктоп'}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-center py-10" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Загрузка...</p>
        ) : (
          <div className="flex flex-col gap-4">

            {lessons.map((lesson, idx) => {
              const isSaving = saving === lesson.screen
              const isSaved = saved === lesson.screen
              const err = errors[lesson.screen]
              return (
                <div key={lesson.screen} className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  {/* Header with sort arrows */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>{lesson.label}</p>
                    <div className="flex gap-1">
                      <button onClick={() => handleSwap(idx, idx - 1)} disabled={idx === 0 || swapping}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                        style={{ background: idx === 0 ? 'var(--bg)' : '#EDE9FF', color: idx === 0 ? 'var(--border)' : '#7C5CFC', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', opacity: swapping ? 0.5 : 1 }}
                        title="Переместить вверх">↑</button>
                      <button onClick={() => handleSwap(idx, idx + 1)} disabled={idx === lessons.length - 1 || swapping}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                        style={{ background: idx === lessons.length - 1 ? 'var(--bg)' : '#EDE9FF', color: idx === lessons.length - 1 ? 'var(--border)' : '#7C5CFC', border: 'none', cursor: idx === lessons.length - 1 ? 'default' : 'pointer', opacity: swapping ? 0.5 : 1 }}
                        title="Переместить вниз">↓</button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <CoverBlock screen={lesson.screen} coverUrl={lesson.cover_url} />
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Описание (текст для участницы)</label>
                      <textarea rows={3} value={lesson.description}
                        onChange={e => updateLesson(lesson.screen, 'description', e.target.value)}
                        placeholder="Опишите этот урок..."
                        className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-nunito)', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Видео Kinescope (ссылка или ID)</label>
                      <input type="text" value={lesson.video_url}
                        onChange={e => updateLesson(lesson.screen, 'video_url', e.target.value)}
                        placeholder="https://kinescope.io/... или ID видео"
                        className="w-full rounded-xl px-3 py-2 text-sm"
                        style={{ background: 'var(--bg)', border: `1px solid ${err ? '#FF4444' : 'var(--border)'}`, color: 'var(--text)', fontFamily: 'var(--font-nunito)', outline: 'none' }}
                      />
                      {err && <p className="text-xs mt-1" style={{ color: '#FF4444', fontFamily: 'var(--font-nunito)' }}>{err}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button onClick={() => handleSave(lesson)} disabled={isSaving}
                        style={{ flex: 1, background: isSaved ? '#4CAF78' : '#22c55e', color: '#fff', padding: '10px', borderRadius: '8px', border: 'none', cursor: isSaving ? 'wait' : 'pointer', fontWeight: 600, fontFamily: 'var(--font-nunito)', opacity: isSaving ? 0.7 : 1 }}>
                        {isSaving ? 'Сохранение...' : isSaved ? '✓ Сохранено' : '✅ Сохранить'}
                      </button>
                      <button onClick={() => handleDelete(lesson.screen)}
                        style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* ── Add lesson form ── */}
            {showAddForm ? (
              <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px dashed var(--accent)' }}>
                <p className="font-bold text-sm mb-3" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>➕ Новый урок</p>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <div style={{ width: 64 }}>
                      <label className="block text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Эмодзи</label>
                      <input type="text" maxLength={2} value={newEmoji} onChange={e => setNewEmoji(e.target.value)}
                        placeholder="🎬"
                        className="w-full rounded-xl px-3 py-2 text-sm text-center"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-nunito)', outline: 'none' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="block text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Название урока (станет slug)</label>
                      <input type="text" value={newName} onChange={e => { setNewName(e.target.value); setAddErr('') }}
                        placeholder="lesson_name"
                        className="w-full rounded-xl px-3 py-2 text-sm"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-nunito)', outline: 'none' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Описание</label>
                    <textarea rows={3} value={newDesc} onChange={e => setNewDesc(e.target.value)}
                      placeholder="Текст для участницы..."
                      className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-nunito)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Видео Kinescope (ссылка или ID)</label>
                    <input type="text" value={newVideo} onChange={e => { setNewVideo(e.target.value); setAddErr('') }}
                      placeholder="https://kinescope.io/... или ID видео"
                      className="w-full rounded-xl px-3 py-2 text-sm"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-nunito)', outline: 'none' }}
                    />
                  </div>
                  {addErr && <p className="text-xs" style={{ color: '#FF4444', fontFamily: 'var(--font-nunito)' }}>{addErr}</p>}
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setShowAddForm(false); setAddErr('') }}
                      className="px-4 py-2 rounded-xl text-sm font-semibold"
                      style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)', fontFamily: 'var(--font-nunito)', cursor: 'pointer' }}>
                      Отмена
                    </button>
                    <button onClick={handleAddLesson} disabled={addSaving}
                      className="px-4 py-2 rounded-xl text-sm font-semibold"
                      style={{ background: '#22c55e', color: '#fff', border: 'none', fontFamily: 'var(--font-nunito)', cursor: addSaving ? 'wait' : 'pointer', opacity: addSaving ? 0.7 : 1 }}>
                      {addSaving ? 'Создание...' : 'Создать урок'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddForm(true)}
                className="w-full rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: 'var(--card)', border: '1px dashed var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-nunito)', cursor: 'pointer' }}>
                + Добавить урок
              </button>
            )}

          </div>
        )}
      </div>

      {/* Cover toast */}
      {coverToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg z-50"
          style={{ background: '#1a1a1a', color: '#fff', fontFamily: 'var(--font-nunito)', pointerEvents: 'none' }}
        >
          {coverToast}
        </div>
      )}
    </div>
  )
}
