'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function Analytics() {
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/public/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, event: 'view', referrer: document.referrer }),
    }).catch(() => {})
  }, [pathname])

  return null
}

export function trackEvent(event: string, extra?: Record<string, string>) {
  if (typeof window === 'undefined') return
  fetch('/api/public/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: window.location.pathname, event, ...extra }),
  }).catch(() => {})
}
