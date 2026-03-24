'use client'

import { useSeasonalTheme } from '@/hooks/useSeasonalTheme'
import { useEffect, useState } from 'react'

const PARTICLE_EMOJIS: Record<string, string[]> = {
  snow:     ['❄️', '🌨️', '❄️', '❄️'],
  hearts:   ['💜', '💕', '🩷', '❤️', '💜'],
  petals:   ['🌸', '🌺', '🌷', '🌸'],
  stars:    ['⭐', '✨', '💫', '🌟'],
  leaves:   ['🍂', '🍁', '🍃', '🍂'],
  confetti: ['🎊', '🎉', '✨', '🎈'],
}

type Particle = {
  id: number
  emoji: string
  left: number
  delay: number
  duration: number
  size: number
  swing: number
}

export default function SeasonalParticles() {
  const { theme } = useSeasonalTheme()
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!theme) {
      setParticles([])
      return
    }
    const emojis = PARTICLE_EMOJIS[theme.particle_type] ?? PARTICLE_EMOJIS.stars
    const count = 24

    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      left: (i / count) * 100 + (Math.random() - 0.5) * 8,
      delay: Math.random() * 12,
      duration: 9 + Math.random() * 8,
      size: 13 + Math.random() * 11,
      swing: 20 + Math.random() * 30,
    }))
    setParticles(newParticles)
  }, [theme])

  if (!theme || particles.length === 0) return null

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
      aria-hidden
    >
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute select-none"
          style={{
            left: `${p.left}%`,
            top: '-50px',
            fontSize: p.size,
            animation: `seasonal-fall-${p.id % 3} ${p.duration}s ${p.delay}s linear infinite`,
            opacity: 0.55,
            lineHeight: 1,
          }}
        >
          {p.emoji}
        </div>
      ))}
      <style>{`
        @keyframes seasonal-fall-0 {
          0%   { transform: translateY(-50px) translateX(0px) rotate(0deg); opacity: 0; }
          5%   { opacity: 0.55; }
          95%  { opacity: 0.35; }
          100% { transform: translateY(110vh) translateX(${particles[0]?.swing ?? 25}px) rotate(360deg); opacity: 0; }
        }
        @keyframes seasonal-fall-1 {
          0%   { transform: translateY(-50px) translateX(0px) rotate(0deg); opacity: 0; }
          5%   { opacity: 0.55; }
          50%  { transform: translateY(55vh) translateX(-${particles[1]?.swing ?? 20}px) rotate(180deg); }
          95%  { opacity: 0.35; }
          100% { transform: translateY(110vh) translateX(${particles[2]?.swing ?? 15}px) rotate(360deg); opacity: 0; }
        }
        @keyframes seasonal-fall-2 {
          0%   { transform: translateY(-50px) translateX(0px) rotate(0deg); opacity: 0; }
          5%   { opacity: 0.55; }
          33%  { transform: translateY(35vh) translateX(${particles[3]?.swing ?? 30}px) rotate(120deg); }
          66%  { transform: translateY(70vh) translateX(-${particles[4]?.swing ?? 20}px) rotate(240deg); }
          95%  { opacity: 0.35; }
          100% { transform: translateY(110vh) translateX(0px) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
