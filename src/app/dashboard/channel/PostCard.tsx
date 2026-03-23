'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PostWithMeta } from '@/types/channel'

const AVATAR_COLORS = ['#7C5CFC', '#2A9D5C', '#FF9F43', '#FF6B9D', '#4ECDC4']

function getAvatarColor(memberId: string): string {
  let hash = 0
  for (let i = 0; i < memberId.length; i++) {
    hash = memberId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string | null, fullName: string | null): string {
  const src = fullName ?? name ?? '?'
  const parts = src.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

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

const MEAL_TAG_LABELS: Record<string, string> = {
  breakfast: '🌅 Завтрак',
  lunch: '🍽️ Обед/Ужин',
  snack: '🥗 Перекус',
}

interface Props {
  post: PostWithMeta
  currentMemberId: string
  isAdmin: boolean
  memberName: string
  memberFullName: string | null
  onDelete: (id: string) => void
}

export default function PostCard({ post, currentMemberId, isAdmin, memberName, memberFullName, onDelete }: Props) {
  const [liked, setLiked] = useState(post.liked_by_me)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<PostWithMeta[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [showFaqForm, setShowFaqForm] = useState(false)
  const [faqQuestion, setFaqQuestion] = useState('')
  const [faqAnswer, setFaqAnswer] = useState(post.text ?? '')
  const [faqCategory, setFaqCategory] = useState('')
  const [savingFaq, setSavingFaq] = useState(false)
  const [faqSaved, setFaqSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const realtimeChannel = useRef(`comments:${post.id}:${Math.random().toString(36).slice(2)}`)

  const isOwn = post.member_id === currentMemberId
  const isMediaExpired =
    !post.media_url &&
    post.media_expires_at !== null &&
    new Date(post.media_expires_at) < new Date()

  const cardStyle = post.is_pinned
    ? { background: 'var(--card)', border: '2px solid var(--pur)' }
    : post.is_ai_reply
    ? { background: '#FFFBEE', border: '1px solid #FFE58F' }
    : { background: 'var(--card)', border: '1px solid var(--border)' }

  async function loadComments() {
    if (loadingComments) return
    setLoadingComments(true)
    try {
      const res = await fetch(`/api/channel/posts/${post.id}/comments`)
      if (res.ok) {
        const data = await res.json() as { comments: PostWithMeta[] }
        setComments(data.comments)
      }
    } finally {
      setLoadingComments(false)
    }
  }

  function toggleComments() {
    if (!showComments && comments.length === 0) loadComments()
    setShowComments(v => !v)
  }

  async function handleSendComment() {
    const trimmed = commentText.trim()
    if (!trimmed || sendingComment) return
    setSendingComment(true)
    try {
      const res = await fetch(`/api/channel/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      })
      const data = await res.json() as { comment?: PostWithMeta }
      if (data.comment) {
        const commentWithMember = {
          ...data.comment,
          member: {
            name: memberName,
            full_name: memberFullName,
            role: isAdmin ? 'admin' : 'user',
          },
        }
        setComments(prev => [...prev, commentWithMember])
        setCommentText('')
      }
    } finally {
      setSendingComment(false)
    }
  }

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    onDelete(post.id)
    await fetch(`/api/channel/posts/${post.id}`, { method: 'DELETE' }).catch(() => {})
  }

  async function handleSaveFaq() {
    if (!faqQuestion.trim() || !faqAnswer.trim() || !faqCategory.trim()) return
    setSavingFaq(true)
    try {
      const res = await fetch(`/api/channel/posts/${post.id}/save-to-faq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: faqQuestion, answer: faqAnswer, category: faqCategory }),
      })
      if (res.ok) { setFaqSaved(true); setShowFaqForm(false) }
    } finally {
      setSavingFaq(false)
    }
  }

  async function handleLike() {
    // Optimistic update
    setLiked(prev => !prev)
    setLikesCount(prev => liked ? Math.max(0, prev - 1) : prev + 1)
    try {
      const res = await fetch(`/api/channel/posts/${post.id}/like`, { method: 'POST' })
      const data = await res.json() as { liked?: boolean; likes_count?: number }
      if (data.likes_count !== undefined) {
        setLikesCount(data.likes_count)
        setLiked(data.liked ?? !liked)
      }
    } catch {
      // Revert on network error
      setLiked(prev => !prev)
      setLikesCount(prev => liked ? prev + 1 : Math.max(0, prev - 1))
    }
  }

  useEffect(() => {
    setLikesCount(post.likes_count)
  }, [post.likes_count])

  useEffect(() => {
    if (!showComments) return

    const supabase = createClient()
    const sub = supabase
      .channel(realtimeChannel.current)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'channel_posts',
        filter: `parent_id=eq.${post.id}`,
      }, async () => {
        const res = await fetch(`/api/channel/posts/${post.id}/comments`)
        if (!res.ok) return
        const data = await res.json() as { comments?: PostWithMeta[] }
        if (data.comments) setComments(data.comments)
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'channel_posts',
      }, (payload) => {
        setComments(prev => prev.filter(c => c.id !== (payload.old as { id: string }).id))
      })
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [showComments, post.id])

  const memberData = Array.isArray(post.member) ? post.member[0] : post.member
  const avatarColor = getAvatarColor(post.member_id)
  const initials = getInitials(memberData?.name ?? null, memberData?.full_name ?? null)
  const displayName = memberData?.full_name ?? memberData?.name ?? 'Участница'
  const isAuthorAdmin = (memberData as { role?: string } | null)?.role === 'admin'

  return (
    <div className="rounded-2xl overflow-hidden shrink-0" style={cardStyle}>
      {post.is_pinned && (
        <div
          className="px-4 py-1 text-xs font-semibold"
          style={{ background: 'var(--pur)', color: '#fff', fontFamily: 'var(--font-nunito)' }}
        >
          📌 Закреплено
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ width: 36, height: 36, background: avatarColor, fontFamily: 'var(--font-nunito)' }}
          >
            {post.is_ai_reply ? '🤖' : initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className="text-sm font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                {post.is_ai_reply ? 'Ассистент клуба' : displayName}
              </span>
              {isAuthorAdmin && !post.is_ai_reply && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: '#FFD93D', color: '#5C4200', fontFamily: 'var(--font-nunito)' }}
                >
                  Наставник
                </span>
              )}
              {post.is_ai_reply && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: '#FFD93D', color: '#5C4200', fontFamily: 'var(--font-nunito)' }}
                >
                  ИИ
                </span>
              )}
              {post.meal_tag && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'var(--pur-lt)', color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
                >
                  {MEAL_TAG_LABELS[post.meal_tag] ?? post.meal_tag}
                </span>
              )}
            </div>
            <p className="text-[11px]" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              {formatTime(post.created_at)}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isAdmin && !faqSaved && (
              <button
                type="button"
                onClick={() => setShowFaqForm(v => !v)}
                className="rounded-lg px-2 py-1 transition-all"
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-nunito)',
                  background: showFaqForm ? 'var(--pur)' : 'var(--pur-lt)',
                  color: showFaqForm ? '#fff' : 'var(--pur)',
                }}
              >
                📚 В FAQ
              </button>
            )}
            {faqSaved && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: '#e8f5e9', color: '#2D6A4F', fontFamily: 'var(--font-nunito)' }}
              >
                ✓ В FAQ
              </span>
            )}
            {isOwn && !post.is_pinned && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg p-1 transition-all"
                style={{ opacity: deleting ? 0.3 : 0.5, fontSize: 16, lineHeight: 1 }}
                aria-label="Удалить"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        {/* FAQ form */}
        {showFaqForm && (
          <div
            className="rounded-xl p-3 mb-3 flex flex-col gap-2"
            style={{ background: 'var(--pur-lt)', border: '1px solid var(--pur-br)' }}
          >
            <input
              placeholder="Вопрос"
              value={faqQuestion}
              onChange={e => setFaqQuestion(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none"
              style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--pur-br)', background: '#fff', color: 'var(--text)' }}
            />
            <textarea
              placeholder="Ответ"
              value={faqAnswer}
              onChange={e => setFaqAnswer(e.target.value)}
              rows={3}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none resize-none"
              style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--pur-br)', background: '#fff', color: 'var(--text)' }}
            />
            <input
              placeholder="Категория (например: Питание)"
              value={faqCategory}
              onChange={e => setFaqCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none"
              style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--pur-br)', background: '#fff', color: 'var(--text)' }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveFaq}
                disabled={savingFaq}
                className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                style={{ background: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
              >
                {savingFaq ? 'Сохраняю...' : 'Сохранить в FAQ'}
              </button>
              <button
                type="button"
                onClick={() => setShowFaqForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ background: 'var(--bg)', color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Post text */}
        {post.text && (
          <p
            className="text-sm leading-relaxed mb-3"
            style={{
              color: 'var(--text)',
              fontFamily: 'var(--font-nunito)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {post.text}
          </p>
        )}

        {/* Media */}
        {post.media_url && (
          <div className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.media_url}
              alt="фото"
              style={{
                width: '100%',
                height: 'auto',
                minHeight: '200px',
                maxHeight: '400px',
                objectFit: 'contain',
                borderRadius: '12px',
                display: 'block',
                backgroundColor: '#F0EEFF',
              }}
              onLoad={(e) => {
                (e.target as HTMLImageElement).style.minHeight = '0'
              }}
            />
          </div>
        )}
        {isMediaExpired && (
          <div
            className="mb-3 rounded-xl flex items-center justify-center py-6 text-sm gap-2"
            style={{
              background: 'var(--bg)',
              color: 'var(--muted)',
              border: '1px dashed var(--border)',
              fontFamily: 'var(--font-nunito)',
            }}
          >
            📷 Фото удалено (72ч)
          </div>
        )}

        {/* Like + comment row */}
        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={handleLike}
            className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all text-xs font-semibold"
            style={{
              fontFamily: 'var(--font-nunito)',
              background: liked ? '#FFE4EF' : 'var(--bg)',
              color: liked ? '#FF6B9D' : 'var(--muted)',
              border: `1px solid ${liked ? '#FF6B9D' : 'var(--border)'}`,
            }}
          >
            <span>{liked ? '❤️' : '🤍'}</span>
            {likesCount > 0 && <span>{likesCount}</span>}
          </button>

          {post.parent_id === null && (
            <button
              type="button"
              onClick={toggleComments}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all text-xs font-semibold"
              style={{
                fontFamily: 'var(--font-nunito)',
                background: showComments ? 'var(--pur-lt)' : 'var(--bg)',
                color: showComments ? 'var(--pur)' : 'var(--muted)',
                border: `1px solid ${showComments ? 'var(--pur-br)' : 'var(--border)'}`,
              }}
            >
              <span>💬</span>
              <span style={{
                background: post.comments_count > 0 ? '#FF6B9D' : 'var(--border)',
                color: post.comments_count > 0 ? '#fff' : 'var(--muted)',
                borderRadius: '999px',
                padding: '2px 8px',
                fontSize: 12,
                fontWeight: 700,
              }}>
                {post.comments_count}
              </span>
            </button>
          )}
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-3 flex flex-col gap-2">
            {loadingComments && (
              <p className="text-xs text-center" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                Загрузка...
              </p>
            )}
            {!loadingComments && comments.length === 0 && (
              <p className="text-xs text-center" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                Комментариев пока нет
              </p>
            )}
            {comments.map(c => {
              const cm = Array.isArray(c.member) ? c.member[0] : c.member
              const cIsAdmin = (cm as { role?: string } | null)?.role === 'admin'
              return (
                <div
                  key={c.id}
                  className="rounded-xl p-3"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
                      style={{
                        width: 22,
                        height: 22,
                        fontSize: 9,
                        background: getAvatarColor(c.member_id),
                        fontFamily: 'var(--font-nunito)',
                      }}
                    >
                      {c.is_ai_reply ? '🤖' : getInitials(cm?.name ?? null, cm?.full_name ?? null)}
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                      {c.is_ai_reply ? 'Ассистент' : (cm?.full_name ?? cm?.name ?? 'Участница')}
                    </span>
                    {cIsAdmin && !c.is_ai_reply && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: '#FFD93D', color: '#5C4200', fontFamily: 'var(--font-nunito)' }}
                      >
                        Наставник
                      </span>
                    )}
                    <span className="text-[10px]" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                      {formatTime(c.created_at)}
                    </span>
                  </div>
                  {c.text && (
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)', whiteSpace: 'pre-wrap' }}
                    >
                      {c.text}
                    </p>
                  )}
                </div>
              )
            })}

            {/* Compose comment */}
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendComment() }}
                placeholder="Написать комментарий..."
                maxLength={1000}
                className="flex-1 px-3 py-2 rounded-xl text-xs border outline-none"
                style={{
                  fontFamily: 'var(--font-nunito)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  borderColor: 'var(--border)',
                }}
              />
              <button
                type="button"
                onClick={handleSendComment}
                disabled={!commentText.trim() || sendingComment}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 shrink-0"
                style={{ background: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}
              >
                {sendingComment ? '...' : '→'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
