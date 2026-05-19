'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Notification = {
  id: string
  type: 'reply' | 'private_message' | 'level_up'
  type_extra?: string | null
  text: string
  link: string
  is_read: boolean
  created_at: string
}

function iconForLink(link: string): string {
  if (link.includes('ch=direct')) return '💌'
  if (link.includes('ch=plates')) return '🍽️'
  if (link.includes('ch=marathon')) return '🔥'
  return '💬'
}

export default function NotificationsBlock() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json() as { notifications?: Notification[] }
      setNotifications((data.notifications ?? []).filter(n => !n.is_read))
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [load])

  async function markAllRead() {
    await fetch('/api/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }).catch(() => {})
    setNotifications([])
  }

  async function handleClick(n: Notification) {
    setNotifications(prev => prev.filter(x => x.id !== n.id))
    fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [n.id] }),
    }).catch(() => {})
    router.push(n.link)
  }

  if (loading || notifications.length === 0) return null

  const levelUpNotifications = notifications.filter(n => n.type === 'level_up')
  const otherNotifications = notifications.filter(n => n.type !== 'level_up')

  if (levelUpNotifications.length === 0 && otherNotifications.length === 0) return null

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--card)', border: '1px solid var(--pur-br, #DDD5FF)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
          🔔 Уведомления
        </p>
        <button
          type="button"
          onClick={markAllRead}
          className="text-xs font-semibold px-2.5 py-1 rounded-lg"
          style={{ background: 'var(--pur-light)', color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
        >
          Все прочитаны ✓
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {levelUpNotifications.map(n => (
          <button
            key={n.id}
            type="button"
            onClick={() => handleClick(n)}
            className="flex items-start gap-3 py-3 px-3 rounded-xl text-left w-full transition-opacity active:opacity-70"
            style={{ background: '#FFF9E6', border: '1px solid #FFD93D' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug" style={{ color: '#5C4200', fontFamily: 'var(--font-nunito)' }}>
                {n.text}
              </p>
              <p className="text-xs mt-1" style={{ color: '#7A5500', fontFamily: 'var(--font-nunito)' }}>
                → Перейти к вебинарам
              </p>
            </div>
            <span className="text-xs shrink-0 mt-0.5" style={{ color: '#7A5500' }}>→</span>
          </button>
        ))}
        {otherNotifications.map(n => (
          <button
            key={n.id}
            type="button"
            onClick={() => handleClick(n)}
            className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-left w-full transition-opacity active:opacity-70"
            style={{ background: 'var(--pur-light)' }}
          >
            <span className="text-base leading-none shrink-0">{iconForLink(n.link)}</span>
            <p className="text-sm font-medium" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
              {n.text}
            </p>
            <span className="ml-auto text-xs shrink-0" style={{ color: 'var(--pur)' }}>→</span>
          </button>
        ))}
      </div>
    </div>
  )
}
