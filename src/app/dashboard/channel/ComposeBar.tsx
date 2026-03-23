'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PostWithMeta } from '@/types/channel'

const STORAGE_BUCKET = 'channel-media'

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
  onPostCreated: (post: PostWithMeta) => void
}

export default function ComposeBar({ channel, memberId, isAdmin, memberName, memberFullName, onPostCreated }: Props) {
  const [text, setText] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mealTag, setMealTag] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const isPlates  = channel === 'plates'
  const hasPhoto  = channel !== 'faq' && channel !== 'direct'
  const canSend = (text.trim().length > 0 || mediaFile !== null) && !sending
  const charsLeft = 1000 - text.length

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) { setMediaFile(null); setMediaPreview(null); return }

    if (!file.type.startsWith('image/')) {
      setError('Можно загружать только фото')
      if (fileRef.current) fileRef.current.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Файл слишком большой. Максимум 5 МБ')
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setError('')
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
  }

  function removeMedia() {
    setMediaFile(null)
    setMediaPreview(null)
    setMealTag(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSend) return
    setError('')
    setSending(true)

    try {
      let media_url: string | null = null

      // Upload media to Supabase Storage
      if (mediaFile) {
        const supabase = createClient()
        const ext = mediaFile.name.split('.').pop() ?? 'jpg'
        const path = `${channel}/${memberId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, mediaFile, { upsert: false })
        if (uploadError) throw new Error(uploadError.message)

        const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
        media_url = urlData.publicUrl
      }

      const res = await fetch('/api/channel/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          text: text.trim() || undefined,
          media_url: media_url ?? undefined,
          meal_tag: isPlates ? mealTag : undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'Ошибка отправки')
      }

      const post = await res.json() as PostWithMeta
      const postWithMember = {
        ...post,
        member: {
          name: memberName,
          full_name: memberFullName,
          role: isAdmin ? 'admin' : 'user',
        },
      }
      onPostCreated(postWithMember)
      setText('')
      removeMedia()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки')
    } finally {
      setSending(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t px-4 py-3 flex flex-col gap-2"
      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {error && (
        <p className="text-xs" style={{ color: '#C0392B', fontFamily: 'var(--font-nunito)' }}>{error}</p>
      )}

      {/* Media preview */}
      {mediaPreview && (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaPreview} alt="preview" className="rounded-xl max-h-40 object-cover" />
          <button
            type="button"
            onClick={removeMedia}
            className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
          >
            ✕
          </button>
          {/* Meal tag selector for plates */}
          {isPlates && (
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
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
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Photo button (plates + boltalka) */}
        {hasPhoto && (
          <>
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
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}

        {/* Text area */}
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={e => setText(e.target.value.slice(0, 1000))}
            placeholder={isPlates ? 'Подпись к фото (необязательно)...' : 'Написать сообщение...'}
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck={true}
            rows={1}
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none transition-all"
            style={{
              fontFamily: 'var(--font-nunito)',
              color: 'var(--text)',
              borderColor: 'var(--border)',
              background: 'var(--bg)',
              maxHeight: 120,
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--pur)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
          />
          {text.length > 900 && (
            <p className="absolute right-2 bottom-1 text-[10px]"
              style={{ color: charsLeft < 50 ? '#C0392B' : 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
              {charsLeft}
            </p>
          )}
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={!canSend}
          className="shrink-0 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
          style={{
            minHeight: 48,
            minWidth: 64,
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
