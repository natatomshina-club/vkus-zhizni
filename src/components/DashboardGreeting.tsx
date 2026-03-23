'use client'

import { useMember } from '@/contexts/MemberContext'

function getRussianDate(): string {
  const str = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default function DashboardGreeting() {
  const { member } = useMember()
  const firstName = member?.name?.split(' ')[0] ?? 'подруга'
  const dateStr = getRussianDate()

  return (
    <div>
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-nunito)' }}>
        {dateStr}
      </p>
      <h1 className="text-2xl font-bold leading-tight" style={{ fontFamily: 'var(--font-unbounded)', color: 'var(--text)' }}>
        Привет, {firstName}! 👋
      </h1>
    </div>
  )
}
