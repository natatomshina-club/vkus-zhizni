'use client'

import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  size: number
  rotation: number
  rotationSpeed: number
}

type Props = {
  trigger?: boolean
  onDone?: () => void
}

const COLORS = ['#7C5CFC', '#FF6B9D', '#FFD93D', '#A8E6CF', '#FF9F43', '#56CCF2', '#C4B5FD']

export default function CelebrationEffect({ trigger, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!trigger || startedRef.current) return
    startedRef.current = true

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: Particle[] = []
    const count = 50
    const cx = canvas.width / 2
    const cy = canvas.height * 0.4

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8
      const speed = 4 + Math.random() * 7
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life: 1,
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
      })
    }

    const duration = 2500
    const startTime = Date.now()

    function draw() {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.18
        p.vx *= 0.99
        p.rotation += p.rotationSpeed
        p.life = 1 - progress

        ctx!.save()
        ctx!.globalAlpha = p.life * 0.9
        ctx!.translate(p.x, p.y)
        ctx!.rotate((p.rotation * Math.PI) / 180)
        ctx!.fillStyle = p.color
        ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx!.restore()
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(draw)
      } else {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
        startedRef.current = false
        onDone?.()
      }
    }

    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
    }
  }, [trigger, onDone])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
    />
  )
}
