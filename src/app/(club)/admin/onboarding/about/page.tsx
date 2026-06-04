'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { extractKinescopeId } from '@/lib/kinescope'

// Predefined sections — use screen as identifier within section='about_club'
const PREDEFINED: { screen: string; label: string }[] = [
  { screen: 'kitchen',     label: '🍳 Умная кухня' },
  { screen: 'diary',       label: '📓 Дневник' },
  { screen: 'marathon',    label: '🏃 Марафон' },
  { screen: 'webinars',    label: '🎥 Вебинары' },
  { screen: 'body',        label: '💚 Карта помощи' },
  { screen: 'meditations', label: '🧘 Медитации' },
  { screen: 'community',   label: '💬 Сообщество' },
  { screen: 'favorites',   label: '⭐ Избранное' },
  { screen: 'profile',     label: '👤 Профиль' },
]

const PREDEFINED_SCREENS = [
  'welcome', 'kitchen', 'favorites', 'diary',
  'body', 'webinars', 'meditations', 'marathon', 'profile', 'community',
]

interface SectionItem {
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
  return str.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_а-яёa-я]/gi, '')
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

export default function OnboardingAboutPage() {
  const [device, setDevice] = useState<DeviceType>('mobile')

  // Welcome card state
  const [welcomeDesc, setWelcomeDesc] = useState('')
  const [welcomeVideo, setWelcomeVideo] = useState('')
  const [welcomeCoverUrl, setWelcomeCoverUrl] = useState<string | null>(null)
  const [welcomeSaving, setWelcomeSaving] = useState(false)
  const [welcomeSaved, setWelcomeSaved] = useState(false)
  const [welcomeErr, setWelcomeErr] = useState('')

  // Sortable sections
  const [sortedSections, setSortedSections] = useState<SectionItem[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [swapping, setSwapping] = useState(false)
  const [loading, setLoading] = useState(true)

  // Cover upload state
  const [coverUploading, setCoverUploading] = useState<Record<string, boolean>>({})
  const [coverToast, setCoverToast] = useState<string | null>(null)
  const coverToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Add section form
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEmoji, setNewEmoji] = useState('')
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newVideo, setNewVideo] = useState('')
  const [addSaving, setAddSaving] = useState(false)
  const [addErr, setAddErr] = useState('')

  const fetchItems = useCallback(async (dev: DeviceType) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/onboarding?section=about_club&device=${dev}`)
      const json = await res.json()

      const dbMap: Record<string, {
        description: string
        video_url: string
        sort_order: number
        title: string | null
        cover_url: string | null
      }> = {}

      for (const item of (json.items ?? [])) {
        dbMap[item.screen] = {
          description: item.description ?? '',
          video_url: item.video_url ?? '',
          sort_order: item.sort_order ?? 0,
          title: item.title ?? null,
          cover_url: item.cover_url ?? null,
        }
      }

      if (dbMap['welcome']) {
        setWelcomeDesc(dbMap['welcome'].description)
        setWelcomeVideo(dbMap['welcome'].video_url)
        setWelcomeCoverUrl(dbMap['welcome'].cover_url)
      }

      const predefined: SectionItem[] = PREDEFINED.map((s, i) => ({
        screen: s.screen,
        label: s.label,
        sort_order: dbMap[s.screen]?.sort_order ?? (i + 1),
        description: dbMap[s.screen]?.description ?? '',
        video_url: dbMap[s.screen]?.video_url ?? '',
        cover_url: dbMap[s.screen]?.cover_url ?? null,
        isCustom: false,
      }))

      const custom: SectionItem[] = (json.items ?? [])
        .filter((item: { screen: string }) => item.screen !== 'welcome' && !PREDEFINED_SCREENS.includes(item.screen))
        .map((item: { screen: string; sort_order: number; description: string | null; video_url: string | null; title: string | null; cover_url: string | null }) => ({
          screen: item.screen,
          label: item.title ?? item.screen,
          sort_order: item.sort_order,
          description: item.description ?? '',
          video_url: item.video_url ?? '',
          cover_url: item.cover_url ?? null,
          isCustom: true,
        }))

      const all = [...predefined, ...custom].sort((a, b) => a.sort_order - b.sort_order)
      setSortedSections(all)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchItems(device) }, [device, fetchItems])

  function showToast(msg: string) {
    if (coverToastTimer.current) clearTimeout(coverToastTimer.current)
    setCoverToast(msg)
    coverToastTimer.current = setTimeout(() => setCoverToast(null), 2500)
  }

  // Cover upload — patches both devices so cover is shared
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
          body: JSON.stringify({ section: 'about_club', screen, device: d, cover_url }),
        })
      ))
      if (screen === 'welcome') {
        setWelcomeCoverUrl(cover_url)
      } else {
        setSortedSections(prev => prev.map(s => s.screen === screen ? { ...s, cover_url } : s))
      }
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
          body: JSON.stringify({ section: 'about_club', screen, device: d, cover_url: null }),
        })
      ))
      if (screen === 'welcome') {
        setWelcomeCoverUrl(null)
      } else {
        setSortedSections(prev => prev.map(s => s.screen === screen ? { ...s, cover_url: null } : s))
      }
      showToast('Обложка удалена ✅')
    } catch {
      showToast('Ошибка')
    } finally {
      setCoverUploading(prev => { const n = { ...prev }; delete n[screen]; return n })
    }
  }

  // Save welcome card
  const handleSaveWelcome = async () => {
    const videoId = welcomeVideo ? extractKinescopeId(welcomeVideo) : null
    if (welcomeVideo && !videoId) { setWelcomeErr('Неверная ссылка Kinescope'); return }
    setWelcomeErr('')
    setWelcomeSaving(true)
    try {
      const res = await fetch('/api/admin/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'about_club',
          screen: 'welcome',
          device,
          video_url: videoId ?? null,
          description: welcomeDesc.trim() || null,
          sort_order: 0,
        }),
      })
      if (res.ok) { setWelcomeSaved(true); setTimeout(() => setWelcomeSaved(false), 2000) }
    } finally { setWelcomeSaving(false) }
  }

  // Save a section card
  const handleSave = async (item: SectionItem) => {
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
          section: 'about_club',
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

  // Delete a custom section
  const handleDelete = async (screen: string) => {
    if (!confirm('Удалить этот раздел? Действие нельзя отменить.')) return
    await fetch('/api/admin/onboarding', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'about_club', screen, device }),
    })
    setSortedSections(prev => prev.filter(s => s.screen !== screen))
  }

  const updateSection = (screen: string, field: 'description' | 'video_url', value: string) => {
    setSortedSections(prev => prev.map(s => s.screen === screen ? { ...s, [field]: value } : s))
    setErrors(e => { const n = { ...e }; delete n[screen]; return n })
  }

  const handleSwap = async (indexA: number, indexB: number) => {
    if (swapping) return
    setSwapping(true)
    try {
      const a = sortedSections[indexA]
      const b = sortedSections[indexB]
      const oA = a.sort_order === b.sort_order ? indexA + 1 : a.sort_order
      const oB = a.sort_order === b.sort_order ? indexB + 1 : b.sort_order

      await Promise.all([
        fetch('/api/admin/onboarding', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section: 'about_club', screen: a.screen, device,
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
            section: 'about_club', screen: b.screen, device,
            video_url: b.video_url ? (extractKinescopeId(b.video_url) ?? null) : null,
            description: b.description.trim() || null,
            sort_order: oA,
            title: b.isCustom ? b.label : null,
          }),
        }),
      ])

      setSortedSections(prev => {
        const next = [...prev]
        next[indexA] = { ...a, sort_order: oB }
        next[indexB] = { ...b, sort_order: oA }
        return next.sort((x, y) => x.sort_order - y.sort_order)
      })
    } finally { setSwapping(false) }
  }

  const handleAddSection = async () => {
    if (!newName.trim()) { setAddErr('Введите название раздела'); return }
    const screen = slugify(newName) || `section_${Date.now()}`
    if (sortedSections.some(s => s.screen === screen)) { setAddErr('Раздел с таким slug уже существует'); return }
    const videoId = newVideo ? extractKinescopeId(newVideo) : null
    if (newVideo && !videoId) { setAddErr('Неверная ссылка Kinescope'); return }
    setAddErr('')
    const label = ((newEmoji ? newEmoji + ' ' : '') + newName.trim()).trim()
    const maxOrder = sortedSections.reduce((m, s) => Math.max(m, s.sort_order), 0)
    const sort_order = maxOrder + 1
    setAddSaving(true)
    try {
      await fetch('/api/admin/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: 'about_club',
          screen,
          device,
          title: label,
          description: newDesc.trim() || null,
          video_url: videoId ?? null,
          sort_order,
        }),
      })
      setSortedSections(prev => [...prev, {
        screen, label, sort_order,
        description: newDesc,
        video_url: newVideo,
        cover_url: null,
        isCustom: true,
      }])
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
          О клубе
        </h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8 lg:py-8">
        <div className="hidden lg:flex items-center gap-3 mb-6">
          <a href="/admin/onboarding" className="text-lg" style={{ color: 'var(--muted)' }}>← Назад</a>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
            О клубе 🌿
          </h1>
        </div>

        {/* Device switcher */}
        <div className="flex rounded-xl overflow-hidden mb-6" style={{ border: '1px solid var(--border)', display: 'inline-flex' }}>
          {(['mobile', 'desktop'] as DeviceType[]).map(d => (
            <button key={d} onClick={() => setDevice(d)} className="px-5 py-2 text-sm font-semibold"
              style={{
                fontFamily: 'var(--font-nunito)',
                background: device === d ? '#22c55e' : 'var(--card)',
                color: device === d ? '#fff' : 'var(--muted)',
                border: 'none', cursor: 'pointer',
              }}>
              {d === 'mobile' ? '📱 Мобильный' : '🖥 Десктоп'}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-center py-10" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Загрузка...</p>
        ) : (
          <div className="flex flex-col gap-4">

            {/* ── Welcome card (fixed, no arrows) ── */}
            <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '2px solid #22c55e' }}>
              <p className="font-bold text-sm mb-1" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>👋 Приветствие</p>
              <p className="text-xs mb-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Отображается первым на странице «О клубе»</p>
              <div className="flex flex-col gap-3">
                <CoverBlock screen="welcome" coverUrl={welcomeCoverUrl} />
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Текст приветствия</label>
                  <textarea rows={5} value={welcomeDesc}
                    onChange={e => { setWelcomeDesc(e.target.value); setWelcomeErr('') }}
                    placeholder="Текст приветствия участницы..."
                    className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-nunito)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Видео Kinescope (ссылка или ID)</label>
                  <input type="text" value={welcomeVideo}
                    onChange={e => { setWelcomeVideo(e.target.value); setWelcomeErr('') }}
                    placeholder="https://kinescope.io/... или ID видео"
                    className="w-full rounded-xl px-3 py-2 text-sm"
                    style={{ background: 'var(--bg)', border: `1px solid ${welcomeErr ? '#FF4444' : 'var(--border)'}`, color: 'var(--text)', fontFamily: 'var(--font-nunito)', outline: 'none' }}
                  />
                  {welcomeErr && <p className="text-xs mt-1" style={{ color: '#FF4444', fontFamily: 'var(--font-nunito)' }}>{welcomeErr}</p>}
                </div>
                <div className="flex justify-end">
                  <button onClick={handleSaveWelcome} disabled={welcomeSaving}
                    className="px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: welcomeSaved ? '#4CAF78' : '#22c55e', color: '#fff', fontFamily: 'var(--font-nunito)', border: 'none', cursor: welcomeSaving ? 'wait' : 'pointer', opacity: welcomeSaving ? 0.7 : 1 }}>
                    {welcomeSaving ? 'Сохранение...' : welcomeSaved ? '✓ Сохранено' : 'Сохранить'}
                  </button>
                </div>
              </div>
            </div>

            {/* ── Sortable section cards ── */}
            {sortedSections.map((item, idx) => {
              const isSaving = saving === item.screen
              const isSaved = saved === item.screen
              const err = errors[item.screen]
              return (
                <div key={item.screen} className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>{item.label}</p>
                    <div className="flex gap-1">
                      <button onClick={() => handleSwap(idx, idx - 1)} disabled={idx === 0 || swapping}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                        style={{ background: idx === 0 ? 'var(--bg)' : '#EDE9FF', color: idx === 0 ? 'var(--border)' : '#7C5CFC', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', opacity: swapping ? 0.5 : 1 }}
                        title="Переместить вверх">↑</button>
                      <button onClick={() => handleSwap(idx, idx + 1)} disabled={idx === sortedSections.length - 1 || swapping}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                        style={{ background: idx === sortedSections.length - 1 ? 'var(--bg)' : '#EDE9FF', color: idx === sortedSections.length - 1 ? 'var(--border)' : '#7C5CFC', border: 'none', cursor: idx === sortedSections.length - 1 ? 'default' : 'pointer', opacity: swapping ? 0.5 : 1 }}
                        title="Переместить вниз">↓</button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <CoverBlock screen={item.screen} coverUrl={item.cover_url} />
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Описание (текст для участницы)</label>
                      <textarea rows={3} value={item.description}
                        onChange={e => updateSection(item.screen, 'description', e.target.value)}
                        placeholder="Напишите краткое описание раздела..."
                        className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-nunito)', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Видео Kinescope (ссылка или ID)</label>
                      <input type="text" value={item.video_url}
                        onChange={e => updateSection(item.screen, 'video_url', e.target.value)}
                        placeholder="https://kinescope.io/... или ID видео"
                        className="w-full rounded-xl px-3 py-2 text-sm"
                        style={{ background: 'var(--bg)', border: `1px solid ${err ? '#FF4444' : 'var(--border)'}`, color: 'var(--text)', fontFamily: 'var(--font-nunito)', outline: 'none' }}
                      />
                      {err && <p className="text-xs mt-1" style={{ color: '#FF4444', fontFamily: 'var(--font-nunito)' }}>{err}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button onClick={() => handleSave(item)} disabled={isSaving}
                        style={{ flex: 1, background: isSaved ? '#4CAF78' : '#22c55e', color: '#fff', padding: '10px', borderRadius: '8px', border: 'none', cursor: isSaving ? 'wait' : 'pointer', fontWeight: 600, fontFamily: 'var(--font-nunito)', opacity: isSaving ? 0.7 : 1 }}>
                        {isSaving ? 'Сохранение...' : isSaved ? '✓ Сохранено' : '✅ Сохранить'}
                      </button>
                      <button onClick={() => handleDelete(item.screen)}
                        style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* ── Add section form ── */}
            {showAddForm ? (
              <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px dashed #22c55e' }}>
                <p className="font-bold text-sm mb-3" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>➕ Новый раздел</p>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <div style={{ width: 64 }}>
                      <label className="block text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Эмодзи</label>
                      <input type="text" maxLength={2} value={newEmoji} onChange={e => setNewEmoji(e.target.value)}
                        placeholder="🌟"
                        className="w-full rounded-xl px-3 py-2 text-sm text-center"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-nunito)', outline: 'none' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="block text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Название раздела (станет slug)</label>
                      <input type="text" value={newName} onChange={e => { setNewName(e.target.value); setAddErr('') }}
                        placeholder="my_section"
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
                    <button onClick={handleAddSection} disabled={addSaving}
                      className="px-4 py-2 rounded-xl text-sm font-semibold"
                      style={{ background: '#22c55e', color: '#fff', border: 'none', fontFamily: 'var(--font-nunito)', cursor: addSaving ? 'wait' : 'pointer', opacity: addSaving ? 0.7 : 1 }}>
                      {addSaving ? 'Создание...' : 'Создать раздел'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowAddForm(true)}
                className="w-full rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: 'var(--card)', border: '1px dashed var(--border)', color: 'var(--muted)', fontFamily: 'var(--font-nunito)', cursor: 'pointer' }}>
                + Добавить раздел
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
