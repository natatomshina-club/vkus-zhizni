'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Announcement = {
  id: string
  text: string
  is_active: boolean
  created_at: string
}

export default function AnnouncementsPage() {
  const [list, setList] = useState<Announcement[]>([])
  const [text, setText] = useState('')
  const [replacePrev, setReplacePrev] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function load() {
    const res = await fetch('/api/admin/announcements')
    if (!res.ok) return
    const data = await res.json() as { announcements: Announcement[] }
    setList(data.announcements ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    setError('')
    setSuccess('')
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), replace_previous: replacePrev }),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string }
      setError(err.error ?? 'Ошибка')
      return
    }
    setText('')
    setSuccess('Объявление опубликовано! Участницы увидят на главной.')
    load()
  }

  async function toggleActive(id: string, is_active: boolean) {
    await fetch('/api/admin/announcements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !is_active }),
    })
    load()
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto" style={{ background: 'var(--bg)', fontFamily: 'var(--font-nunito)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/messages" className="text-sm px-3 py-1.5 rounded-xl" style={{ background: 'var(--pur-light)', color: 'var(--pur)' }}>
          ← Назад
        </Link>
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
          Важное от Наташи
        </h1>
      </div>

      {/* New announcement form */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Новое объявление</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            value={text}
            onChange={e => setText(e.target.value.slice(0, 2000))}
            placeholder="Напиши объявление для всех участниц клуба..."
            rows={5}
            className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}
            onFocus={e => (e.target.style.borderColor = 'var(--pur)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="replace"
              checked={replacePrev}
              onChange={e => setReplacePrev(e.target.checked)}
              className="w-4 h-4 accent-purple-600"
            />
            <label htmlFor="replace" className="text-sm" style={{ color: 'var(--muted)' }}>
              Скрыть предыдущие объявления
            </label>
          </div>
          {error && <p className="text-sm" style={{ color: '#C0392B' }}>{error}</p>}
          {success && <p className="text-sm font-semibold" style={{ color: '#1A5C3A' }}>✅ {success}</p>}
          <button
            type="submit"
            disabled={saving || !text.trim()}
            className="py-3 rounded-2xl text-white text-sm font-bold disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: 'var(--pur)' }}
          >
            {saving ? 'Публикую...' : '📢 Опубликовать'}
          </button>
        </form>
        <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
          Объявление появится в блоке «Важное от Наташи!» на главной странице у всех участниц.
        </p>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          История объявлений
        </p>
        {list.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Объявлений пока нет</p>
        )}
        {list.map(a => (
          <div
            key={a.id}
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{
              background: a.is_active ? '#F0FFF4' : 'var(--card)',
              border: `1px solid ${a.is_active ? '#A8E6CF' : 'var(--border)'}`,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--text)' }}>{a.text}</p>
              <button
                onClick={() => toggleActive(a.id, a.is_active)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
                style={{
                  background: a.is_active ? '#A8E6CF' : 'var(--bg)',
                  color: a.is_active ? '#1A5C3A' : 'var(--muted)',
                  border: '1px solid var(--border)',
                }}
              >
                {a.is_active ? '✅ Активно' : 'Скрыто'}
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{formatDate(a.created_at)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
