'use client'

import { useState, useRef, useEffect } from 'react'
import type { PostWithMeta } from '@/types/channel'

const MEAL_TAGS = [
  { value: 'breakfast', label: '🌅 Завтрак' },
  { value: 'lunch',     label: '🍽️ Обед/Ужин' },
  { value: 'snack',     label: '🥗 Перекус' },
]

interface Props {
  channel: string
  memberId: string
  isAdmin: boolean
  memberName: string
  memberFullName: string | null
  memberAvatarUrl: string | null
  onPostCreated: (post: PostWithMeta) => void
  onFocusInput?: () => void
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
        if (width > height) {
          height = (height / width) * maxSize
          width = maxSize
        } else {
          width = (width / height) * maxSize
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.8)
    }

    img.src = URL.createObjectURL(file)
  })
}

export default function ComposeBar({ channel, memberId, isAdmin, memberName, memberFullName, memberAvatarUrl, onPostCreated, onFocusInput }: Props) {
  const [text, setText] = useState('')
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [mealTag, setMealTag] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [bottomOffset, setBottomOffset] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isPlates  = channel === 'plates'
  const hasPhoto  = channel !== 'faq' && channel !== 'direct'
  const canSend = (text.trim().length > 0 || mediaFiles.length > 0) && !sending
  const charsLeft = 1000 - text.length

  // iOS: сдвигаем панель вверх когда открывается клавиатура
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const vp = window.visualViewport
        const offset = Math.max(0, window.innerHeight - vp.height - vp.offsetTop)
        setBottomOffset(offset)
      }
    }
    window.visualViewport?.addEventListener('resize', handleResize)
    window.visualViewport?.addEventListener('scroll', handleResize)
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize)
      window.visualViewport?.removeEventListener('scroll', handleResize)
    }
  }, [])

  function adjustTextareaHeight(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files ?? [])
    if (newFiles.length === 0) return
    const remaining = 3 - mediaFiles.length
    if (remaining <= 0) { setError('Максимум 3 фото'); if (fileRef.current) fileRef.current.value = ''; return }
    const toAdd = newFiles.slice(0, remaining)
    for (const file of toAdd) {
      if (!file.type.startsWith('image/')) { setError('Можно загружать только фото'); if (fileRef.current) fileRef.current.value = ''; return }
      if (file.size > 10 * 1024 * 1024) { setError('Файл слишком большой. Максимум 10 МБ'); if (fileRef.current) fileRef.current.value = ''; return }
    }
    setError('')
    setMediaFiles(prev => [...prev, ...toAdd])
    setMediaPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))])
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeMedia(index?: number) {
    if (index === undefined) {
      setMediaFiles([])
      setMediaPreviews([])
      setMealTag(null)
    } else {
      setMediaFiles(prev => prev.filter((_, i) => i !== index))
      setMediaPreviews(prev => prev.filter((_, i) => i !== index))
      if (mediaFiles.length <= 1) setMealTag(null)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSend) return
    setError('')
    setSending(true)

    try {
      const media_urls: string[] = []

      for (const mediaFile of mediaFiles) {
        const isGif = mediaFile.type === 'image/gif'
        const uploadBlob = isGif ? mediaFile : await compressImage(mediaFile)
        const uploadName = isGif ? mediaFile.name : mediaFile.name.replace(/\.[^.]+$/, '.jpg')
        const uploadType = isGif ? mediaFile.type : 'image/jpeg'

        const urlRes = await fetch('/api/channel/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel, filename: uploadName, content_type: uploadType, size: uploadBlob.size }),
        })
        if (!urlRes.ok) {
          const err = await urlRes.json().catch(() => ({})) as { error?: string }
          throw new Error(err.error ?? 'Ошибка загрузки фото')
        }
        const { signedUrl, publicUrl } = await urlRes.json() as { signedUrl: string; path: string; publicUrl: string }
        const uploadRes = await fetch(signedUrl, { method: 'PUT', headers: { 'Content-Type': uploadType }, body: uploadBlob })
        if (!uploadRes.ok) throw new Error('Ошибка загрузки фото на сервер')
        media_urls.push(publicUrl)
      }

      const res = await fetch('/api/channel/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          text: text.trim() || '',
          media_urls: media_urls.length > 0 ? media_urls : undefined,
          meal_tag: isPlates ? mealTag : undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'Ошибка отправки')
      }

      const post = await res.json() as PostWithMeta
      onPostCreated({
        ...post,
        member: {
          name: memberName,
          full_name: memberFullName,
          role: isAdmin ? 'admin' : 'user',
          avatar_url: memberAvatarUrl,
        },
      })
      setText('')
      removeMedia()
      if (textareaRef.current) textareaRef.current.style.height = '48px'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки')
    } finally {
      setSending(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t px-3 py-2 flex flex-col gap-1.5"
      style={{
        background: 'var(--card)',
        borderColor: 'var(--border)',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
        transform: bottomOffset > 0 ? `translateY(-${bottomOffset}px)` : undefined,
        transition: 'transform 0.15s ease',
      }}
    >
      {error && (
        <p className="text-xs px-1" style={{ color: '#C0392B', fontFamily: 'var(--font-nunito)' }}>{error}</p>
      )}

      {/* Meal tags (только Тарелочки, когда фото выбрано) */}
      {isPlates && mediaPreviews.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {MEAL_TAGS.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setMealTag(mealTag === t.value ? null : t.value)}
              className="text-xs px-2.5 py-1 rounded-full border transition-all"
              style={{
                fontFamily: 'var(--font-nunito)',
                background: mealTag === t.value ? 'var(--pur)' : 'var(--bg)',
                color: mealTag === t.value ? '#fff' : 'var(--muted)',
                borderColor: mealTag === t.value ? 'var(--pur)' : 'var(--border)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Полоса превью (отдельный блок над строкой ввода) */}
      {hasPhoto && mediaPreviews.length > 0 && (
        <div className="flex gap-2 pb-2" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
          {mediaPreviews.map((src, idx) => (
            <div key={idx} className="relative shrink-0" style={{ width: 56, height: 56 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="preview"
                style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 10, display: 'block' }}
              />
              <button
                type="button"
                onClick={() => removeMedia(idx)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center font-bold"
                style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 9, lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
          ))}
          {mediaPreviews.length < 3 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="shrink-0 rounded-xl flex items-center justify-center text-lg"
              style={{ width: 56, height: 56, background: 'var(--bg)', border: '1px dashed var(--border)', color: 'var(--muted)' }}
            >
              +
            </button>
          )}
        </div>
      )}

      {/* Основная строка: [📷] [запись / превью / textarea] [🎤 / →] */}
      <div className="flex items-end gap-2">

        {/* Кнопка фото */}
        {hasPhoto && (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={mediaPreviews.length >= 3}
              className="shrink-0 rounded-xl flex items-center justify-center text-xl disabled:opacity-40"
              style={{ minHeight: 48, minWidth: 48, background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              📷
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}

        {/* Textarea */}
        <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => {
                setText(e.target.value.slice(0, 1000))
                adjustTextareaHeight(e.target)
              }}
              onKeyDown={handleKeyDown}
              placeholder={isPlates ? 'Подпись к фото (необязательно)...' : 'Написать сообщение...'}
              autoComplete="off"
              autoCorrect="on"
              autoCapitalize="sentences"
              spellCheck={true}
              rows={1}
              className="w-full px-3 py-2.5 rounded-xl border outline-none resize-none"
              style={{
                fontFamily: 'var(--font-nunito)',
                fontSize: 16,
                color: 'var(--text)',
                borderColor: 'var(--border)',
                background: 'var(--bg)',
                minHeight: 48,
                overflowY: 'auto',
                display: 'block',
              }}
              onFocus={e => {
                onFocusInput?.()
                e.target.style.borderColor = 'var(--pur)'
              }}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            {text.length > 900 && (
              <p className="absolute right-2 bottom-1 text-[10px]"
                style={{ color: charsLeft < 50 ? '#C0392B' : 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
                {charsLeft}
              </p>
            )}
          </div>

        {/* → — отправить */}
        <button
          type="submit"
          disabled={!canSend}
          className="shrink-0 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
          style={{
            minHeight: 48, minWidth: 56,
            background: 'var(--pur)',
            fontFamily: 'var(--font-nunito)',
            touchAction: 'manipulation',
          }}
        >
          {sending ? '...' : '→'}
        </button>
      </div>
    </form>
  )
}
