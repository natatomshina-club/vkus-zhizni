'use client'

import { useState, useRef } from 'react'

const CHIPS = [
  'Не перекусывала',
  'Выпила 2 литра воды',
  'Белковый завтрак',
  'Не хотелось сладкого',
  'Сыта до обеда',
  'Приготовила по методу',
  'Отказалась от мучного',
  'Хорошо спала',
]

interface Props {
  onSave: (text: string) => Promise<void>
  placeholder?: string
  autoFocus?: boolean
}

export default function WinInput({ onSave, placeholder, autoFocus }: Props) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const canSave = text.trim().length >= 3

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave || saving) return
    setSaving(true)
    try {
      await onSave(text.trim())
      setText('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  function handleChip(chip: string) {
    setText(chip)
    textareaRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Chips */}
      <div className="flex flex-wrap gap-1.5">
        {CHIPS.map(chip => (
          <button
            key={chip}
            type="button"
            onClick={() => handleChip(chip)}
            className="text-xs px-2.5 py-1 rounded-full border transition-all"
            style={{
              fontFamily: 'var(--font-nunito)',
              borderColor: 'var(--border)',
              color: 'var(--muted)',
              background: 'var(--bg)',
              touchAction: 'manipulation',
            }}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={placeholder ?? 'Твоя маленькая победа сегодня...'}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="on"
        autoCapitalize="sentences"
        spellCheck={true}
        className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none transition-all"
        style={{
          fontFamily: 'var(--font-nunito)',
          color: 'var(--text)',
          borderColor: 'var(--border)',
          background: 'var(--bg)',
          height: 88,
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--pur)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      />

      {saved && (
        <div
          className="text-sm font-semibold text-center py-2.5 rounded-xl"
          style={{ background: 'var(--grn-light)', color: '#1A7A4F', fontFamily: 'var(--font-nunito)' }}
        >
          🎉 Победа записана! Ты молодец!
        </div>
      )}

      <button
        type="submit"
        disabled={!canSave || saving}
        className="w-full rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
        style={{
          minHeight: 48,
          background: 'var(--pur)',
          fontFamily: 'var(--font-nunito)',
          touchAction: 'manipulation',
        }}
      >
        {saving ? 'Записываем...' : 'Записать победу 🎉'}
      </button>
    </form>
  )
}
