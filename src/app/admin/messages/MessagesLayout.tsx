'use client'

import { useState, useEffect, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface MemberInfo {
  id: string
  name: string | null
  full_name: string | null
  email: string
  status: string
  created_at: string
  weight?: number | null
}

interface Dialog {
  member_id: string
  member: MemberInfo | null
  last_message: string
  last_message_at: string
  unread_count: number
}

interface PrivateMessage {
  id: string
  member_id: string
  text: string
  from_admin: boolean
  is_read: boolean
  created_at: string
}

interface Marathon {
  id: string
  title: string
  status: string
  ends_at: string | null
  next_date: string | null
}

interface Props {
  initialDialogs: Dialog[]
  marathon: Marathon | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86_400_000)
  const postDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const hhmm = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  if (postDay.getTime() === today.getTime()) return hhmm
  if (postDay.getTime() === yesterday.getTime()) return 'вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function formatFull(iso: string): string {
  const d = new Date(iso)
  const hhmm = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const yesterday = new Date(today.getTime() - 86_400_000)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  if (isToday) return `сегодня ${hhmm}`
  if (isYesterday) return `вчера ${hhmm}`
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ` ${hhmm}`
}

function getMemberDay(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000) + 1
}

function getStatusLabel(status: string): string {
  if (status === 'trial') return 'Триал'
  if (status === 'active') return 'Активная'
  if (status === 'expired') return 'Истёк'
  return status
}

function getMemberName(m: MemberInfo | null): string {
  if (!m) return 'Участница'
  return m.full_name ?? m.name ?? m.email
}

// ── Dialog row ────────────────────────────────────────────────────────────────

function DialogRow({
  dialog,
  active,
  onClick,
}: {
  dialog: Dialog
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-3 flex flex-col gap-1 transition-all"
      style={{
        background: active ? 'var(--pur-lt)' : 'transparent',
        borderLeft: active ? '3px solid var(--pur)' : '3px solid transparent',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {dialog.unread_count > 0 && (
            <span
              className="shrink-0 rounded-full"
              style={{ width: 8, height: 8, background: '#E53E3E' }}
            />
          )}
          <span
            className="text-sm font-semibold truncate"
            style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}
          >
            {getMemberName(dialog.member)}
          </span>
        </div>
        <span
          className="text-[11px] shrink-0"
          style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}
        >
          {formatTime(dialog.last_message_at)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p
          className="text-xs truncate"
          style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}
        >
          {dialog.last_message}
        </p>
        {dialog.unread_count > 0 && (
          <span
            className="shrink-0 rounded-full text-[10px] font-bold text-white px-1.5 py-0.5"
            style={{ background: '#E53E3E', fontFamily: 'var(--font-nunito)' }}
          >
            {dialog.unread_count}
          </span>
        )}
      </div>
    </button>
  )
}

// ── Marathon block ────────────────────────────────────────────────────────────

function MarathonBlock({
  marathon,
  onCreated,
  onFinished,
}: {
  marathon: Marathon | null
  onCreated: (m: Marathon) => void
  onFinished: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', starts_at: '', ends_at: '', next_date: '' })
  const [creating, setCreating] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [createError, setCreateError] = useState('')

  async function handleCreate() {
    setCreateError('')
    if (!form.title.trim() || !form.starts_at || !form.ends_at) {
      setCreateError('Заполни название и даты')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/marathons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          starts_at: form.starts_at,
          ends_at: form.ends_at,
          next_date: form.next_date.trim() || null,
        }),
      })
      const data = await res.json() as { marathon?: Marathon; error?: string }
      if (data.error) { setCreateError(data.error); return }
      if (data.marathon) {
        onCreated(data.marathon)
        setShowForm(false)
        setForm({ title: '', starts_at: '', ends_at: '', next_date: '' })
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleFinish() {
    if (!marathon) return
    if (!confirm(`Завершить марафон "${marathon.title}"?`)) return
    setFinishing(true)
    try {
      await fetch(`/api/admin/marathons/${marathon.id}/finish`, { method: 'POST' })
      onFinished()
    } finally {
      setFinishing(false)
    }
  }

  return (
    <div
      className="shrink-0 border-t px-4 py-4"
      style={{ borderColor: 'var(--border)' }}
    >
      {marathon ? (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            Марафон
          </p>
          <p className="text-sm font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
            🔥 {marathon.title}
          </p>
          {marathon.ends_at && (
            <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              До {new Date(marathon.ends_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </p>
          )}
          <button
            type="button"
            onClick={handleFinish}
            disabled={finishing}
            className="w-full py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
            style={{ background: '#FFF3C0', color: '#5C4200', fontFamily: 'var(--font-nunito)' }}
          >
            {finishing ? 'Завершаю...' : '🏁 Завершить'}
          </button>
        </div>
      ) : showForm ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
            Новый марафон
          </p>
          <input
            placeholder="Название"
            value={form.title}
            maxLength={100}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl text-xs border outline-none"
            style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
          <input
            type="date"
            value={form.starts_at}
            onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl text-xs border outline-none"
            style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
          <input
            type="date"
            value={form.ends_at}
            onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl text-xs border outline-none"
            style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
          <input
            placeholder="Следующий (напр. апрель 2026)"
            value={form.next_date}
            onChange={e => setForm(f => ({ ...f, next_date: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl text-xs border outline-none"
            style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
          {createError && (
            <p className="text-[11px]" style={{ color: '#C0392B', fontFamily: 'var(--font-nunito)' }}>{createError}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
              style={{ background: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
            >
              {creating ? 'Создаю...' : 'Создать'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setCreateError('') }}
              className="px-3 py-2 rounded-xl text-xs"
              style={{ background: 'var(--bg)', color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full py-2.5 rounded-xl text-xs font-bold text-white"
          style={{ background: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
        >
          + Создать марафон
        </button>
      )}
    </div>
  )
}

// ── Chat panel ────────────────────────────────────────────────────────────────

function ChatPanel({
  memberId,
  memberInfo,
  onBack,
}: {
  memberId: string
  memberInfo: MemberInfo | null
  onBack?: () => void
}) {
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [member, setMember] = useState<MemberInfo | null>(memberInfo)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const latestAtRef = useRef<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setMessages([])
    fetch(`/api/admin/direct/${memberId}`)
      .then(r => r.json())
      .then((data: { messages?: PrivateMessage[]; member?: MemberInfo }) => {
        const list = data.messages ?? []
        setMessages(list)
        if (data.member) setMember(data.member)
        if (list.length > 0) latestAtRef.current = list[list.length - 1].created_at
      })
      .finally(() => setLoading(false))
  }, [memberId])

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [loading, messages.length])

  // Polling every 15s
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/direct/${memberId}`)
        if (!res.ok) return
        const data = await res.json() as { messages?: PrivateMessage[] }
        const incoming = data.messages ?? []
        if (incoming.length === 0) return
        const latest = incoming[incoming.length - 1].created_at
        if (latest !== latestAtRef.current) {
          latestAtRef.current = latest
          setMessages(incoming)
        }
      } catch { /* silent */ }
    }, 15_000)
    return () => clearInterval(id)
  }, [memberId])

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setReplyText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 96) + 'px'
  }

  async function handleSend() {
    const trimmed = replyText.trim()
    if (!trimmed || sending) return

    const optimistic: PrivateMessage = {
      id: `opt-${Date.now()}`,
      member_id: memberId,
      text: trimmed,
      from_admin: true,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setReplyText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    setSending(true)
    try {
      const res = await fetch(`/api/admin/direct/${memberId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })
      const data = await res.json() as { message?: PrivateMessage }
      if (data.message) {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? data.message! : m))
        latestAtRef.current = data.message.created_at
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setReplyText(trimmed)
    } finally {
      setSending(false)
    }
  }

  const canSend = replyText.trim().length > 0 && !sending
  const charsLeft = 2000 - replyText.length

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div
        className="shrink-0 flex items-center gap-3 px-5 py-4 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        {onBack && (
          <button type="button" onClick={onBack} className="text-xl mr-1" style={{ color: 'var(--text)' }}>←</button>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
            {getMemberName(member)}
            {member && (
              <span className="font-normal ml-2" style={{ color: 'var(--muted)' }}>
                · {getStatusLabel(member.status)} · день {getMemberDay(member.created_at)}
              </span>
            )}
          </p>
          {member?.weight && (
            <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              Вес: {member.weight} кг · {member.email}
            </p>
          )}
          {!member?.weight && member?.email && (
            <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              {member.email}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {loading && (
          <p className="text-sm text-center" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            Загрузка...
          </p>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 py-16">
            <span className="text-4xl">💬</span>
            <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              Сообщений пока нет
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
                  <span className="text-xs font-bold" style={{ color: '#5C4200', fontFamily: 'var(--font-nunito)' }}>
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
                {formatFull(msg.created_at)}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply compose */}
      <div
        className="shrink-0 px-4 py-3 flex items-end gap-3 border-t"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={replyText}
            onChange={handleTextChange}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Ответить участнице..."
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
          style={{ minHeight: 48, background: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
        >
          {sending ? '...' : 'Ответить'}
        </button>
      </div>
    </div>
  )
}

// ── Main layout ───────────────────────────────────────────────────────────────

export default function MessagesLayout({ initialDialogs, marathon: initialMarathon }: Props) {
  const [dialogs, setDialogs] = useState<Dialog[]>(initialDialogs)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const [marathon, setMarathon] = useState<Marathon | null>(initialMarathon)

  const selectedDialog = dialogs.find(d => d.member_id === selectedId) ?? null

  // Polling dialogs list every 30s
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/admin/direct')
        if (!res.ok) return
        const data = await res.json() as { dialogs?: Dialog[] }
        if (data.dialogs) setDialogs(data.dialogs)
      } catch { /* silent */ }
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  function handleSelectDialog(memberId: string) {
    setSelectedId(memberId)
    // Mark as read locally
    setDialogs(prev => prev.map(d =>
      d.member_id === memberId ? { ...d, unread_count: 0 } : d
    ))
    setMobileView('chat')
  }

  const leftColumn = (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="shrink-0 px-4 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <a href="/dashboard" className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
            ← Клуб
          </a>
        </div>
        <h1 className="text-base font-bold mt-2" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
          ✉️ Личные сообщения
        </h1>
      </div>

      {/* Dialog list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {dialogs.length === 0 && (
          <p
            className="text-sm text-center py-8"
            style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}
          >
            Сообщений пока нет
          </p>
        )}
        {dialogs.map(d => (
          <DialogRow
            key={d.member_id}
            dialog={d}
            active={d.member_id === selectedId}
            onClick={() => handleSelectDialog(d.member_id)}
          />
        ))}
      </div>

      {/* Marathon block */}
      <MarathonBlock
        marathon={marathon}
        onCreated={m => setMarathon(m)}
        onFinished={() => setMarathon(null)}
      />
    </div>
  )

  return (
    <>
      {/* ── DESKTOP ── */}
      <div className="hidden lg:flex h-full w-full overflow-hidden">
        <div className="w-[280px] shrink-0 h-full">
          {leftColumn}
        </div>
        <div className="flex-1 h-full flex flex-col overflow-hidden">
          {selectedId ? (
            <ChatPanel
              key={selectedId}
              memberId={selectedId}
              memberInfo={selectedDialog?.member ?? null}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl">💬</span>
                <p
                  className="text-sm mt-3"
                  style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}
                >
                  Выбери диалог чтобы ответить участнице
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="flex lg:hidden h-full flex-col overflow-hidden">
        {mobileView === 'list' ? (
          <div className="h-full overflow-hidden">
            {leftColumn}
          </div>
        ) : selectedId ? (
          <ChatPanel
            key={selectedId}
            memberId={selectedId}
            memberInfo={selectedDialog?.member ?? null}
            onBack={() => setMobileView('list')}
          />
        ) : null}
      </div>
    </>
  )
}
