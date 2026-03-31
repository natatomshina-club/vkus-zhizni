'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Watermark() {
  const pathname = usePathname()
  const [email, setEmail] = useState('')

  const show = pathname.startsWith('/dashboard/courses') || pathname.startsWith('/dashboard/webinars')

  useEffect(() => {
    if (!show) return
    createClient().auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? '')
    })
  }, [show])

  if (!show || !email) return null

  const label = `Вкус Жизни · ${email}`
  const rows = Array.from({ length: 18 })
  const cols = Array.from({ length: 6 })

  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none',
      zIndex: 900, overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: -100,
        display: 'flex', flexDirection: 'column', gap: 80,
        transform: 'rotate(-30deg)',
      }}>
        {rows.map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 100, whiteSpace: 'nowrap' }}>
            {cols.map((_, j) => (
              <span key={j} style={{
                fontSize: 12, fontFamily: 'Arial, sans-serif',
                color: '#2D1F6E', opacity: 0.06,
                userSelect: 'none', WebkitUserSelect: 'none',
              }}>
                {label}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
