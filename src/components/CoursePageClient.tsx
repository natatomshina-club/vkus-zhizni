'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export interface CourseMaterial {
  id: string
  title: string
  url?: string
}

export interface CourseLesson {
  id: string
  sortOrder: number
  title: string
  type: 'video' | 'text'
  videoId?: string
  bonusVideoId?: string
  textContent?: string
  isFinalLesson?: boolean
  materials?: CourseMaterial[]
}

export interface CourseData {
  title: string
  subtitle: string
  lessonsLabel: string
  storageKey: string
  backHref: string
  lessons: CourseLesson[]
}

const FINAL_TIPS = [
  { emoji: '📋', text: 'Держи список продуктов всегда под рукой' },
  { emoji: '🍽️', text: 'Ешь только когда по-настоящему голодна' },
  { emoji: '🥗', text: 'Выбирай натуральную еду — это основа метода' },
  { emoji: '😊', text: 'Не будь фанатичной — гибкость важнее строгости' },
  { emoji: '🚫', text: 'Полностью исключи сладкие напитки' },
]

function KinescopePlayer({ videoId }: { videoId: string }) {
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: '#1A1040' }}>
      <iframe
        src={`https://kinescope.io/embed/${videoId}`}
        width="100%"
        style={{ aspectRatio: '16/9', border: 'none', display: 'block' }}
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    </div>
  )
}

function MaterialLink({ material }: { material: CourseMaterial }) {
  if (!material.url) return null
  return (
    <a
      href={material.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 13px', borderRadius: 12,
        background: '#FFF5E8', border: '2px solid #FFD4A0',
        textDecoration: 'none', color: '#8B4A00',
        fontSize: 13, fontWeight: 700,
        transition: 'background 0.13s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#FFE8C0')}
      onMouseLeave={e => (e.currentTarget.style.background = '#FFF5E8')}
    >
      <span style={{
        width: 36, height: 36, background: '#FF9F43', borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
      }}>📄</span>
      <span style={{ flex: 1 }}>{material.title}</span>
      <span style={{
        background: '#FF9F43', color: '#fff', borderRadius: 8,
        padding: '5px 10px', fontSize: 11, fontWeight: 800, flexShrink: 0,
      }}>↓</span>
    </a>
  )
}

function FinalLessonContent() {
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {FINAL_TIPS.map((tip, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '12px 14px', borderRadius: 12,
            background: i % 2 === 0 ? '#F0EEFF' : '#fff',
            border: '1px solid #EDE8FF',
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{tip.emoji}</span>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text)', lineHeight: 1.6, fontWeight: 600 }}>
              {tip.text}
            </p>
          </div>
        ))}
      </div>
      <div style={{
        background: 'var(--pur)', borderRadius: 16, padding: '20px',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 800,
          color: '#fff', margin: '0 0 8px',
        }}>
          Хочешь результат с поддержкой?
        </p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', margin: '0 0 16px', lineHeight: 1.5 }}>
          Вступай в Клуб «Вкус Жизни» — ежедневная поддержка Наташи и сообщества
        </p>
        <Link
          href="/join"
          style={{
            display: 'inline-block', background: '#FFD93D', color: '#5C4200',
            borderRadius: 12, padding: '13px 28px', fontWeight: 800, fontSize: 14,
            textDecoration: 'none', fontFamily: 'var(--font-nunito)',
          }}
        >
          🌿 Вступить в клуб
        </Link>
      </div>
    </div>
  )
}

function TextCard({ lesson }: { lesson: CourseLesson }) {
  return (
    <div style={{
      background: '#F0EEFF', borderRadius: 14, padding: '20px',
      border: '2px solid #DDD5FF',
    }}>
      <p style={{
        fontSize: 14, color: 'var(--text)', lineHeight: 1.75,
        fontWeight: 600, margin: 0, whiteSpace: 'pre-wrap',
      }}>
        {lesson.textContent}
      </p>
    </div>
  )
}

export default function CoursePageClient({ course }: { course: CourseData }) {
  const { lessons, storageKey } = course

  const [done, setDone] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const lessonRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const rightPanelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let doneSet = new Set<string>()
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) doneSet = new Set(JSON.parse(stored) as string[])
    } catch { /* ignore */ }

    setDone(doneSet)

    const firstCurrent = lessons.find((l, idx) => {
      const unlocked = idx === 0 || doneSet.has(lessons[idx - 1].id)
      return unlocked && !doneSet.has(l.id)
    })
    const target = firstCurrent ?? lessons[lessons.length - 1]
    setOpenId(target.id)
    setSelectedId(target.id)
    setHydrated(true)
  }, [storageKey, lessons])

  function isUnlocked(idx: number) {
    if (idx === 0) return true
    return hydrated && done.has(lessons[idx - 1].id)
  }

  function markDone(lessonId: string) {
    const lessonIdx = lessons.findIndex(l => l.id === lessonId)
    const newDone = new Set(done)
    newDone.add(lessonId)
    setDone(newDone)
    try { localStorage.setItem(storageKey, JSON.stringify([...newDone])) } catch { /* ignore */ }

    if (lessonIdx < lessons.length - 1) {
      const next = lessons[lessonIdx + 1]
      setOpenId(next.id)
      setSelectedId(next.id)
      setTimeout(() => {
        lessonRefs.current[next.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        rightPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }, 150)
    }
  }

  const progress = hydrated && lessons.length > 0
    ? Math.round((done.size / lessons.length) * 100)
    : 0

  const selectedLesson = lessons.find(l => l.id === selectedId) ?? lessons[0]
  const selectedIdx = lessons.findIndex(l => l.id === selectedId)

  function getNumBadge(idx: number, lessonId: string) {
    if (done.has(lessonId)) return { text: '✓', bg: '#A8E6CF', color: '#2D6A4F' }
    const label = idx === 0 ? '📖' : lessons[idx].isFinalLesson ? '🏆' : String(idx)
    if (isUnlocked(idx)) return { text: label, bg: 'var(--pur)', color: '#fff' }
    return { text: label, bg: '#F0EEFF', color: '#9B8FCC' }
  }

  function renderLessonContent(lesson: CourseLesson, idx: number) {
    const isLast = idx === lessons.length - 1
    const isDone = done.has(lesson.id)
    const nextLesson = idx < lessons.length - 1 ? lessons[idx + 1] : null
    const nextLabel = nextLesson
      ? (idx + 1 === 0 ? 'Начать курс →' : `открыть урок ${idx + 1}`)
      : '✅ Курс пройден!'

    return (
      <div>
        {/* Main content */}
        {lesson.type === 'video' && lesson.videoId && (
          <div style={{ marginBottom: 16 }}>
            <KinescopePlayer videoId={lesson.videoId} />
          </div>
        )}

        {lesson.type === 'text' && lesson.isFinalLesson && (
          <div style={{ marginBottom: 16 }}>
            <FinalLessonContent />
          </div>
        )}

        {lesson.type === 'text' && !lesson.isFinalLesson && (
          <div style={{ marginBottom: 16 }}>
            <TextCard lesson={lesson} />
          </div>
        )}

        {/* Bonus video */}
        {lesson.bonusVideoId && (
          <div style={{ marginBottom: 16 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, color: 'var(--muted)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, margin: '0 0 8px',
            }}>
              🎁 Бонус-видео
            </p>
            <KinescopePlayer videoId={lesson.bonusVideoId} />
          </div>
        )}

        {/* Materials */}
        {lesson.materials && lesson.materials.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, color: 'var(--muted)',
              textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px',
            }}>
              Материалы к уроку
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lesson.materials.map(m => <MaterialLink key={m.id} material={m} />)}
            </div>
          </div>
        )}

        {/* Done button */}
        {!isDone && (
          <button
            onClick={() => markDone(lesson.id)}
            style={{
              width: '100%', background: 'var(--pur)', color: '#fff',
              border: 'none', borderRadius: 14, padding: '14px',
              fontSize: 14, fontWeight: 800, cursor: 'pointer',
              fontFamily: 'var(--font-nunito)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {isLast ? '✅ Курс пройден!' : `✅ Я посмотрела — ${nextLabel}`}
          </button>
        )}

        {isDone && !isLast && (
          <div style={{
            width: '100%', background: '#A8E6CF', color: '#2D6A4F',
            borderRadius: 14, padding: '14px',
            fontSize: 14, fontWeight: 800, textAlign: 'center',
            fontFamily: 'var(--font-nunito)',
          }}>
            ✅ Просмотрен
          </div>
        )}

        {isDone && isLast && (
          <div style={{
            width: '100%', background: '#A8E6CF', color: '#2D6A4F',
            borderRadius: 14, padding: '14px',
            fontSize: 14, fontWeight: 800, textAlign: 'center',
            fontFamily: 'var(--font-nunito)',
          }}>
            🎉 Курс завершён!
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* ══════ MOBILE ══════ */}
      <div className="lg:hidden" style={{ paddingBottom: 96 }}>
        <div style={{ padding: '16px 16px 0' }}>
          <Link
            href={course.backHref}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, color: 'var(--muted)', textDecoration: 'none',
              padding: '8px 12px', borderRadius: 10, background: '#F0EEFF',
              marginBottom: 14,
            }}
          >
            ← Назад к курсам
          </Link>

          {/* Hero */}
          <div style={{
            background: 'var(--pur)', borderRadius: 18, padding: '16px', marginBottom: 14,
          }}>
            <p style={{
              fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)',
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6,
            }}>
              🎓 {course.lessonsLabel}
            </p>
            <p style={{
              fontFamily: 'var(--font-unbounded)', fontSize: 17, fontWeight: 800,
              color: '#fff', lineHeight: 1.3, marginBottom: 6,
            }}>
              {course.title}
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, marginBottom: 12 }}>
              {course.subtitle}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                Пройдено {done.size} из {lessons.length}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{progress}%</span>
            </div>
            <div style={{ height: 7, background: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#FFD93D', borderRadius: 4, width: `${progress}%`, transition: 'width 0.4s' }} />
            </div>
          </div>
        </div>

        {/* Accordion */}
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lessons.map((lesson, idx) => {
            const unlocked = isUnlocked(idx)
            const isDone = hydrated && done.has(lesson.id)
            const isOpen = openId === lesson.id
            const badge = getNumBadge(idx, lesson.id)

            return (
              <div
                key={lesson.id}
                ref={el => { lessonRefs.current[lesson.id] = el }}
                style={{
                  background: '#fff',
                  border: `2px solid ${isDone ? '#A8E6CF' : isOpen && unlocked ? 'var(--pur)' : '#EDE8FF'}`,
                  borderRadius: 16, overflow: 'hidden',
                  opacity: unlocked ? 1 : 0.6,
                  transition: 'border-color 0.2s',
                }}
              >
                <div
                  onClick={() => { if (unlocked) setOpenId(isOpen ? null : lesson.id) }}
                  style={{
                    padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 11,
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isDone ? 16 : 14, fontWeight: 800,
                    background: badge.bg, color: badge.color,
                  }}>
                    {badge.text}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 800,
                      color: unlocked ? 'var(--text)' : '#9B8FCC',
                      margin: '0 0 3px', lineHeight: 1.3,
                    }}>
                      {lesson.title}
                    </p>
                    <div>
                      {isDone && (
                        <span style={{ background: '#E8FBF3', color: '#2D6A4F', borderRadius: 7, padding: '2px 8px', fontSize: 10, fontWeight: 800 }}>
                          Просмотрен
                        </span>
                      )}
                      {!isDone && isOpen && unlocked && (
                        <span style={{ background: '#F0EEFF', color: 'var(--pur)', borderRadius: 7, padding: '2px 8px', fontSize: 10, fontWeight: 800 }}>
                          Смотри сейчас
                        </span>
                      )}
                      {!isDone && !isOpen && unlocked && (
                        <span style={{ background: '#F0EEFF', color: '#9B8FCC', borderRadius: 7, padding: '2px 8px', fontSize: 10, fontWeight: 800 }}>
                          Доступен
                        </span>
                      )}
                      {!unlocked && (
                        <span style={{ background: '#F0EEFF', color: '#9B8FCC', borderRadius: 7, padding: '2px 8px', fontSize: 10, fontWeight: 800 }}>
                          🔒 Заблокирован
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 14, color: 'var(--pale)', flexShrink: 0,
                    display: 'inline-block',
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }}>
                    ▾
                  </span>
                </div>

                {isOpen && unlocked && (
                  <div style={{ padding: '0 14px 14px' }}>
                    {renderLessonContent(lesson, idx)}
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>

      {/* ══════ DESKTOP ══════ */}
      <div
        className="hidden lg:flex"
        style={{ height: '100dvh' }}
      >
        {/* Left: sticky lesson list */}
        <div style={{
          width: 340, flexShrink: 0,
          position: 'sticky', top: 0,
          height: '100dvh', overflowY: 'auto',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '20px 16px 0', flexShrink: 0 }}>
            <Link
              href={course.backHref}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 12, color: 'var(--muted)', textDecoration: 'none',
                padding: '6px 10px', borderRadius: 8, background: '#F0EEFF',
                marginBottom: 14,
              }}
            >
              ← Назад к курсам
            </Link>

            <div style={{ background: 'var(--pur)', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
              <p style={{
                fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px',
              }}>
                🎓 {course.lessonsLabel}
              </p>
              <p style={{
                fontFamily: 'var(--font-unbounded)', fontSize: 15, fontWeight: 800,
                color: '#fff', lineHeight: 1.35, margin: '0 0 6px',
              }}>
                {course.title}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, margin: '0 0 12px' }}>
                {course.subtitle}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Прогресс
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>
                  {done.size}/{lessons.length} · {progress}%
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#FFD93D', width: `${progress}%`, borderRadius: 3, transition: 'width 0.4s' }} />
              </div>
            </div>
          </div>

          {/* Lesson items */}
          <div style={{ padding: '0 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {lessons.map((lesson, idx) => {
              const unlocked = isUnlocked(idx)
              const isDone = hydrated && done.has(lesson.id)
              const isSelected = selectedId === lesson.id
              const badge = getNumBadge(idx, lesson.id)

              let borderColor = '#EDE8FF'
              let bgColor = '#fff'
              if (isDone)       { borderColor = '#A8E6CF'; bgColor = '#F0FFF8' }
              else if (isSelected) { borderColor = 'var(--pur)'; bgColor = '#F0EEFF' }

              return (
                <div
                  key={lesson.id}
                  onClick={() => { if (unlocked) setSelectedId(lesson.id) }}
                  style={{
                    border: `2px solid ${borderColor}`, background: bgColor,
                    borderRadius: 14, padding: '11px 12px',
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                    opacity: unlocked ? 1 : 0.5,
                    display: 'flex', alignItems: 'center', gap: 11,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isDone ? 16 : 13, fontWeight: 800,
                    background: badge.bg, color: badge.color,
                  }}>
                    {badge.text}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 12, fontWeight: 800,
                      color: unlocked ? 'var(--text)' : '#9B8FCC',
                      margin: '0 0 3px', lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {lesson.title}
                    </p>
                    {isDone && (
                      <span style={{ background: '#D4F5E9', color: '#2D6A4F', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 800 }}>
                        Просмотрен
                      </span>
                    )}
                    {!isDone && isSelected && (
                      <span style={{ background: '#F0EEFF', color: 'var(--pur)', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 800 }}>
                        Смотрю сейчас
                      </span>
                    )}
                    {!isDone && !isSelected && unlocked && (
                      <span style={{ background: '#F0EEFF', color: '#9B8FCC', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 800 }}>
                        Доступен
                      </span>
                    )}
                    {!unlocked && (
                      <span style={{ background: '#F0EEFF', color: '#9B8FCC', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 800 }}>
                        🔒
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

        </div>

        {/* Right: lesson content */}
        <div
          ref={rightPanelRef}
          style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 40px' }}
        >
          {selectedLesson && (
            <div style={{ maxWidth: 720 }}>
              <p style={{
                fontSize: 11, fontWeight: 700, color: 'var(--pale)',
                textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8,
              }}>
                {selectedIdx === 0 ? 'Вводный урок' : selectedLesson.isFinalLesson ? 'Финальный урок' : `Урок ${selectedIdx} из ${lessons.length - (lessons[0].type === 'text' ? 2 : 1)}`}
              </p>
              <h2 style={{
                fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 800,
                color: 'var(--text)', lineHeight: 1.3, marginBottom: 20,
              }}>
                {selectedLesson.title}
              </h2>
              {renderLessonContent(selectedLesson, selectedIdx)}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
