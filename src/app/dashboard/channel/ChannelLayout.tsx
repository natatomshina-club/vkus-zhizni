'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Channel, ChannelSlug } from '@/types/channel'
import PostFeed from './PostFeed'
import ChannelFAQ from './ChannelFAQ'
import DirectChat from './DirectChat'

interface Props {
  channels: Channel[]
  memberId: string
  isAdmin: boolean
  memberName: string
  memberFullName: string | null
}

// ── Sidebar channel button ────────────────────────────────────────────────────

function LockedChannelButton({
  channel,
  onClickLocked,
}: {
  channel: Channel
  onClickLocked: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClickLocked}
      className="w-full flex items-center gap-2.5 px-3 rounded-xl text-left"
      style={{
        minHeight: 40,
        fontFamily: 'var(--font-nunito)',
        color: 'var(--muted)',
        opacity: 0.6,
        cursor: 'pointer',
      }}
    >
      <span className="text-base leading-none">{channel.icon}</span>
      <span className="text-sm font-medium truncate flex-1">{channel.label}</span>
      <span className="text-xs">🔒</span>
    </button>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[9px] uppercase tracking-widest px-3 mt-3 mb-1"
      style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}
    >
      {children}
    </p>
  )
}

// ── Channel content renderer ──────────────────────────────────────────────────

function ChannelContent({
  channel,
  memberId,
  isAdmin,
  memberName,
  memberFullName,
}: {
  channel: Channel
  memberId: string
  isAdmin: boolean
  memberName: string
  memberFullName: string | null
}) {
  if (channel.type === 'feed') {
    return (
      <PostFeed
        key={channel.slug}
        channel={channel.slug}
        memberId={memberId}
        isAdmin={isAdmin}
        memberName={memberName}
        memberFullName={memberFullName}
      />
    )
  }
  if (channel.type === 'faq') {
    return <ChannelFAQ isAdmin={isAdmin} />
  }
  if (channel.type === 'direct') {
    return <DirectChat />
  }
  return null
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ChannelLayout({ channels, memberId, isAdmin, memberName, memberFullName }: Props) {
  const unlockedChannels = channels.filter(c => !c.locked)
  const [activeSlug, setActiveSlug] = useState<ChannelSlug>(
    unlockedChannels[0]?.slug ?? 'boltalka'
  )
  const [lockedMsg, setLockedMsg] = useState(false)
  const [unreadDirect, setUnreadDirect] = useState(0)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  // Fetch unread counts for channel feed items
  const fetchUnreadCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/channel/unread')
      if (!res.ok) return
      const data = await res.json() as { counts: Record<string, number> }
      setUnreadCounts(data.counts ?? {})
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchUnreadCounts()
    const id = setInterval(fetchUnreadCounts, 60_000)
    return () => clearInterval(id)
  }, [fetchUnreadCounts])

  // Fetch direct message unread count
  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch('/api/channel/notifications/unread')
        if (!res.ok) return
        const data = await res.json() as { unread_count: number }
        setUnreadDirect(data.unread_count ?? 0)
      } catch { /* silent */ }
    }
    fetchUnread()
    const id = setInterval(fetchUnread, 60_000)
    return () => clearInterval(id)
  }, [])

  // Mark channel as seen and clear its unread count
  const markSeen = useCallback(async (slug: string) => {
    setUnreadCounts(prev => ({ ...prev, [slug]: 0 }))
    try {
      await fetch('/api/channel/seen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: slug }),
      })
    } catch { /* silent */ }
  }, [])

  // Mark initial channel as seen on mount
  useEffect(() => {
    markSeen(activeSlug)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeChannel    = unlockedChannels.find(c => c.slug === activeSlug) ?? unlockedChannels[0]
  const mainChannels     = channels.filter(c => !c.group)
  const personalChannels = channels.filter(c => c.group === 'personal')
  const marathonChannels = channels.filter(c => c.group === 'marathon')

  function handleLockedClick() {
    setLockedMsg(true)
    setTimeout(() => setLockedMsg(false), 3000)
  }

  function handleChannelClick(slug: ChannelSlug, isDirect: boolean) {
    setActiveSlug(slug)
    if (isDirect) {
      setUnreadDirect(0)
    } else {
      markSeen(slug)
    }
  }

  function renderChannelButton(ch: Channel) {
    if (ch.locked) {
      return (
        <div key={ch.slug}>
          <LockedChannelButton channel={ch} onClickLocked={handleLockedClick} />
          {lockedMsg && (
            <p
              className="text-[11px] px-3 py-1.5 mx-2 rounded-lg mt-0.5"
              style={{ background: '#FFF3C0', color: '#5C4200', fontFamily: 'var(--font-nunito)' }}
            >
              Марафон доступен в полном клубе
            </p>
          )}
        </div>
      )
    }
    const isDirect = ch.type === 'direct'
    const isActive = ch.slug === activeSlug
    const unread = isDirect ? unreadDirect : (unreadCounts[ch.slug] ?? 0)
    return (
      <button
        key={ch.slug}
        type="button"
        onClick={() => handleChannelClick(ch.slug, isDirect)}
        className="w-full flex items-center gap-2.5 px-3 rounded-xl text-left transition-all"
        style={{
          minHeight: 40,
          fontFamily: 'var(--font-nunito)',
          background: isActive ? (isDirect ? '#FFF3C0' : 'var(--pur)') : 'transparent',
          color:      isActive ? (isDirect ? '#5C4200'  : '#fff')       : 'var(--text)',
          opacity: isActive ? 1 : 0.75,
        }}
      >
        <span className="text-base leading-none">{ch.icon}</span>
        <span className="text-sm font-medium truncate flex-1">{ch.label}</span>
        {unread > 0 && (
          <span
            className="rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
            style={{
              minWidth: unread > 9 ? 18 : 16,
              height: 16,
              paddingInline: 4,
              background: '#E53E3E',
            }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
    )
  }

  function renderMobilePill(ch: Channel) {
    if (ch.locked) {
      return (
        <button
          key={ch.slug}
          type="button"
          onClick={handleLockedClick}
          className="flex items-center gap-1.5 px-3 rounded-full whitespace-nowrap text-xs font-semibold shrink-0"
          style={{
            minHeight: 36,
            fontFamily: 'var(--font-nunito)',
            background: 'var(--bg)',
            color: 'var(--muted)',
            border: '1px solid var(--border)',
            opacity: 0.6,
          }}
        >
          <span>{ch.icon}</span>
          <span>{ch.label}</span>
          <span>🔒</span>
        </button>
      )
    }
    const active   = ch.slug === activeSlug
    const isDirect = ch.type === 'direct'
    const unread = isDirect ? unreadDirect : (unreadCounts[ch.slug] ?? 0)
    return (
      <button
        key={ch.slug}
        type="button"
        onClick={() => handleChannelClick(ch.slug, isDirect)}
        className="flex items-center gap-1.5 px-3 rounded-full whitespace-nowrap text-xs font-semibold shrink-0 transition-all"
        style={{
          minHeight: 36,
          fontFamily: 'var(--font-nunito)',
          background:  active ? (isDirect ? '#FFD93D' : 'var(--pur)') : 'var(--bg)',
          color:       active ? (isDirect ? '#5C4200'  : '#fff')       : 'var(--muted)',
          border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
        }}
      >
        <span className="relative">
          {ch.icon}
          {unread > 0 && (
            <span
              className="absolute -top-1 -right-1 rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-white"
              style={{
                minWidth: unread > 9 ? 14 : 12,
                height: 12,
                paddingInline: 2,
                background: '#E53E3E',
              }}
            />
          )}
        </span>
        <span>{ch.label}</span>
        {unread > 0 && (
          <span
            className="rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{
              minWidth: 14,
              height: 14,
              paddingInline: 3,
              background: '#E53E3E',
            }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="h-full overflow-hidden">

      {/* ══════════════════════════════════════════════
          DESKTOP  (lg+)
      ══════════════════════════════════════════════ */}
      <div className="hidden lg:flex h-full w-full overflow-hidden">

        {/* Left: channel list */}
        <div
          className="w-[200px] shrink-0 h-full flex flex-col overflow-y-auto border-r"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <div className="px-4 py-5 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
            <h1
              className="text-base font-bold"
              style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}
            >
              Чаты клуба
            </h1>
          </div>

          <div className="px-2 py-3 flex flex-col gap-0.5">
            {mainChannels.map(ch => renderChannelButton(ch))}

            {personalChannels.length > 0 && (
              <>
                <GroupLabel>Личное</GroupLabel>
                {personalChannels.map(ch => renderChannelButton(ch))}
              </>
            )}

            {marathonChannels.length > 0 && (
              <>
                <GroupLabel>Марафоны</GroupLabel>
                {marathonChannels.map(ch => renderChannelButton(ch))}
              </>
            )}
          </div>
        </div>

        {/* Right: content */}
        <div className="flex-1 h-full flex flex-col overflow-hidden">
          {/* Channel header */}
          <div
            className="flex items-center gap-3 px-6 py-4 border-b shrink-0"
            style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
          >
            <span className="text-xl">{activeChannel?.icon}</span>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                {activeChannel?.label}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                {activeChannel?.description}
              </p>
            </div>
          </div>

          {/* Channel body — fills remaining height */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {activeChannel && (
              <ChannelContent
                channel={activeChannel}
                memberId={memberId}
                isAdmin={isAdmin}
                memberName={memberName}
                memberFullName={memberFullName}
              />
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MOBILE  (< lg)
      ══════════════════════════════════════════════ */}
      <div className="flex lg:hidden h-full flex-col overflow-hidden">

        {/* Mobile header */}
        <header
          className="flex items-center px-4 py-4 shrink-0"
          style={{
            background: 'var(--bg)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <a href="/dashboard" className="mr-3 text-xl" style={{ color: 'var(--text)' }}>←</a>
          <h1
            className="text-base font-bold"
            style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}
          >
            Чаты клуба
          </h1>
        </header>

        {/* Channel pills */}
        <div
          className="flex gap-2 px-4 py-3 overflow-x-auto shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}
        >
          {channels.map(ch => renderMobilePill(ch))}
          {lockedMsg && (
            <span
              className="shrink-0 self-center text-[11px] px-3 py-1.5 rounded-full"
              style={{ background: '#FFF3C0', color: '#5C4200', fontFamily: 'var(--font-nunito)' }}
            >
              Марафон доступен в полном клубе
            </span>
          )}
        </div>

        {/* Channel body — fills remaining height (above MobileNav, pb-16 = MobileNav height) */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col pb-16">
          {activeChannel && (
            <ChannelContent
              channel={activeChannel}
              memberId={memberId}
              isAdmin={isAdmin}
              memberName={memberName}
              memberFullName={memberFullName}
            />
          )}
        </div>
      </div>
    </div>
  )
}
