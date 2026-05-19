'use client'
import Image from 'next/image'
import { useState, useRef, useCallback } from 'react'

interface Props {
  beforeSrc: string
  afterSrc: string
  name: string
}

export default function StoryBeforeAfter({ beforeSrc, afterSrc, name }: Props) {
  const [pos, setPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  const updatePos = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    setPos(Math.round(x * 100))
  }, [])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    updatePos(e.clientX)
    const onMove = (ev: MouseEvent) => updatePos(ev.clientX)
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [updatePos])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    updatePos(e.touches[0].clientX)
  }, [updatePos])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    updatePos(e.touches[0].clientX)
  }, [updatePos])

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4 / 5',
        overflow: 'hidden',
        cursor: 'ew-resize',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* After (base layer, right side) */}
      <Image
        src={afterSrc}
        alt={`${name} — после`}
        fill
        style={{ objectFit: 'cover', objectPosition: 'center top' }}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      />

      {/* Before (top layer, clipped to left portion) */}
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image
          src={beforeSrc}
          alt={`${name} — до`}
          fill
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>

      {/* Labels */}
      <div style={{
        position: 'absolute', top: 10, left: 10,
        background: 'rgba(0,0,0,0.52)', color: '#fff',
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        padding: '3px 9px', borderRadius: 4,
        fontFamily: 'var(--font-body)', pointerEvents: 'none',
      }}>ДО</div>
      <div style={{
        position: 'absolute', top: 10, right: 10,
        background: 'rgba(0,0,0,0.52)', color: '#fff',
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
        padding: '3px 9px', borderRadius: 4,
        fontFamily: 'var(--font-body)', pointerEvents: 'none',
      }}>ПОСЛЕ</div>

      {/* Divider line */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0,
        left: `${pos}%`, transform: 'translateX(-50%)',
        width: 2, background: '#fff',
        boxShadow: '0 0 6px rgba(0,0,0,0.45)',
        pointerEvents: 'none',
      }} />

      {/* Handle */}
      <div style={{
        position: 'absolute', top: '50%', left: `${pos}%`,
        transform: 'translate(-50%, -50%)',
        width: 38, height: 38, borderRadius: '50%',
        background: '#fff', boxShadow: '0 2px 14px rgba(0,0,0,0.32)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none', gap: 2,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M5 4L2 8l3 4M11 4l3 4-3 4" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  )
}
