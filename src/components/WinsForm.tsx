'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function WinsForm({ userId }: { userId: string }) {
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('wins').insert({ member_id: userId, text: text.trim() })
    setSaved(true)
    setText('')
    setLoading(false)
    setTimeout(() => setSaved(false), 3000)
  }

  if (saved) {
    return (
      <p
        className="mt-3 text-sm font-semibold text-center py-3 rounded-xl"
        style={{ color: '#1A7A4F', background: 'var(--grn-light)', fontFamily: 'var(--font-nunito)' }}
      >
        🎉 Победа записана! Ты молодец!
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Например: не было голода 4 часа..."
        className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all"
        style={{
          fontFamily: 'var(--font-nunito)',
          color: 'var(--text)',
          borderColor: 'var(--border)',
          background: 'var(--bg)',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--grn)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
      />
      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        style={{ background: '#2A9D5C', fontFamily: 'var(--font-nunito)' }}
      >
        {loading ? 'Сохраняем...' : 'Записать победу'}
      </button>
    </form>
  )
}
