'use client'

import Link from 'next/link'
import type { WebinarRow, WebinarLesson, WebinarMaterial } from '@/types/webinars'

interface Props {
  webinar: WebinarRow
  lessons: WebinarLesson[]
  materials: WebinarMaterial[]
}

function MaterialItem({ material }: { material: WebinarMaterial }) {
  const icon = material.type === 'pdf' ? '📄' : material.type === 'audio' ? '🎧' : '📝'

  if (material.url) {
    return (
      <a
        href={material.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 10,
          background: '#FAF8FF', border: '1px solid #EDE8FF',
          textDecoration: 'none', color: 'var(--text)',
          fontSize: 14, fontWeight: 600,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#F0EEFF')}
        onMouseLeave={e => (e.currentTarget.style.background = '#FAF8FF')}
      >
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ flex: 1 }}>{material.title}</span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>↗</span>
      </a>
    )
  }

  if (material.content) {
    return (
      <div style={{
        padding: '12px 14px', borderRadius: 10,
        background: '#FAF8FF', border: '1px solid #EDE8FF',
        fontSize: 14, color: 'var(--text)', lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
      }}>
        <span style={{ fontWeight: 600 }}>{icon} {material.title}</span>
        <p style={{ margin: '6px 0 0' }}>{material.content}</p>
      </div>
    )
  }

  return null
}

export default function WebinarPageClient({ webinar, lessons, materials }: Props) {
  const generalMaterials = materials.filter(m => m.lesson_id === null)

  return (
    <div style={{
      maxWidth: 720, margin: '0 auto',
      padding: '24px 16px 96px',
      fontFamily: 'var(--font-nunito)',
    }}>
      {/* Back link */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/dashboard/webinars"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--muted)', textDecoration: 'none',
            padding: '8px 12px', borderRadius: 10, background: '#F0EEFF',
          }}
        >
          ← Назад к вебинарам
        </Link>
      </div>

      {/* Hero header */}
      <div style={{
        background: `linear-gradient(135deg, ${webinar.color_from}, ${webinar.color_to})`,
        borderRadius: 16, padding: '24px 24px 28px',
        marginBottom: 28,
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{webinar.emoji}</div>
        <h1 style={{
          margin: '0 0 10px',
          fontFamily: 'var(--font-unbounded)',
          fontSize: 20, fontWeight: 800,
          color: '#fff', lineHeight: 1.3,
          textShadow: '0 1px 4px rgba(0,0,0,0.15)',
        }}>
          {webinar.title}
        </h1>
        {webinar.full_desc && (
          <p style={{
            margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.9)',
            lineHeight: 1.65, whiteSpace: 'pre-wrap',
          }}>
            {webinar.full_desc}
          </p>
        )}
      </div>

      {/* Lessons */}
      {lessons.length > 0 && (
        <div>
          <h2 style={{
            margin: '0 0 16px',
            fontSize: 13, fontWeight: 700,
            color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            Уроки
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {lessons.map((lesson, idx) => {
              const lessonMaterials = materials.filter(m => m.lesson_id === lesson.id)

              return (
                <div
                  key={lesson.id}
                  style={{
                    background: '#fff', border: '2px solid #EDE8FF',
                    borderRadius: 16, overflow: 'hidden',
                  }}
                >
                  {/* Lesson title */}
                  <div style={{
                    padding: '16px 20px',
                    borderBottom: lesson.video_id || lessonMaterials.length > 0 ? '1px solid #EDE8FF' : 'none',
                  }}>
                    <p style={{
                      margin: 0, fontSize: 12,
                      color: 'var(--muted)', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      Урок {idx + 1}
                    </p>
                    <h3 style={{
                      margin: '4px 0 0', fontSize: 16, fontWeight: 700,
                      color: 'var(--text)', fontFamily: 'var(--font-unbounded)',
                    }}>
                      {lesson.title}
                    </h3>
                  </div>

                  {/* Video */}
                  <div style={{ padding: '0 20px', paddingTop: 16 }}>
                    {lesson.video_id ? (
                      <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: lessonMaterials.length > 0 ? 16 : 20 }}>
                        <iframe
                          src={`https://kinescope.io/embed/${lesson.video_id}`}
                          width="100%"
                          style={{ aspectRatio: '16/9', border: 'none', display: 'block' }}
                          allow="autoplay; fullscreen"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div style={{
                        aspectRatio: '16/9', borderRadius: 12,
                        background: '#F0EEFF', border: '2px dashed #DDD5FF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: lessonMaterials.length > 0 ? 16 : 20,
                      }}>
                        <p style={{ color: 'var(--muted)', fontSize: 15, textAlign: 'center' }}>
                          Видео скоро появится 🎥
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Lesson materials */}
                  {lessonMaterials.length > 0 && (
                    <div style={{ padding: '0 20px 20px' }}>
                      <p style={{
                        margin: '0 0 8px', fontSize: 12,
                        color: 'var(--muted)', fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        Материалы к уроку
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {lessonMaterials.map(m => <MaterialItem key={m.id} material={m} />)}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* General materials */}
      {generalMaterials.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{
            margin: '0 0 12px',
            fontSize: 13, fontWeight: 700,
            color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            Общие материалы
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {generalMaterials.map(m => <MaterialItem key={m.id} material={m} />)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {lessons.length === 0 && generalMaterials.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 16px',
          background: '#fff', border: '2px solid #EDE8FF', borderRadius: 16,
        }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🎬</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            Материалы готовятся
          </p>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>
            Наташа скоро добавит уроки и материалы к этому вебинару
          </p>
        </div>
      )}
    </div>
  )
}
