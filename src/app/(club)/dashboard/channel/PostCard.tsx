'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PostWithMeta } from '@/types/channel'
import Avatar from '@/components/Avatar'

function getDisplayName(name: string | null, fullName: string | null): string {
  return fullName ?? name ?? 'Участница'
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
      canvas.width = width; canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85)
    }
    img.src = URL.createObjectURL(file)
  })
}

interface Props {
  post: PostWithMeta
  currentMemberId: string
  isAdmin: boolean
  isCurator: boolean
  memberName: string
  memberFullName: string | null
  onDelete: (id: string) => void
}

export default function PostCard({ post, currentMemberId, isAdmin, isCurator, memberName, memberFullName, onDelete }: Props) {
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

  // Post editing & menu
  const [showPostMenu, setShowPostMenu] = useState(false)
  const [confirmDeletePost, setConfirmDeletePost] = useState(false)
  const [editingPost, setEditingPost] = useState(false)
  const [editPostText, setEditPostText] = useState(post.text ?? '')
  const [savingEditPost, setSavingEditPost] = useState(false)
  const [editPostError, setEditPostError] = useState('')
  const [postText, setPostText] = useState(post.text)
  const [postEdited, setPostEdited] = useState(false)

  // Comment input
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [commentMediaFile, setCommentMediaFile] = useState<File | null>(null)
  const [commentMediaPreview, setCommentMediaPreview] = useState<string | null>(null)
  const commentFileRef = useRef<HTMLInputElement>(null)

  // Comment actions
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')
  const [editedCommentIds, setEditedCommentIds] = useState<Set<string>>(new Set())

  const realtimeChannel = useRef(`comments:${post.id}:${Math.random().toString(36).slice(2)}`)

  const isOwn = post.member_id === currentMemberId
  const isMediaExpired =
    !post.media_url &&
    post.media_expires_at !== null &&
    new Date(post.media_expires_at) < new Date()

  const canSendComment = (commentText.trim().length > 0 || commentMediaFile !== null) && !sendingComment

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

  function handleCommentFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) { setCommentMediaFile(null); setCommentMediaPreview(null); return }
    if (!file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) return
    setCommentMediaFile(file)
    setCommentMediaPreview(URL.createObjectURL(file))
  }

  function removeCommentMedia() {
    setCommentMediaFile(null)
    setCommentMediaPreview(null)
    if (commentFileRef.current) commentFileRef.current.value = ''
  }

  async function handleSendComment() {
    if (!canSendComment) return
    setSendingComment(true)
    try {
      let media_url: string | null = null

      if (commentMediaFile) {
        const isGif = commentMediaFile.type === 'image/gif'
        const uploadBlob = isGif ? commentMediaFile : await compressImage(commentMediaFile)
        const uploadName = isGif ? commentMediaFile.name : commentMediaFile.name.replace(/\.[^.]+$/, '.jpg')
        const uploadType = isGif ? commentMediaFile.type : 'image/jpeg'

        const urlRes = await fetch('/api/channel/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'comments', filename: uploadName, content_type: uploadType, size: uploadBlob.size }),
        })
        if (!urlRes.ok) throw new Error('Ошибка загрузки фото')
        const { signedUrl, publicUrl } = await urlRes.json() as { signedUrl: string; path: string; publicUrl: string }
        const uploadRes = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': uploadType }, body: uploadBlob })
        if (!uploadRes.ok) throw new Error('Ошибка загрузки фото')
        media_url = publicUrl
      }

      const trimmed = commentText.trim()
      const res = await fetch(`/api/channel/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed || undefined, media_url: media_url ?? undefined }),
      })
      const data = await res.json() as { comment?: PostWithMeta }
      if (data.comment) {
        setComments(prev => [...prev, {
          ...data.comment!,
          member: { name: memberName, full_name: memberFullName, role: isAdmin ? 'admin' : 'user' },
        }])
        setCommentText('')
        removeCommentMedia()
      }
    } finally {
      setSendingComment(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (deletingCommentId) return
    setDeletingCommentId(commentId)
    setConfirmDeleteId(null)
    try {
      await fetch(`/api/channel/posts/${commentId}`, { method: 'DELETE' })
      setComments(prev => prev.filter(c => c.id !== commentId))
    } finally {
      setDeletingCommentId(null)
    }
  }

  function handleStartEdit(c: PostWithMeta) {
    setEditingCommentId(c.id)
    setEditText(c.text ?? '')
    setActiveMenuId(null)
  }

  async function handleSaveEdit() {
    if (!editingCommentId || !editText.trim() || savingEdit) return
    setSavingEdit(true)
    setEditError('')
    const id = editingCommentId
    console.log('[handleSaveEdit] start, commentId:', id, 'text:', editText.trim())
    try {
      const res = await fetch(`/api/channel/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText.trim() }),
      })
      const data = await res.json() as { post?: { text: string }; error?: string }
      console.log('[handleSaveEdit] response status:', res.status, 'data:', data)
      if (!res.ok) {
        setEditError(data.error ?? 'Ошибка сохранения')
        return
      }
      setComments(prev => prev.map(c => c.id === id ? { ...c, text: editText.trim() } : c))
      setEditedCommentIds(prev => new Set([...prev, id]))
      setEditingCommentId(null)
      console.log('[handleSaveEdit] done, updated comment', id)
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)
    setConfirmDeletePost(false)
    onDelete(post.id)
    await fetch(`/api/channel/posts/${post.id}`, { method: 'DELETE' }).catch(() => {})
  }

  async function handleSavePostEdit() {
    if (!editPostText.trim() || savingEditPost) return
    setSavingEditPost(true)
    setEditPostError('')
    try {
      const res = await fetch(`/api/channel/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editPostText.trim() }),
      })
      const data = await res.json() as { post?: { text: string }; error?: string }
      if (!res.ok) {
        setEditPostError(data.error ?? 'Ошибка сохранения')
        return
      }
      setPostText(editPostText.trim())
      setPostEdited(true)
      setEditingPost(false)
      setShowPostMenu(false)
    } finally {
      setSavingEditPost(false)
    }
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
      setLiked(prev => !prev)
      setLikesCount(prev => liked ? prev + 1 : Math.max(0, prev - 1))
    }
  }

  useEffect(() => { setLikesCount(post.likes_count) }, [post.likes_count])

  useEffect(() => {
    if (!showComments) return
    const supabase = createClient()
    const sub = supabase
      .channel(realtimeChannel.current)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'channel_posts', filter: `parent_id=eq.${post.id}` }, async () => {
        const res = await fetch(`/api/channel/posts/${post.id}/comments`)
        if (!res.ok) return
        const data = await res.json() as { comments?: PostWithMeta[] }
        if (data.comments) setComments(data.comments)
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'channel_posts' }, (payload) => {
        setComments(prev => prev.filter(c => c.id !== (payload.old as { id: string }).id))
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [showComments, post.id])

  const memberData = Array.isArray(post.member) ? post.member[0] : post.member
  const displayName = getDisplayName(memberData?.name ?? null, memberData?.full_name ?? null)
  const avatarUrl = (memberData as { avatar_url?: string | null } | null)?.avatar_url ?? null
  const isAuthorAdmin = (memberData as { role?: string } | null)?.role === 'admin'
  const isAuthorCurator = (memberData as { role?: string } | null)?.role === 'curator'

  return (
    <div className="rounded-2xl overflow-hidden shrink-0" style={cardStyle}>
      {post.is_pinned && (
        <div className="px-4 py-1 text-xs font-semibold" style={{ background: 'var(--pur)', color: '#fff', fontFamily: 'var(--font-nunito)' }}>
          📌 Закреплено
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {post.is_ai_reply ? (
            <div className="shrink-0 rounded-full flex items-center justify-center text-base" style={{ width: 36, height: 36, background: '#FFF8E1', border: '1px solid #FFE58F' }}>🤖</div>
          ) : (
            <Avatar url={avatarUrl} name={displayName} size={36} />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className="text-sm font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                {post.is_ai_reply ? 'Ассистент клуба' : displayName}
              </span>
              {isAuthorAdmin && !post.is_ai_reply && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#FFD93D', color: '#5C4200', fontFamily: 'var(--font-nunito)' }}>Наставник</span>
              )}
              {isAuthorCurator && !post.is_ai_reply && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#4CAF78', color: '#fff', fontFamily: 'var(--font-nunito)' }}>Куратор</span>
              )}
              {post.is_ai_reply && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#FFD93D', color: '#5C4200', fontFamily: 'var(--font-nunito)' }}>ИИ</span>
              )}
              {post.meal_tag && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--pur-lt)', color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
                  {MEAL_TAG_LABELS[post.meal_tag] ?? post.meal_tag}
                </span>
              )}
            </div>
            <p className="text-[11px]" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>{formatTime(post.created_at)}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isAdmin && !faqSaved && (
              <button type="button" onClick={() => setShowFaqForm(v => !v)} className="rounded-lg px-2 py-1 transition-all" style={{ fontSize: 11, fontFamily: 'var(--font-nunito)', background: showFaqForm ? 'var(--pur)' : 'var(--pur-lt)', color: showFaqForm ? '#fff' : 'var(--pur)' }}>
                📚 В FAQ
              </button>
            )}
            {faqSaved && (
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#e8f5e9', color: '#2D6A4F', fontFamily: 'var(--font-nunito)' }}>✓ В FAQ</span>
            )}
            {/* ··· menu for post (owner or admin) */}
            {(isOwn || isAdmin || isCurator) && !post.is_pinned && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowPostMenu(v => !v); setConfirmDeletePost(false) }}
                  className="rounded-lg px-1.5 py-1 transition-all text-xs"
                  style={{ color: 'var(--muted)', background: showPostMenu ? 'var(--border)' : 'transparent', fontFamily: 'var(--font-nunito)', lineHeight: 1 }}
                >
                  ···
                </button>
                {showPostMenu && (
                  <div className="absolute right-0 top-full mt-1 z-20 rounded-xl shadow-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)', minWidth: 140 }}>
                    {isOwn && (Date.now() - new Date(post.created_at).getTime()) < 24 * 60 * 60 * 1000 && (
                      <button
                        type="button"
                        onClick={() => { setEditingPost(true); setEditPostText(postText ?? ''); setShowPostMenu(false) }}
                        className="w-full text-left px-3 py-2 text-xs transition-all"
                        style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)', background: 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        ✏️ Редактировать
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setConfirmDeletePost(true); setShowPostMenu(false) }}
                      className="w-full text-left px-3 py-2 text-xs transition-all"
                      style={{ fontFamily: 'var(--font-nunito)', color: '#C0392B', background: 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      🗑️ Удалить
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FAQ form */}
        {showFaqForm && (
          <div className="rounded-xl p-3 mb-3 flex flex-col gap-2" style={{ background: 'var(--pur-lt)', border: '1px solid var(--pur-br)' }}>
            <input placeholder="Вопрос" value={faqQuestion} onChange={e => setFaqQuestion(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none" style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--pur-br)', background: '#fff', color: 'var(--text)' }} />
            <textarea placeholder="Ответ" value={faqAnswer} onChange={e => setFaqAnswer(e.target.value)} rows={3} className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none resize-none" style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--pur-br)', background: '#fff', color: 'var(--text)' }} />
            <input placeholder="Категория (например: Питание)" value={faqCategory} onChange={e => setFaqCategory(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none" style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--pur-br)', background: '#fff', color: 'var(--text)' }} />
            <div className="flex gap-2">
              <button type="button" onClick={handleSaveFaq} disabled={savingFaq} className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50" style={{ background: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
                {savingFaq ? 'Сохраняю...' : 'Сохранить в FAQ'}
              </button>
              <button type="button" onClick={() => setShowFaqForm(false)} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg)', color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Отмена</button>
            </div>
          </div>
        )}

        {/* Confirm delete post */}
        {confirmDeletePost && (
          <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <span className="text-xs flex-1" style={{ color: '#C0392B', fontFamily: 'var(--font-nunito)' }}>Удалить пост?</span>
            <button type="button" onClick={handleDelete} disabled={deleting} className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold disabled:opacity-50" style={{ background: '#C0392B', fontFamily: 'var(--font-nunito)' }}>Да</button>
            <button type="button" onClick={() => setConfirmDeletePost(false)} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg)', color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Нет</button>
          </div>
        )}

        {/* Post text (or inline edit) */}
        {editingPost ? (
          <div className="mb-3 flex flex-col gap-2">
            <textarea
              value={editPostText}
              onChange={e => setEditPostText(e.target.value.slice(0, 1000))}
              autoFocus
              rows={4}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none resize-none"
              style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--pur)', background: 'var(--bg)', color: 'var(--text)' }}
            />
            {editPostError && <p className="text-xs" style={{ color: '#C0392B', fontFamily: 'var(--font-nunito)' }}>{editPostError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={handleSavePostEdit} disabled={!editPostText.trim() || savingEditPost} className="flex-1 py-1.5 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ background: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
                {savingEditPost ? 'Сохраняю...' : 'Сохранить'}
              </button>
              <button type="button" onClick={() => { setEditingPost(false); setEditPostError('') }} className="px-3 py-1.5 rounded-xl text-sm" style={{ background: 'var(--bg)', color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Отмена</button>
            </div>
          </div>
        ) : (postText || post.text) ? (
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {postText ?? post.text}
            {postEdited && <span style={{ color: 'var(--pale)', fontSize: 11 }}> · изменено</span>}
          </p>
        ) : null}

        {/* Post media */}
        {post.media_url && (
          <div className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.media_url} alt="фото" style={{ width: '100%', height: 'auto', minHeight: '200px', maxHeight: '400px', objectFit: 'contain', borderRadius: '12px', display: 'block', backgroundColor: '#F0EEFF' }} onLoad={(e) => { (e.target as HTMLImageElement).style.minHeight = '0' }} />
          </div>
        )}
        {isMediaExpired && (
          <div className="mb-3 rounded-xl flex items-center justify-center py-6 text-sm gap-2" style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px dashed var(--border)', fontFamily: 'var(--font-nunito)' }}>
            📷 Фото удалено (72ч)
          </div>
        )}

        {/* Like + comment row */}
        <div className="flex items-center gap-2 mt-1">
          <button type="button" onClick={handleLike} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all text-xs font-semibold" style={{ fontFamily: 'var(--font-nunito)', background: liked ? '#FFE4EF' : 'var(--bg)', color: liked ? '#FF6B9D' : 'var(--muted)', border: `1px solid ${liked ? '#FF6B9D' : 'var(--border)'}` }}>
            <span>{liked ? '❤️' : '🤍'}</span>
            {likesCount > 0 && <span>{likesCount}</span>}
          </button>
          {post.parent_id === null && (
            <button type="button" onClick={toggleComments} className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all text-xs font-semibold" style={{ fontFamily: 'var(--font-nunito)', background: showComments ? 'var(--pur-lt)' : 'var(--bg)', color: showComments ? 'var(--pur)' : 'var(--muted)', border: `1px solid ${showComments ? 'var(--pur-br)' : 'var(--border)'}` }}>
              <span>💬</span>
              <span style={{ background: post.comments_count > 0 ? '#FF6B9D' : 'var(--border)', color: post.comments_count > 0 ? '#fff' : 'var(--muted)', borderRadius: '999px', padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                {post.comments_count}
              </span>
            </button>
          )}
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-3 flex flex-col gap-2">
            {loadingComments && (
              <p className="text-xs text-center" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Загрузка...</p>
            )}
            {!loadingComments && comments.length === 0 && (
              <p className="text-xs text-center" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Комментариев пока нет</p>
            )}

            {comments.map(c => {
              const cm = Array.isArray(c.member) ? c.member[0] : c.member
              const cIsAdmin = (cm as { role?: string } | null)?.role === 'admin'
              const cIsCurator = (cm as { role?: string } | null)?.role === 'curator'
              const cName = getDisplayName(cm?.name ?? null, cm?.full_name ?? null)
              const cAvatarUrl = (cm as { avatar_url?: string | null } | null)?.avatar_url ?? null
              const isOwnComment = c.member_id === currentMemberId
              const canDeleteComment = isOwnComment || isAdmin || isCurator
              const canEditComment = isOwnComment && (Date.now() - new Date(c.created_at).getTime()) < 24 * 60 * 60 * 1000
              const isEditing = editingCommentId === c.id
              const isConfirmingDelete = confirmDeleteId === c.id
              const isDeletingThis = deletingCommentId === c.id

              return (
                <div key={c.id} className="rounded-xl p-3" style={{ background: 'var(--bg)', border: '1px solid var(--border)', opacity: isDeletingThis ? 0.5 : 1 }}>
                  {/* Comment header */}
                  <div className="flex items-center gap-2 mb-1">
                    {c.is_ai_reply ? (
                      <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 22, height: 22, background: '#FFF8E1', fontSize: 12 }}>🤖</div>
                    ) : (
                      <Avatar url={cAvatarUrl} name={cName} size={22} />
                    )}
                    <span className="text-xs font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)' }}>
                      {c.is_ai_reply ? 'Ассистент' : cName}
                    </span>
                    {cIsAdmin && !c.is_ai_reply && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#FFD93D', color: '#5C4200', fontFamily: 'var(--font-nunito)' }}>Наставник</span>
                    )}
                    {cIsCurator && !c.is_ai_reply && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#4CAF78', color: '#fff', fontFamily: 'var(--font-nunito)' }}>Куратор</span>
                    )}
                    <span className="text-[10px]" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                      {formatTime(c.created_at)}
                      {editedCommentIds.has(c.id) && <span style={{ color: 'var(--pale)' }}> · изменено</span>}
                    </span>

                    {/* ··· menu button */}
                    {canDeleteComment && !isEditing && (
                      <div className="relative ml-auto">
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === c.id ? null : c.id)}
                          className="text-xs px-1.5 py-0.5 rounded-lg transition-all"
                          style={{ color: 'var(--muted)', background: activeMenuId === c.id ? 'var(--border)' : 'transparent', fontFamily: 'var(--font-nunito)', lineHeight: 1 }}
                        >
                          ···
                        </button>
                        {activeMenuId === c.id && (
                          <div className="absolute right-0 top-full mt-1 z-10 rounded-xl shadow-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)', minWidth: 130 }}>
                            {canEditComment && (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(c)}
                                className="w-full text-left px-3 py-2 text-xs transition-all"
                                style={{ fontFamily: 'var(--font-nunito)', color: 'var(--text)', background: 'transparent' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                ✏️ Редактировать
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => { setConfirmDeleteId(c.id); setActiveMenuId(null) }}
                              className="w-full text-left px-3 py-2 text-xs transition-all"
                              style={{ fontFamily: 'var(--font-nunito)', color: '#C0392B', background: 'transparent' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              🗑️ Удалить
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Confirm delete */}
                  {isConfirmingDelete && (
                    <div className="flex items-center gap-2 mt-2 p-2 rounded-lg" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                      <span className="text-xs flex-1" style={{ color: '#C0392B', fontFamily: 'var(--font-nunito)' }}>Удалить комментарий?</span>
                      <button type="button" onClick={() => handleDeleteComment(c.id)} className="text-xs px-2.5 py-1 rounded-lg text-white font-semibold" style={{ background: '#C0392B', fontFamily: 'var(--font-nunito)' }}>Да</button>
                      <button type="button" onClick={() => setConfirmDeleteId(null)} className="text-xs px-2.5 py-1 rounded-lg" style={{ background: 'var(--bg)', color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Нет</button>
                    </div>
                  )}

                  {/* Inline edit form */}
                  {isEditing ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value.slice(0, 1000))}
                        autoFocus
                        rows={3}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none resize-none"
                        style={{ fontFamily: 'var(--font-nunito)', borderColor: 'var(--pur)', background: '#fff', color: 'var(--text)' }}
                      />
                      <div className="flex gap-2">
                        <button type="button" onClick={handleSaveEdit} disabled={!editText.trim() || savingEdit} className="flex-1 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50" style={{ background: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
                          {savingEdit ? 'Сохраняю...' : 'Сохранить'}
                        </button>
                        <button type="button" onClick={() => setEditingCommentId(null)} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg)', color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Отмена</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {c.text && (
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text)', fontFamily: 'var(--font-nunito)', whiteSpace: 'pre-wrap' }}>{c.text}</p>
                      )}
                      {c.media_url && (
                        <div className="mt-1.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={c.media_url} alt="фото" style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 8, display: 'block', background: '#F0EEFF' }} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}

            {/* Compose comment */}
            <div className="mt-1 flex flex-col gap-1.5">
              {/* Thumbnail above input */}
              {commentMediaPreview && (
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={commentMediaPreview} alt="preview" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                    <button
                      type="button"
                      onClick={removeCommentMedia}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
                    >
                      ✕
                    </button>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>Фото прикреплено</span>
                </div>
              )}

              {/* Input row */}
              <div className="flex gap-2" style={{ alignItems: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => commentFileRef.current?.click()}
                  className="shrink-0 rounded-xl flex items-center justify-center"
                  style={{ minWidth: 36, minHeight: 36, background: 'var(--card)', border: '1px solid var(--border)', fontSize: 16, alignSelf: 'flex-end' }}
                >
                  📷
                </button>
                <input
                  ref={commentFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif"
                  className="hidden"
                  onChange={handleCommentFileChange}
                />
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendComment() }}
                  placeholder="Написать комментарий..."
                  maxLength={1000}
                  className="flex-1 px-3 py-2 rounded-xl text-xs border outline-none"
                  style={{ fontFamily: 'var(--font-nunito)', background: 'var(--bg)', color: 'var(--text)', borderColor: 'var(--border)', minHeight: 36, alignSelf: 'stretch' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--pur)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
                <button
                  type="button"
                  onClick={handleSendComment}
                  disabled={!canSendComment}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40 shrink-0"
                  style={{ background: 'var(--pur)', fontFamily: 'var(--font-nunito)', minHeight: 36, alignSelf: 'flex-end' }}
                >
                  {sendingComment ? '...' : '→'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
