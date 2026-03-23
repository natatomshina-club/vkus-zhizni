'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PostWithMeta } from '@/types/channel'
import PostCard from './PostCard'
import ComposeBar from './ComposeBar'

interface Props {
  channel: string
  memberId: string
  isAdmin: boolean
  memberName: string
  memberFullName: string | null
}

export default function PostFeed({ channel, memberId, isAdmin, memberName, memberFullName }: Props) {
  const [posts, setPosts] = useState<PostWithMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const afterRef = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const isPlates = channel === 'plates'

  // Initial load
  useEffect(() => {
    setLoading(true)
    setPosts([])
    setHasMore(false)
    afterRef.current = null
    setError('')

    fetch(`/api/channel/posts?channel=${encodeURIComponent(channel)}&limit=20`)
      .then(r => r.json())
      .then((data: { posts?: PostWithMeta[]; hasMore?: boolean; error?: string }) => {
        if (data.error) { setError(data.error); return }
        const list = data.posts ?? []
        setPosts(list)
        setHasMore(data.hasMore ?? false)
        if (list.length > 0) afterRef.current = list[0].created_at
      })
      .catch(() => setError('Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [channel])

  // Realtime subscription for instant updates
  useEffect(() => {
    const supabase = createClient()
    const channelName = `feed:${channel}:${Math.random().toString(36).slice(2)}`
    const sub = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'channel_posts',
      }, async (payload) => {
        const newRow = payload.new as { id: string; channel: string; parent_id: string | null; created_at: string }

        // Игнорируем события из других каналов
        if (newRow.channel !== channel) return

        // Если это комментарий — увеличить счётчик у родительского поста
        if (newRow.parent_id) {
          setPosts(prev => prev.map(p =>
            p.id === newRow.parent_id
              ? { ...p, comments_count: p.comments_count + 1 }
              : p
          ))
          return
        }

        // Иначе новый пост — загружаем с именем автора
        const res = await fetch(
          `/api/channel/posts?channel=${encodeURIComponent(channel)}&after=${encodeURIComponent(new Date(Date.now() - 5000).toISOString())}`
        )
        if (!res.ok) return
        const data = await res.json() as { posts?: PostWithMeta[] }
        const newPosts = data.posts ?? []
        if (newPosts.length > 0) {
          afterRef.current = newPosts[0].created_at
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id))
            const trulyNew = newPosts.filter(p => !existingIds.has(p.id))
            return trulyNew.length > 0 ? [...trulyNew, ...prev] : prev
          })
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'channel_posts',
      }, (payload) => {
        const updated = payload.new as { id: string; channel: string; likes_count: number }
        // Игнорируем события из других каналов
        if (updated.channel !== channel) return
        setPosts(prev => prev.map(p =>
          p.id === updated.id
            ? { ...p, likes_count: updated.likes_count }
            : p
        ))
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'channel_posts',
      }, (payload) => {
        const deletedId = (payload.old as { id?: string }).id
        if (deletedId) setPosts(prev => prev.filter(p => p.id !== deletedId))
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [channel])

  // Polling every 30s (fallback)
  useEffect(() => {
    const id = setInterval(async () => {
      if (!afterRef.current) return
      try {
        const res = await fetch(
          `/api/channel/posts?channel=${encodeURIComponent(channel)}&after=${encodeURIComponent(afterRef.current)}`
        )
        if (!res.ok) return
        const data = await res.json() as { posts?: PostWithMeta[] }
        const newPosts = data.posts ?? []
        if (newPosts.length > 0) {
          afterRef.current = newPosts[0].created_at
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id))
            const trulyNew = newPosts.filter(p => !existingIds.has(p.id))
            return trulyNew.length > 0 ? [...trulyNew, ...prev] : prev
          })
        }
      } catch {
        // silent polling failure
      }
    }, 30_000)
    return () => clearInterval(id)
  }, [channel])

  // Force overflow recalc when images load inside the scroll container
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      // presence of observer triggers layout recalc on content resize
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  async function loadMore() {
    if (loadingMore || posts.length === 0) return
    setLoadingMore(true)
    try {
      const cursor = posts[posts.length - 1].created_at
      const res = await fetch(
        `/api/channel/posts?channel=${encodeURIComponent(channel)}&limit=20&cursor=${encodeURIComponent(cursor)}`
      )
      const data = await res.json() as { posts?: PostWithMeta[]; hasMore?: boolean }
      const more = data.posts ?? []
      setPosts(prev => [...prev, ...more])
      setHasMore(data.hasMore ?? false)
    } finally {
      setLoadingMore(false)
    }
  }

  function handlePostCreated(post: PostWithMeta) {
    setPosts(prev => {
      const existingIds = new Set(prev.map(p => p.id))
      return existingIds.has(post.id) ? prev : [post, ...prev]
    })
    afterRef.current = post.created_at
  }

  function handleDelete(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col gap-3 px-4 py-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl p-4 animate-pulse"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full" style={{ background: 'var(--border)' }} />
              <div className="flex flex-col gap-1.5">
                <div className="w-32 h-3 rounded-full" style={{ background: 'var(--border)' }} />
                <div className="w-20 h-2.5 rounded-full" style={{ background: 'var(--border)' }} />
              </div>
            </div>
            <div className="w-full h-3 rounded-full mb-2" style={{ background: 'var(--border)' }} />
            <div className="w-3/4 h-3 rounded-full" style={{ background: 'var(--border)' }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Plates banner */}
      {(isPlates || channel === 'boltalka') && (
        <div
          className="mx-4 mt-4 rounded-xl px-4 py-2.5 text-xs font-semibold text-center shrink-0"
          style={{ background: '#FFF3C0', color: '#5C4200', fontFamily: 'var(--font-nunito)', border: '1px solid #FFD93D' }}
        >
          📷 Фото удаляются автоматически через 72 часа
        </div>
      )}

      {/* Feed scroll area */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {error && (
          <p className="text-sm text-center" style={{ color: '#C0392B', fontFamily: 'var(--font-nunito)' }}>
            {error}
          </p>
        )}

        {posts.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <span className="text-3xl">💬</span>
            <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              Пока никто ничего не написал. Будь первой!
            </p>
          </div>
        )}

        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            currentMemberId={memberId}
            isAdmin={isAdmin}
            memberName={memberName}
            memberFullName={memberFullName}
            onDelete={handleDelete}
          />
        ))}

        {hasMore && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="self-center text-sm px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50"
            style={{
              background: 'var(--bg)',
              color: 'var(--pur)',
              border: '1px solid var(--pur-br)',
              fontFamily: 'var(--font-nunito)',
            }}
          >
            {loadingMore ? 'Загружаю...' : 'Загрузить ещё'}
          </button>
        )}
      </div>

      {/* Compose bar — pb-[64px] reserves space under fixed MobileNav on mobile */}
      <div className="shrink-0 pb-[64px] lg:pb-0">
        <ComposeBar
          channel={channel}
          memberId={memberId}
          isAdmin={isAdmin}
          memberName={memberName}
          memberFullName={memberFullName}
          onPostCreated={handlePostCreated}
        />
      </div>
    </div>
  )
}
