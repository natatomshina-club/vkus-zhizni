'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

type Meditation = {
  id: string
  course_id: string
  title: string
  description: string | null
  duration_seconds: number | null
  audio_url: string | null
  emoji: string | null
  sort_order: number
  play_count: number
}

type Course = {
  id: string
  slug: string
  title: string
  description: string | null
  emoji: string | null
  gradient_from: string
  gradient_to: string
  meditations: Meditation[]
}

type ProgressMap = Record<string, { last_position_seconds: number; completed: boolean }>

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  if (seconds < 3600) return `${Math.round(seconds / 60)} мин`
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function MeditationsClient({
  courses,
  initialProgress,
}: {
  courses: Course[]
  initialProgress: ProgressMap
}) {
  const [filterCourseId, setFilterCourseId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState<ProgressMap>(initialProgress)

  // Collapse state: Set of collapsed course IDs (first course open by default)
  const [collapsedCourses, setCollapsedCourses] = useState<Set<string>>(
    () => new Set(courses.slice(1).map(c => c.id))
  )
  // Only one card expanded at a time
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeIdRef = useRef<string | null>(null)

  activeIdRef.current = activeId

  const saveProgress = useCallback(async (medId: string, pos: number, completed: boolean) => {
    setProgress(prev => ({
      ...prev,
      [medId]: { last_position_seconds: Math.floor(pos), completed },
    }))
    fetch(`/api/meditations/${medId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ last_position_seconds: Math.floor(pos), completed }),
    }).catch(() => {})
  }, [])

  const stopCurrent = useCallback(() => {
    if (saveTimerRef.current) {
      clearInterval(saveTimerRef.current)
      saveTimerRef.current = null
    }
    if (audioRef.current) {
      const audio = audioRef.current
      if (activeIdRef.current) {
        saveProgress(activeIdRef.current, audio.currentTime, audio.ended)
      }
      audio.pause()
      audio.currentTime = 0
      // Don't null the ref — it's a persistent DOM element
    }
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [saveProgress])

  function toggleCourse(courseId: string) {
    setCollapsedCourses(prev => {
      const next = new Set(prev)
      if (next.has(courseId)) next.delete(courseId)
      else next.add(courseId)
      return next
    })
  }

  function handleCardToggle(medId: string) {
    if (expandedCardId === medId) {
      // Don't collapse while playing
      if (activeId === medId && isPlaying) return
      setExpandedCardId(null)
    } else {
      // If something else is playing — stop it first
      if (isPlaying && activeId && activeId !== medId) {
        stopCurrent()
        setActiveId(null)
      }
      setExpandedCardId(medId)
    }
  }

  function handlePlay(med: Meditation) {
    if (!med.audio_url) return

    if (expandedCardId !== med.id) setExpandedCardId(med.id)

    // Same meditation — toggle pause/play
    if (activeId === med.id) {
      if (isPlaying) {
        audioRef.current?.pause()
        setIsPlaying(false)
      } else {
        // Direct call from user gesture — allowed by iOS
        audioRef.current?.play().catch(() => {})
        setIsPlaying(true)
      }
      return
    }

    stopCurrent()
    setActiveId(med.id)
    activeIdRef.current = med.id

    // Use the persistent <audio> DOM element — don't create new Audio()
    const audio = audioRef.current!
    const savedPos = progress[med.id]?.last_position_seconds ?? 0

    // Replace handlers (no listener accumulation on reused element)
    audio.onloadedmetadata = () => {
      setDuration(audio.duration)
      if (savedPos > 0 && savedPos < audio.duration - 3) {
        audio.currentTime = savedPos
      }
      // Don't call play() here — iOS blocks it (not a user gesture)
    }

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime)
    }

    audio.onended = () => {
      setIsPlaying(false)
      if (activeIdRef.current) {
        saveProgress(activeIdRef.current, audio.duration, true)
      }
      if (saveTimerRef.current) clearInterval(saveTimerRef.current)
    }

    // IMPORTANT: set src and load, THEN play() — all synchronously from the user gesture
    audio.src = med.audio_url
    audio.load()

    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => { setIsPlaying(true) })
        .catch((err) => {
          console.warn('Audio play blocked:', err)
          setIsPlaying(false)
        })
    }

    saveTimerRef.current = setInterval(() => {
      if (audioRef.current && activeIdRef.current && !audioRef.current.paused) {
        saveProgress(activeIdRef.current, audioRef.current.currentTime, false)
      }
    }, 5000)

    fetch(`/api/meditations/${med.id}/play`, { method: 'POST' }).catch(() => {})
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>, medId: string) {
    if (!audioRef.current || activeId !== medId || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = pct * duration
    setCurrentTime(pct * duration)
  }

  function handleSkip(secs: number, medId: string) {
    if (!audioRef.current || activeId !== medId) return
    const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + secs))
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current)
      if (audioRef.current) audioRef.current.pause()
    }
  }, [])

  const filteredCourses = filterCourseId
    ? courses.filter(c => c.id === filterCourseId)
    : courses

  const totalMeds = courses.reduce((s, c) => s + c.meditations.length, 0)
  const completedCount = Object.values(progress).filter(p => p.completed).length

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 40 }}>
      {/* Mobile header */}
      <div className="lg:hidden" style={{
        background: '#fff', padding: '10px 16px 9px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Link href="/dashboard" style={{
          width: 32, height: 32, background: 'var(--pur-lt)', border: 'none', borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          textDecoration: 'none',
        }}>←</Link>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
            Медитации
          </div>
          <div style={{ fontSize: 10, color: 'var(--pale)', fontWeight: 600 }}>
            {totalMeds} практик · аудио
          </div>
        </div>
        <div style={{ width: 32 }} />
      </div>

      <div style={{ padding: '14px 16px 0' }}>
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #1A1340, #3D2B8A)',
          borderRadius: 18, padding: 20, marginBottom: 16, textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
            width: 120, height: 120, background: 'rgba(124,92,252,0.25)', borderRadius: '50%', filter: 'blur(30px)',
          }} />
          <div style={{ fontSize: 36, marginBottom: 8, position: 'relative' }}>🧘</div>
          <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 5, position: 'relative' }}>
            Медитации от Наташи
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, position: 'relative' }}>
            Короткие практики для ума и тела — слушай в любое удобное время
          </div>
          {completedCount > 0 && (
            <div style={{
              marginTop: 12, display: 'inline-flex', gap: 16, justifyContent: 'center',
              background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 16px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 800, color: '#fff' }}>{completedCount}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>пройдено</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 800, color: '#fff' }}>{totalMeds}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>всего</div>
              </div>
            </div>
          )}
        </div>

        {/* Course filter */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
          <button
            onClick={() => setFilterCourseId(null)}
            style={{
              background: filterCourseId === null ? 'var(--pur)' : '#fff',
              border: `2px solid ${filterCourseId === null ? 'var(--pur)' : 'var(--border)'}`,
              borderRadius: 20, padding: '7px 13px', fontSize: 12, fontWeight: 700,
              color: filterCourseId === null ? '#fff' : 'var(--muted)',
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            Все
          </button>
          {courses.map(c => (
            <button
              key={c.id}
              onClick={() => setFilterCourseId(c.id)}
              style={{
                background: filterCourseId === c.id ? 'var(--pur)' : '#fff',
                border: `2px solid ${filterCourseId === c.id ? 'var(--pur)' : 'var(--border)'}`,
                borderRadius: 20, padding: '7px 13px', fontSize: 12, fontWeight: 700,
                color: filterCourseId === c.id ? '#fff' : 'var(--muted)',
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {c.emoji} {c.title}
            </button>
          ))}
        </div>

        {/* Hidden persistent audio element — iOS requires it to be in DOM for play() from gesture */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio ref={audioRef} playsInline preload="none" style={{ display: 'none' }} />

        {/* Courses */}
        {filteredCourses.map(course => {
          const isCollapsed = collapsedCourses.has(course.id)
          return (
            <div key={course.id} style={{ marginBottom: 20 }}>
              {/* Course header — clickable */}
              <div
                onClick={() => toggleCourse(course.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: isCollapsed ? 4 : 10,
                  padding: '6px 8px', borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  userSelect: 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F4F0FF')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 18 }}>{course.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{course.title}</div>
                  {course.description && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{course.description}</div>
                  )}
                </div>
                <span style={{ fontSize: 11, color: 'var(--pale)', marginRight: 2 }}>
                  {course.meditations.length}
                </span>
                {/* Chevron */}
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="var(--pur)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{
                    flexShrink: 0,
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Meditations list — collapsible */}
              <div style={{
                overflow: 'hidden',
                maxHeight: isCollapsed ? 0 : 4000,
                opacity: isCollapsed ? 0 : 1,
                transition: 'max-height 0.3s ease, opacity 0.2s ease',
              }}>
                {course.meditations.length === 0 ? (
                  <div style={{ color: 'var(--pale)', fontSize: 13, padding: '8px 0' }}>Медитации добавляются…</div>
                ) : (
                  course.meditations.map(med => (
                    <MeditationCard
                      key={med.id}
                      med={med}
                      course={course}
                      isExpanded={expandedCardId === med.id}
                      isActive={activeId === med.id}
                      isPlaying={isPlaying && activeId === med.id}
                      currentTime={activeId === med.id ? currentTime : (progress[med.id]?.last_position_seconds ?? 0)}
                      duration={activeId === med.id ? duration : (med.duration_seconds ?? 0)}
                      completed={progress[med.id]?.completed ?? false}
                      onToggle={() => handleCardToggle(med.id)}
                      onPlay={() => handlePlay(med)}
                      onSeek={(e) => handleSeek(e, med.id)}
                      onSkip={(s) => handleSkip(s, med.id)}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MeditationCard({
  med, course, isExpanded, isActive, isPlaying, currentTime, duration, completed,
  onToggle, onPlay, onSeek, onSkip,
}: {
  med: Meditation
  course: Course
  isExpanded: boolean
  isActive: boolean
  isPlaying: boolean
  currentTime: number
  duration: number
  completed: boolean
  onToggle: () => void
  onPlay: () => void
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void
  onSkip: (s: number) => void
}) {
  const hasAudio = !!med.audio_url
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0
  const emoji = med.emoji ?? course.emoji ?? '🧘'

  return (
    <div style={{
      background: '#fff',
      border: `2px solid ${isActive ? 'var(--pur)' : 'var(--border)'}`,
      borderRadius: 16, overflow: 'hidden', marginBottom: 8,
      boxShadow: isActive ? '0 0 0 3px var(--pur-lt)' : 'none',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}>
      {/* Collapsed row — always visible */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 22, flexShrink: 0 }}>{emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {med.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            {med.duration_seconds ? (
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{formatDuration(med.duration_seconds)}</span>
            ) : null}
            {completed && (
              <span style={{ fontSize: 10, fontWeight: 800, color: '#2D6A4F', background: '#A8E6CF', borderRadius: 5, padding: '1px 6px' }}>
                ✓
              </span>
            )}
            {isPlaying && (
              <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--pur)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 5, height: 5, background: 'var(--pur)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
                Играет
              </span>
            )}
          </div>
        </div>

        {/* Play button in collapsed row */}
        {hasAudio && (
          <button
            onClick={e => { e.stopPropagation(); onPlay() }}
            style={{
              background: isPlaying ? '#A8E6CF' : 'var(--pur)',
              color: isPlaying ? '#2D6A4F' : '#fff',
              border: 'none', borderRadius: 8, padding: '6px 12px',
              fontSize: 12, fontWeight: 800, cursor: 'pointer',
              fontFamily: 'var(--font-nunito)', flexShrink: 0,
              transition: 'all 0.15s',
            }}
          >
            {isPlaying ? '⏸' : '▶'} {isPlaying ? 'Пауза' : 'Слушать'}
          </button>
        )}

        {/* Expand chevron */}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="var(--pur)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Expanded content */}
      <div style={{
        overflow: 'hidden',
        maxHeight: isExpanded ? 600 : 0,
        opacity: isExpanded ? 1 : 0,
        transition: 'max-height 0.25s ease, opacity 0.2s ease',
      }}>
        {/* Gradient thumb */}
        <div style={{
          height: 72,
          background: `linear-gradient(135deg, ${course.gradient_from}, ${course.gradient_to})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', fontSize: 28,
          marginBottom: 0,
        }}>
          {emoji}
          {!hasAudio && (
            <div style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.85)', borderRadius: 6,
              padding: '2px 8px', fontSize: 11, fontWeight: 700, color: 'var(--muted)',
            }}>
              ⏳ Скоро
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '10px 12px 12px' }}>
          {med.description && (
            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 10 }}>
              {med.description}
            </div>
          )}

          {!hasAudio && (
            <div style={{ fontSize: 12, color: 'var(--pale)', fontStyle: 'italic' }}>Аудио скоро появится…</div>
          )}
        </div>

        {/* Inline player */}
        {isActive && (
          <div style={{
            background: '#1A1340', borderRadius: 12, margin: '0 10px 10px',
            padding: '12px 14px',
            animation: 'fadeIn 0.2s ease',
          }}>
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                {formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : '—'}
              </div>
              {isPlaying && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: '#A8E6CF' }}>
                  <div style={{
                    width: 6, height: 6, background: '#A8E6CF', borderRadius: '50%',
                    animation: 'pulse 1.2s infinite',
                  }} />
                  Играет
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div
              onClick={onSeek}
              style={{
                height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2,
                overflow: 'hidden', marginBottom: 10, cursor: 'pointer',
              }}
            >
              <div style={{
                height: '100%', width: `${pct}%`,
                background: 'var(--pur)', borderRadius: 2, transition: 'width 0.3s',
              }} />
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <button
                onClick={() => onSkip(-15)}
                style={{
                  width: 36, height: 36, background: 'rgba(255,255,255,0.1)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, cursor: 'pointer', border: 'none', color: '#fff',
                }}
              >
                ⏮
              </button>
              <button
                onClick={onPlay}
                style={{
                  width: 46, height: 46, background: 'var(--pur)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, cursor: 'pointer', border: 'none', color: '#fff',
                }}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button
                onClick={() => onSkip(15)}
                style={{
                  width: 36, height: 36, background: 'rgba(255,255,255,0.1)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, cursor: 'pointer', border: 'none', color: '#fff',
                }}
              >
                ⏭
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
