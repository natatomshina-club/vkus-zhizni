'use client'

import { useState, useEffect } from 'react'
import CelebrationEffect from '@/components/CelebrationEffect'

type Props = {
  name: string
}

export default function BirthdayBanner({ name }: Props) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const year = new Date().getFullYear()
    const key = `birthday-confetti-${year}`
    if (!localStorage.getItem(key)) {
      setShowConfetti(true)
      localStorage.setItem(key, '1')
    }
  }, [])

  const firstName = name.split(' ')[0] || name

  return (
    <>
      <CelebrationEffect trigger={showConfetti} onDone={() => setShowConfetti(false)} />
      <div
        className="rounded-2xl p-5 flex flex-col gap-2"
        style={{ background: 'linear-gradient(135deg, #7C5CFC 0%, #FF6B9D 100%)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎂</span>
          <p className="text-white font-bold text-base" style={{ fontFamily: 'var(--font-unbounded)' }}>
            С Днём Рождения!
          </p>
        </div>
        <p className="text-white/90 text-sm" style={{ fontFamily: 'var(--font-nunito)' }}>
          {firstName}, сегодня твой день! 🎉 Весь клуб «Вкус Жизни» желает тебе здоровья,
          радости и новых побед на пути к своим целям! 💜
        </p>
      </div>
    </>
  )
}
