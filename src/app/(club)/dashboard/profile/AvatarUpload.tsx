'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const MAX_SIZE = 400
const JPEG_QUALITY = 0.85

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > height) {
        if (width > MAX_SIZE) { height = Math.round(height * MAX_SIZE / width); width = MAX_SIZE }
      } else {
        if (height > MAX_SIZE) { width = Math.round(width * MAX_SIZE / height); height = MAX_SIZE }
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      }, 'image/jpeg', JPEG_QUALITY)
    }
    img.onerror = reject
    img.src = url
  })
}

interface Props {
  userId: string
  currentUrl?: string | null
  displayName: string
  onUpdated: (url: string | null) => void
}

export default function AvatarUpload({ userId, currentUrl, displayName, onUpdated }: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  const COLORS = ['#7C5CFC', '#4CAF78', '#FF9F43', '#FF6B9D', '#4A90E2']
  const bgColor = displayName ? COLORS[displayName.charCodeAt(0) % COLORS.length] : COLORS[0]

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const blob = await compressImage(file)
      const localPreview = URL.createObjectURL(blob)
      setPreview(localPreview)

      const supabase = createClient()
      const path = `${userId}/avatar.jpg`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true })

      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

      // Add cache-busting param
      const finalUrl = `${publicUrl}?t=${Date.now()}`
      const { error: dbErr } = await supabase
        .from('members')
        .update({ avatar_url: finalUrl })
        .eq('id', userId)

      if (dbErr) throw dbErr

      setPreview(finalUrl)
      onUpdated(finalUrl)
      showToast('Фото обновлено 💚')
    } catch (e) {
      console.error('Avatar upload error:', e)
      setPreview(currentUrl ?? null)
      showToast('Ошибка загрузки')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch('/api/profile/avatar', { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setPreview(null)
      onUpdated(null)
      showToast('Фото удалено')
    } catch (e) {
      console.error('Avatar delete error:', e)
      showToast('Ошибка удаления')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar with pencil overlay */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            overflow: 'hidden',
            background: preview ? 'transparent' : bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '3px solid var(--pur-br)',
          }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Аватар" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 32, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-nunito)' }}>
              {getInitials(displayName) || '?'}
            </span>
          )}
        </div>

        {/* Pencil button */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || deleting}
          title="Изменить фото"
          style={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--pur)',
            border: '2px solid #fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 13,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
        >
          ✏️
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
      />

      {/* Status / delete */}
      <div className="flex flex-col items-center gap-1.5">
        {uploading && (
          <p className="text-xs" style={{ color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
            Загружаем фото...
          </p>
        )}
        {!uploading && preview && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs"
            style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {deleting ? 'Удаляем...' : 'Удалить фото'}
          </button>
        )}
      </div>

      {/* Explanatory text */}
      <div
        className="rounded-xl px-4 py-3 text-center max-w-xs"
        style={{ background: 'var(--pur-lt)', border: '1px solid var(--pur-br)' }}
      >
        <p className="text-xs leading-relaxed" style={{ color: 'var(--pur)', fontFamily: 'var(--font-nunito)' }}>
          Фото помогает создать атмосферу живого клуба — участницы видят тебя в чатах и чувствуют поддержку настоящих людей ✨
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#2D1F6E',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: 20,
            fontSize: 13,
            fontFamily: 'var(--font-nunito)',
            zIndex: 9999,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
