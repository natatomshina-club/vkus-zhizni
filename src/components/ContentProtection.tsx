'use client'
import { useEffect } from 'react'

export default function ContentProtection() {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => e.preventDefault()
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault()
      }
      if (e.key === 'F12') e.preventDefault()
    }
    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])
  return null
}
