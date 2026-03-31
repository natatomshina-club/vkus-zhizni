'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PrivateMessage } from '@/types/channel'

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86_400_000)
  const postDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const hhmm = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  if (postDay.getTime() === today.getTime()) return `сегодня ${hhmm}`
  if (postDay.getTime() === yesterday.getTime()) return `вчера ${hhmm}`
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ` ${hhmm}`
}

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new window.Image()
    img.onload = () => {
      const maxSize = 1200
      let { width, height } = img
      if (width > maxSize || height > maxSize) {
        if (width > height) { height = (height / width) * maxSize; width = maxSize }
        else { width = (width / height) * maxSize; height = maxSize }
      }
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85)
    }
    img.src = URL.createObjectURL(file)
  })
}

export default function DirectChat({ memberId }: { memberId: string }) {
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [bottomOffset, setBottomOffset] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const latestAtRef = useRef<string | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function loadMessages(isInitial = false) {
    try {
      const res = await fetch('/api/channel/direct')
      const data = await res.json() as { messages?: PrivateMessage[]; error?: string }
      if (data.error) {
        setError(data.error)
        if (pollingRef.current) clearInterval(pollingRef.current)
        return
      }
      const list = data.messages ?? []
      setMessages(list)
      if (list.length > 0) latestAtRef.current = list[list.length - 1].created_at
    } catch (e) {
      console.error('DirectChat load error:', e)
      setError('Ошибка загрузки')
      if (pollingRef.current) clearInterval(pollingRef.current)
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useEffect(() => { loadMessages(true) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // iOS PWA: lift compose bar above keyboard
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const vp = window.visualViewport
        setBottomOffset(Math.max(0, window.innerHeight - vp.height - vp.offsetTop))
      }
    }
    window.visualViewport?.addEventListener('resize', handleResize)
    window.visualViewport?.addEventListener('scroll', handleResize)
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize)
      window.visualViewport?.removeEventListener('scroll', handleResize)
    }
  }, [])

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [loading, messages.length])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const sub = supabase
      .channel('direct:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, async () => {
        const res = await fetch('/api/channel/direct')
        if (!res.ok) return
        const data = await res.json() as { messages?: PrivateMessage[] }
        if (data.messages) {
          setMessages(data.messages)
          if (data.messages.length > 0) latestAtRef.current = data.messages[data.messages.length - 1].created_at
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [])

  // Polling fallback every 15s
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/channel/direct')
        if (!res.ok) { if (pollingRef.current) clearInterval(pollingRef.current); return }
        const data = await res.json() as { messages?: PrivateMessage[]; error?: string }
        if (data.error) { if (pollingRef.current) clearInterval(pollingRef.current); return }
        const incoming = data.messages ?? []
        if (incoming.length === 0) return
        const latest = incoming[incoming.length - 1].created_at
        if (latest !== latestAtRef.current) { latestAtRef.current = latest; setMessages(incoming) }
      } catch { /* silent */ }
    }, 15_000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [])

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value.slice(0, 2000))
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 96) + 'px'
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) { setMediaFile(null); setMediaPreview(null); return }
    if (!file.type.startsWith('image/')) { setError('Можно загружать только фото'); if (fileRef.current) fileRef.current.value = ''; return }
    if (file.size > 10 * 1024 * 1024) { setError('Файл слишком большой. Максимум 10 МБ'); if (fileRef.current) fileRef.current.value = ''; return }
    setError('')
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
  }

  function removeMedia() {
    setMediaFile(null)
    setMediaPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const canSend = (text.trim().length > 0 || mediaFile !== null) && !sending
  const charsLeft = 2000 - text.length

  async function handleSend() {
    if (!canSend) return
    setError('')
    setSending(true)

    try {
      let media_url: string | null = null

      if (mediaFile) {
        const isGif = mediaFile.type === 'image/gif'
        const uploadBlob = isGif ? mediaFile : await compressImage(mediaFile)
        const uploadName = isGif ? mediaFile.name : mediaFile.name.replace(/\.[^.]+$/, '.jpg')
        const uploadType = isGif ? mediaFile.type : 'image/jpeg'

        const urlRes = await fetch('/api/channel/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: 'private',
            filename: uploadName,
            content_type: uploadType,
            size: uploadBlob.size,
          }),
        })
        if (!urlRes.ok) {
          const err = await urlRes.json().catch(() => ({})) as { error?: string }
          throw new Error(err.error ?? 'Ошибка загрузки фото')
        }
        const { signedUrl, publicUrl } = await urlRes.json() as { signedUrl: string; path: string; publicUrl: string }
        const uploadRes = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': uploadType }, body: uploadBlob })
        if (!uploadRes.ok) throw new Error('Ошибка загрузки фото на сервер')
        media_url = publicUrl
      }

      const trimmed = text.trim()
      const optimistic: PrivateMessage = {
        id: `optimistic-${Date.now()}`,
        member_id: memberId,
        text: trimmed || null,
        media_url,
        from_admin: false,
        is_read: false,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, optimistic])
      setText('')
      removeMedia()
      if (textareaRef.current) textareaRef.current.style.height = 'auto'

      const res = await fetch('/api/channel/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed || '', media_url: media_url ?? undefined }),
      })
      const data = await res.json() as { message?: PrivateMessage; error?: string }
      if (data.message) {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? data.message! : m))
        latestAtRef.current = data.message.created_at
      } else if (data.error) {
        setMessages(prev => prev.filter(m => m.id !== optimistic.id))
        setError(data.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3 pb-4">
        {error && (
          <p className="text-sm text-center" style={{ color: '#C0392B', fontFamily: 'var(--font-nunito)' }}>{error}</p>
        )}

        {messages.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 py-12">
            <span className="text-5xl">✉️</span>
            <p className="text-sm text-center" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
              Напиши Наташе — она отвечает лично каждой участнице
            </p>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex shrink-0 ${msg.from_admin ? 'justify-start' : 'justify-end'}`}>
            <div style={{ maxWidth: '75%' }}>
              {msg.from_admin && (
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-xs font-bold" style={{ color: '#5C4200', fontFamily: 'var(--font-nunito)' }}>
                    Наталья Томшина
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: '#FFD93D', color: '#5C4200', fontFamily: 'var(--font-nunito)' }}>
                    Наставник
                  </span>
                </div>
              )}
              <div
                className="text-sm overflow-hidden"
                style={{
                  background: msg.from_admin ? '#FFF9E0' : '#F0EEFF',
                  borderRadius: msg.from_admin ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                  border: msg.from_admin ? '1px solid #FFE58F' : '1px solid var(--pur-br)',
                }}
              >
                {msg.media_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={msg.media_url}
                    alt="фото"
                    style={{
                      display: 'block',
                      width: '100%',
                      maxWidth: 260,
                      borderRadius: msg.text ? '17px 17px 0 0' : msg.from_admin ? '17px 17px 17px 3px' : '17px 17px 3px 17px',
                    }}
                  />
                )}
                {msg.text && (
                  <p
                    className="px-4 py-2.5"
                    style={{
                      color: 'var(--text)',
                      fontFamily: 'var(--font-nunito)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.text}
                  </p>
                )}
              </div>
              <p
                className={`text-[10px] mt-1 px-1 ${msg.from_admin ? 'text-left' : 'text-right'}`}
                style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}
              >
                {formatTime(msg.created_at)}
              </p>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div
        className="shrink-0 pb-[64px] lg:pb-0"
        style={{
          background: 'var(--card)',
          transform: bottomOffset > 0 ? `translateY(-${bottomOffset}px)` : undefined,
          transition: 'transform 0.15s ease',
        }}
      >
        {/* Thumbnail preview above input */}
        {mediaPreview && (
          <div className="px-4 pt-3 pb-0">
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaPreview}
                alt="preview"
                style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 10, display: 'block' }}
              />
              <button
                type="button"
                onClick={removeMedia}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div
          className="px-4 pt-3 flex items-end gap-2 border-t"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--card)',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          }}
        >
          {/* Кнопка фото */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="shrink-0 rounded-xl flex items-center justify-center text-xl"
            style={{ minHeight: 48, minWidth: 48, background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            📷
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Textarea */}
          <div className="flex-1 relative" style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column' }}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Написать Наташе..."
              rows={1}
              className="w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none border"
              style={{
                fontFamily: 'var(--font-nunito)',
                background: 'var(--bg)',
                color: 'var(--text)',
                borderColor: 'var(--border)',
                lineHeight: '1.5',
                overflow: 'hidden',
                minHeight: 48,
                flex: 1,
              }}
            />
            {charsLeft < 200 && (
              <p
                className="absolute right-3 bottom-2 text-[10px]"
                style={{ color: charsLeft < 50 ? '#C0392B' : 'var(--muted)', fontFamily: 'var(--font-nunito)' }}
              >
                {charsLeft}
              </p>
            )}
          </div>

          {/* Кнопка отправки */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className="rounded-2xl px-4 font-semibold text-sm text-white disabled:opacity-40 shrink-0"
            style={{ minHeight: 48, background: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
          >
            {sending ? '...' : '→'}
          </button>
        </div>
      </div>
    </div>
  )
}
