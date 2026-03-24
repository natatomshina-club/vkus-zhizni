'use client'

import { useSeasonalTheme } from '@/hooks/useSeasonalTheme'
import { useState, useEffect } from 'react'

const BANNER_CONTENT: Record<string, { title: string; text: string }> = {
  new_year:      { title: '🎄 С Новым годом!',        text: 'Пусть этот год принесёт здоровье, стройность и вкус жизни!' },
  valentine:     { title: '💝 С Днём влюблённых!',    text: 'Люби себя — это самое важное!' },
  womens_day:    { title: '🌸 С 8 марта!',            text: 'Ты умница и красавица — продолжай заботиться о себе!' },
  easter:        { title: '🥚 Со Светлой Пасхой!',    text: 'Пусть этот праздник принесёт радость и здоровье!' },
  may_day:       { title: '🌿 С 1 мая!',              text: 'Весна — лучшее время начать заботиться о себе!' },
  victory_day:   { title: '🎆 С Днём Победы!',        text: 'Помним и гордимся!' },
  new_school:    { title: '🍂 С 1 сентября!',         text: 'Новый сезон — новые привычки и результаты!' },
  club_birthday: { title: '🎂 День рождения клуба!',  text: 'Спасибо что ты с нами — вместе мы сила!' },
}

export default function SeasonalBanner() {
  const { theme } = useSeasonalTheme()
  const [closed, setClosed] = useState(true)

  useEffect(() => {
    if (!theme?.is_system || !theme.slug) return
    const today = new Date().toISOString().slice(0, 10)
    const key = `banner-closed-${theme.slug}-${today}`
    setClosed(!!localStorage.getItem(key))
  }, [theme?.slug, theme?.is_system])

  if (!theme?.is_system || closed) return null
  const content = BANNER_CONTENT[theme.slug]
  if (!content) return null

  function dismiss() {
    const today = new Date().toISOString().slice(0, 10)
    localStorage.setItem(`banner-closed-${theme!.slug}-${today}`, '1')
    setClosed(true)
  }

  return (
    <div
      className="rounded-2xl px-4 py-4 flex items-start justify-between gap-3"
      style={{
        background: `linear-gradient(135deg, ${theme.accent_color} 0%, ${theme.accent_color}CC 100%)`,
        borderRadius: 16,
      }}
    >
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-bold text-white mb-1 leading-snug"
          style={{ fontFamily: 'var(--font-unbounded)' }}
        >
          {content.title}
        </p>
        <p
          className="text-xs leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.88)', fontFamily: 'var(--font-nunito)' }}
        >
          {content.text}
        </p>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 text-lg leading-none transition-opacity hover:opacity-100"
        style={{ color: 'rgba(255,255,255,0.7)', marginTop: 1 }}
        aria-label="Закрыть"
      >
        ✕
      </button>
    </div>
  )
}
