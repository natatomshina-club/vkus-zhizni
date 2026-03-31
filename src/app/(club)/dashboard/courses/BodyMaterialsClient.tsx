'use client'

import { useState } from 'react'
import Link from 'next/link'

interface BodyMaterial {
  id: string; title: string; description: string | null
  format: string; content_url: string | null; thumbnail_url: string | null
  duration_label: string | null; locked: boolean
}
interface BodySection { id: string; title: string; emoji: string; materials: BodyMaterial[] }

const FMT: Record<string, { label: string; icon: string; bg: string; color: string; cta: string; activeBg: string }> = {
  video:   { label: 'Видео',  icon: '🎥', bg: '#FFE4EC', color: '#8B1A3A', cta: 'Смотреть',  activeBg: '#8B1A3A' },
  article: { label: 'Статья', icon: '📄', bg: '#F0EEFF', color: '#7C5CFC', cta: 'Читать',    activeBg: '#7C5CFC' },
  pdf:     { label: 'PDF',    icon: '📎', bg: '#FFF5E8', color: '#C26A00', cta: 'Скачать',   activeBg: '#C26A00' },
  audio:   { label: 'Аудио', icon: '🎧', bg: '#E8FBF3', color: '#2D6A4F', cta: 'Слушать',   activeBg: '#2D6A4F' },
}

// Thumbnail gradients matching body_statiy.html reference
const THUMB_GRAD: Record<string, string> = {
  video:   'linear-gradient(135deg,#A78BFA,#7C3AED)',
  article: 'linear-gradient(135deg,#F0EEFF,#DDD5FF)',
  pdf:     'linear-gradient(135deg,#FFF5E8,#FFD4A0)',
  audio:   'linear-gradient(135deg,#A8E6CF,#2D6A4F)',
}

const THUMB_ICON: Record<string, string> = {
  video: '▶', article: '📄', pdf: '📎', audio: '🎧',
}

export default function BodyMaterialsClient({
  sections,
  hasLockedMaterials,
}: {
  sections: BodySection[]
  hasLockedMaterials: boolean
}) {
  const [activeFormat, setActiveFormat] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const filteredSections = sections.map(s => ({
    ...s,
    materials: s.materials.filter(m =>
      (!activeFormat || m.format === activeFormat) &&
      (!activeSection || s.id === activeSection)
    ),
  })).filter(s => s.materials.length > 0)

  const formatCounts = Object.keys(FMT).reduce((acc, f) => {
    acc[f] = sections.flatMap(s => s.materials).filter(m => m.format === f).length
    return acc
  }, {} as Record<string, number>)

  const sectionItems = sections.filter(s => s.materials.length > 0)

  return (
    <div>
      {/* Format filter bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        <button
          onClick={() => setActiveFormat(null)}
          style={{
            padding: '6px 14px', borderRadius: 20,
            border: `2px solid ${!activeFormat ? '#7C5CFC' : 'var(--border)'}`,
            background: !activeFormat ? '#7C5CFC' : 'transparent',
            color: !activeFormat ? '#fff' : 'var(--muted)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-nunito)',
          }}
        >
          Все форматы
        </button>
        {Object.entries(FMT).map(([key, meta]) => {
          const count = formatCounts[key] ?? 0
          if (count === 0) return null
          const isActive = activeFormat === key
          return (
            <button
              key={key}
              onClick={() => setActiveFormat(isActive ? null : key)}
              style={{
                padding: '6px 14px', borderRadius: 20,
                border: `2px solid ${isActive ? meta.activeBg : 'var(--border)'}`,
                background: isActive ? meta.activeBg : 'transparent',
                color: isActive ? '#fff' : 'var(--muted)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-nunito)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {meta.icon} {meta.label}
            </button>
          )
        })}
      </div>

      {/* Section filter (if >1 section) */}
      {sectionItems.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
          <button
            onClick={() => setActiveSection(null)}
            style={{
              padding: '5px 12px', borderRadius: 20,
              border: `2px solid ${!activeSection ? '#7C5CFC' : 'var(--border)'}`,
              background: !activeSection ? '#F0EEFF' : 'transparent',
              color: !activeSection ? '#7C5CFC' : 'var(--muted)',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-nunito)',
            }}
          >
            Все темы
          </button>
          {sectionItems.map(s => {
            const isActive = activeSection === s.id
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(isActive ? null : s.id)}
                style={{
                  padding: '5px 12px', borderRadius: 20,
                  border: `2px solid ${isActive ? '#7C5CFC' : 'var(--border)'}`,
                  background: isActive ? '#F0EEFF' : 'transparent',
                  color: isActive ? '#7C5CFC' : 'var(--muted)',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-nunito)',
                }}
              >
                {s.emoji} {s.title}
              </button>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {filteredSections.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
          Материалов с выбранными фильтрами нет
        </p>
      )}

      {/* Sections */}
      {filteredSections.map(section => (
        <div key={section.id} style={{ marginBottom: 32 }}>
          {/* Section label with line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#9B8FCC', textTransform: 'uppercase', letterSpacing: '.07em', whiteSpace: 'nowrap' }}>
              {section.emoji} {section.title}
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Cards grid — mobile 1 col, desktop 3 col via CSS class */}
          <div className="bmc-grid">
            {section.materials.map(m => {
              const fmt = FMT[m.format] ?? FMT.article
              const isLocked = m.locked
              const thumbGrad = THUMB_GRAD[m.format] ?? THUMB_GRAD.article
              const thumbIcon = THUMB_ICON[m.format] ?? '📄'

              const card = (
                <div
                  className={isLocked ? 'bmc-card bmc-card--locked' : 'bmc-card'}
                  style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
                >
                  {/* Thumbnail */}
                  <div style={{ width: '100%', height: 140, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {m.thumbnail_url ? (
                      <div style={{ position: 'absolute', inset: 0, background: `url(${m.thumbnail_url}) center/cover no-repeat` }} />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: thumbGrad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {m.format === 'video' ? (
                          <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,.92)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 2px 12px rgba(0,0,0,.2)' }}>
                            ▶
                          </div>
                        ) : (
                          <span style={{ fontSize: 36 }}>{thumbIcon}</span>
                        )}
                      </div>
                    )}

                    {/* Locked overlay on thumbnail */}
                    {isLocked && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(45,31,110,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <span style={{ fontSize: 28 }}>🔒</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>Полный клуб</span>
                      </div>
                    )}
                  </div>

                  {/* Card body — blurred for locked */}
                  <div style={{ padding: '12px 14px', filter: isLocked ? 'blur(3px)' : 'none', userSelect: isLocked ? 'none' : 'auto' }}>
                    <div style={{ marginBottom: 7 }}>
                      <span style={{ background: fmt.bg, color: fmt.color, fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {fmt.icon} {fmt.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', lineHeight: 1.35, marginBottom: 6 }}>
                      {m.title}
                    </p>
                    {m.description && (
                      <p className="bmc-desc">
                        {m.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      {m.duration_label ? (
                        <span style={{ fontSize: 11, color: '#9B8FCC', fontWeight: 600 }}>⏱ {m.duration_label}</span>
                      ) : <span />}
                      <span style={{ background: '#F0EEFF', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#7C5CFC' }}>
                        {fmt.cta} →
                      </span>
                    </div>
                  </div>
                </div>
              )

              return isLocked ? (
                <div key={m.id}>{card}</div>
              ) : (
                <Link key={m.id} href={`/dashboard/body/${m.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  {card}
                </Link>
              )
            })}
          </div>
        </div>
      ))}

      {/* Upgrade banner */}
      {hasLockedMaterials && (
        <div style={{
          background: 'linear-gradient(135deg,#3D2B8A 0%,#7C5CFC 100%)',
          borderRadius: 20, padding: '24px 28px',
          display: 'flex', flexDirection: 'column' as const, gap: 12, marginTop: 8,
        }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'var(--font-unbounded)' }}>
            🔒 Все материалы — в полном клубе
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.6 }}>
            Откройте доступ ко всем видео, статьям и аудиопрактикам без ограничений
          </p>
          <div>
            <Link
              href="/dashboard/upgrade"
              style={{ display: 'inline-block', background: '#FFD93D', color: '#5C4200', fontWeight: 800, fontSize: 14, padding: '12px 28px', borderRadius: 100, textDecoration: 'none' }}
            >
              Открыть полный клуб →
            </Link>
          </div>
        </div>
      )}

      <style>{`
        /* Grid: 1 col mobile → 3 col desktop */
        .bmc-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 640px) {
          .bmc-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 900px) {
          .bmc-grid { grid-template-columns: repeat(3, 1fr); }
        }

        /* Card base */
        .bmc-card {
          background: #fff;
          border: 2px solid #EDE8FF;
          border-radius: 14px;
          overflow: hidden;
          transition: border-color .15s, transform .15s, box-shadow .15s;
          display: flex;
          flex-direction: column;
        }
        .bmc-card:not(.bmc-card--locked):hover {
          border-color: #DDD5FF;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(124,92,252,.12);
        }

        /* Description clamp */
        .bmc-desc {
          font-size: 11px;
          color: var(--muted);
          line-height: 1.5;
          margin-bottom: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
