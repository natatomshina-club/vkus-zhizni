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

export default function DirectChat() {
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
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

  // Load messages on mount
  useEffect(() => {
    loadMessages(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom after load and after new messages
  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [loading, messages.length])

  // Realtime subscription for instant updates
  useEffect(() => {
    const supabase = createClient()
    const sub = supabase
      .channel('direct:messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'private_messages',
      }, async () => {
        const res = await fetch('/api/channel/direct')
        if (!res.ok) return
        const data = await res.json() as { messages?: PrivateMessage[] }
        if (data.messages) {
          setMessages(data.messages)
          if (data.messages.length > 0) {
            latestAtRef.current = data.messages[data.messages.length - 1].created_at
          }
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [])

  // Polling every 15s for new replies from Наташа (fallback)
  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/channel/direct')
        if (!res.ok) {
          if (pollingRef.current) clearInterval(pollingRef.current)
          return
        }
        const data = await res.json() as { messages?: PrivateMessage[]; error?: string }
        if (data.error) {
          if (pollingRef.current) clearInterval(pollingRef.current)
          return
        }
        const incoming = data.messages ?? []
        if (incoming.length === 0) return
        const latest = incoming[incoming.length - 1].created_at
        if (latest !== latestAtRef.current) {
          latestAtRef.current = latest
          setMessages(incoming)
        }
      } catch {
        // silent — не останавливаем polling при сетевой ошибке
      }
    }, 15_000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  // Auto-resize textarea
  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 96) + 'px' // max ~4 lines
  }

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    // Optimistic update
    const optimistic: PrivateMessage = {
      id: `optimistic-${Date.now()}`,
      member_id: '',
      text: trimmed,
      from_admin: false,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    setSending(true)
    try {
      const res = await fetch('/api/channel/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })
      const data = await res.json() as { message?: PrivateMessage; error?: string }
      if (data.message) {
        // Replace optimistic with real
        setMessages(prev =>
          prev.map(m => m.id === optimistic.id ? data.message! : m)
        )
        latestAtRef.current = data.message.created_at
      }
    } catch {
      // Revert optimistic on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setText(trimmed)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const charsLeft = 2000 - text.length
  const canSend = text.trim().length > 0 && !sending

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
          Загрузка...
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 shrink-0 border-b"
        style={{ background: '#FFF9E0', borderColor: '#FFE58F' }}
      >
        <span className="text-2xl">✉️</span>
        <div>
          <p className="text-sm font-bold" style={{ color: '#5C4200', fontFamily: 'var(--font-nunito)' }}>
            Наташе
          </p>
          <p className="text-xs" style={{ color: '#8B6914', fontFamily: 'var(--font-nunito)' }}>
            Обычно отвечает в течение дня
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3 pb-4">
        {error && (
          <p className="text-sm text-center" style={{ color: '#C0392B', fontFamily: 'var(--font-nunito)' }}>
            {error}
          </p>
        )}

        {messages.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 py-12">
            <span className="text-5xl">✉️</span>
            <p
              className="text-sm text-center"
              style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}
            >
              Напиши Наташе — она отвечает лично каждой участнице
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              Обычно отвечает в течение дня
            </p>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex shrink-0 ${msg.from_admin ? 'justify-start' : 'justify-end'}`}
          >
            <div style={{ maxWidth: '75%' }}>
              {msg.from_admin && (
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span
                    className="text-xs font-bold"
                    style={{ color: '#5C4200', fontFamily: 'var(--font-nunito)' }}
                  >
                    Наталья Томшина
                  </span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: '#FFD93D', color: '#5C4200', fontFamily: 'var(--font-nunito)' }}
                  >
                    Наставник
                  </span>
                </div>
              )}
              <div
                className="px-4 py-2.5 text-sm"
                style={{
                  background: msg.from_admin ? '#FFF9E0' : '#F0EEFF',
                  borderRadius: msg.from_admin ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-nunito)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  border: msg.from_admin ? '1px solid #FFE58F' : '1px solid var(--pur-br)',
                }}
              >
                {msg.text}
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
        className="shrink-0 px-4 py-3 flex items-end gap-3 border-t"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Написать Наташе..."
            maxLength={2000}
            rows={1}
            className="w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none border"
            style={{
              fontFamily: 'var(--font-nunito)',
              background: 'var(--bg)',
              color: 'var(--text)',
              borderColor: 'var(--border)',
              lineHeight: '1.5',
              overflow: 'hidden',
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
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="rounded-2xl px-5 font-semibold text-sm text-white disabled:opacity-40 shrink-0"
          style={{
            minHeight: 48,
            background: 'var(--pur)',
            fontFamily: 'var(--font-nunito)',
          }}
        >
          {sending ? '...' : 'Отправить'}
        </button>
      </div>
    </div>
  )
}
