'use client'
import { useEffect, useRef } from 'react'

const VIDEO_ID = '97afc6b2-b69e-443a-9481-1638550a461b'

declare global {
  interface Window {
    ym?: (id: number, action: string, goal: string) => void
  }
}

export default function KinescopeHeroPlayer() {
  const startedRef = useRef(false)
  const milestonesRef = useRef(new Set<number>())
  const durationRef = useRef(0)

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (typeof e.origin === 'string' && !e.origin.includes('kinescope.io')) return
      const msg = e.data
      if (!msg || typeof msg !== 'object') return

      const event = msg.event ?? msg.type
      const payload = msg.data ?? msg

      if (event === 'play' || event === 'started') {
        if (!startedRef.current) {
          startedRef.current = true
          window.ym?.(108262096, 'reachGoal', 'free_video_start')
        }
      }

      if (payload?.duration && payload.duration > 0) {
        durationRef.current = payload.duration
      }

      if (event === 'timeupdate' || event === 'currentTimeChanged') {
        const t = payload?.currentTime ?? payload?.current_time ?? 0
        const d = durationRef.current || payload?.duration || 0
        if (d > 0) {
          const pct = (t / d) * 100
          for (const milestone of [25, 50, 75]) {
            if (pct >= milestone && !milestonesRef.current.has(milestone)) {
              milestonesRef.current.add(milestone)
              window.ym?.(108262096, 'reachGoal', `free_video_${milestone}`)
            }
          }
        }
      }

      if (event === 'ended') {
        if (!milestonesRef.current.has(100)) {
          milestonesRef.current.add(100)
          window.ym?.(108262096, 'reachGoal', 'free_video_end')
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div style={{ position: 'relative', paddingTop: '56.25%' }}>
      <iframe
        src={`https://kinescope.io/embed/${VIDEO_ID}?js_api=1`}
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: 'var(--radius-xl)',
        }}
      />
    </div>
  )
}
