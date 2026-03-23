'use client'

import WinInput from './WinInput'

export default function DashboardWinInput() {
  async function handleSave(text: string) {
    const res = await fetch('/api/wins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source: 'dashboard' }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string }
      throw new Error(err.error ?? 'Ошибка сохранения')
    }
  }

  return <WinInput onSave={handleSave} />
}
