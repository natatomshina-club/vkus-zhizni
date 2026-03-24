'use client'

import { useState, useEffect } from 'react'

export type SeasonalTheme = {
  id: string
  slug: string
  title: string
  emoji: string
  particle_type: 'snow' | 'hearts' | 'petals' | 'stars' | 'leaves' | 'confetti'
  accent_color: string
  accent_light: string
  is_forced: boolean
  is_system: boolean
}

const CACHE_KEY = 'seasonal-theme-cache'
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

export function useSeasonalTheme() {
  const [theme, setTheme] = useState<SeasonalTheme | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        const { theme: cachedTheme, timestamp } = JSON.parse(cached) as { theme: SeasonalTheme | null; timestamp: number }
        if (Date.now() - timestamp < CACHE_TTL) {
          setTheme(cachedTheme)
          setLoading(false)
          return
        }
      }
    } catch {}

    fetch('/api/seasonal-theme')
      .then(r => r.ok ? r.json() : null)
      .then((data: { theme: SeasonalTheme | null } | null) => {
        const t = data?.theme ?? null
        setTheme(t)
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ theme: t, timestamp: Date.now() }))
        } catch {}
      })
      .catch(() => setTheme(null))
      .finally(() => setLoading(false))
  }, [])

  return { theme, loading }
}
