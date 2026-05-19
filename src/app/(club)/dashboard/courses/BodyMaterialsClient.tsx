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

const CARD_COLORS: Record<string, string> = {
  pdf:     'rgba(250, 220, 100, 0.35)',
  video:   'rgba(180, 170, 220, 0.35)',
  article: 'rgba(150, 210, 170, 0.35)',
  audio:   'rgba(255, 182, 193, 0.35)',
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
              const cardColor = CARD_COLORS[m.format] ?? '#9B8EC4'

              const card = (
                <div
                  className={isLocked ? 'bmc-card bmc-card--locked' : 'bmc-card'}
                  style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
                >
                  {/* Colored header with title */}
                  <div style={{
                    width: '100%', minHeight: 120, position: 'relative',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    padding: '14px 14px 14px', overflow: 'hidden', flexShrink: 0,
                    background: m.thumbnail_url ? `url(${m.thumbnail_url}) center/cover no-repeat` : cardColor,
                  }}>
                    {/* Format badge — top right */}
                    <span style={{
                      position: 'absolute', top: 10, right: 10,
                      background: 'rgba(255,255,255,0.7)', color: '#3D2B8A',
                      fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20,
                    }}>
                      {fmt.icon} {fmt.label}
                    </span>

                    {/* Title */}
                    <p style={{
                      position: 'relative', margin: 0,
                      fontSize: 16, fontWeight: 700,
                      fontFamily: 'var(--font-nunito)',
                      color: '#3D2B8A', lineHeight: 1.35,
                      display: '-webkit-box', WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {m.title}
                    </p>

                    {/* Locked overlay */}
                    {isLocked && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(45,31,110,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <span style={{ fontSize: 28 }}>🔒</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>Полный клуб</span>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '10px 14px 12px', filter: isLocked ? 'blur(3px)' : 'none', userSelect: isLocked ? 'none' : 'auto', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {m.description && (
                      <p className="bmc-desc" style={{ marginBottom: 8 }}>
                        {m.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

              const href = m.format === 'pdf' && m.content_url
                ? `/dashboard/body/pdf?url=${encodeURIComponent(m.content_url)}`
                : `/dashboard/body/${m.id}`

              return isLocked ? (
                <div key={m.id}>{card}</div>
              ) : (
                <Link key={m.id} href={href} style={{ textDecoration: 'none', display: 'block' }}>
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
