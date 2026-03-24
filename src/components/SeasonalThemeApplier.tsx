'use client'

import { useEffect } from 'react'
import { useSeasonalTheme } from '@/hooks/useSeasonalTheme'

export default function SeasonalThemeApplier() {
  const { theme } = useSeasonalTheme()

  useEffect(() => {
    const root = document.documentElement
    if (theme) {
      root.style.setProperty('--seasonal-accent', theme.accent_color)
      root.style.setProperty('--seasonal-accent-light', theme.accent_light)
    } else {
      root.style.removeProperty('--seasonal-accent')
      root.style.removeProperty('--seasonal-accent-light')
    }
  }, [theme])

  return null
}
