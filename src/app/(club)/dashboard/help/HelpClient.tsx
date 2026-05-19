'use client'

import { useState } from 'react'
import Link from 'next/link'
import ChannelFAQ from '@/app/(club)/dashboard/channel/ChannelFAQ'

interface HelpMaterial {
  id: string
  title: string
  description: string | null
  format: string
  content_url: string | null
  thumbnail_url: string | null
  duration_label: string | null
  locked: boolean
}

const FMT: Record<string, { label: string; icon: string; bg: string; color: string; cta: string; activeBg: string }> = {
  video:   { label: 'Видео',  icon: '🎥', bg: '#FFE4EC', color: '#8B1A3A', cta: 'Смотреть',  activeBg: '#8B1A3A' },
  article: { label: 'Статья', icon: '📄', bg: '#F0EEFF', color: '#7C5CFC', cta: 'Читать',    activeBg: '#7C5CFC' },
  pdf:     { label: 'PDF',    icon: '📎', bg: '#FFF5E8', color: '#C26A00', cta: 'Открыть',   activeBg: '#C26A00' },
  audio:   { label: 'Аудио', icon: '🎧', bg: '#E8FBF3', color: '#2D6A4F', cta: 'Слушать',   activeBg: '#2D6A4F' },
}

const CARD_COLORS: Record<string, string> = {
  pdf:     'rgba(250, 220, 100, 0.35)',
  video:   'rgba(180, 170, 220, 0.35)',
  article: 'rgba(150, 210, 170, 0.35)',
  audio:   'rgba(255, 182, 193, 0.35)',
}

function MaterialsTab({
  materials,
  hasLockedMaterials,
}: {
  materials: HelpMaterial[]
  hasLockedMaterials: boolean
}) {
  const [activeFormat, setActiveFormat] = useState<string | null>(null)

  const filtered = materials.filter(m => !activeFormat || m.format === activeFormat)

  const formatCounts = Object.keys(FMT).reduce((acc, f) => {
    acc[f] = materials.filter(m => m.format === f).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      {/* Format filter bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
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

      {/* Empty state */}
      {filtered.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
          Материалов с выбранным фильтром нет
        </p>
      )}

      {/* Cards grid */}
      <div className="hmc-grid">
        {filtered.map(m => {
          const fmt = FMT[m.format] ?? FMT.article
          const isLocked = m.locked
          const cardColor = CARD_COLORS[m.format] ?? '#9B8EC4'

          const href = m.format === 'pdf' && m.content_url
            ? `/dashboard/body/pdf?url=${encodeURIComponent(m.content_url)}`
            : `/dashboard/help/${m.id}`

          const card = (
            <div
              className={isLocked ? 'hmc-card hmc-card--locked' : 'hmc-card'}
              style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
            >
              <div style={{
                width: '100%', minHeight: 120, position: 'relative',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                padding: 14, overflow: 'hidden', flexShrink: 0,
                background: m.thumbnail_url ? `url(${m.thumbnail_url}) center/cover no-repeat` : cardColor,
              }}>
                <span style={{
                  position: 'absolute', top: 10, right: 10,
                  background: 'rgba(255,255,255,0.7)', color: '#3D2B8A',
                  fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 20,
                }}>
                  {fmt.icon} {fmt.label}
                </span>
                <p style={{
                  position: 'relative', margin: 0,
                  fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-nunito)',
                  color: '#3D2B8A', lineHeight: 1.35,
                  display: '-webkit-box', WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {m.title}
                </p>
                {isLocked && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(45,31,110,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <span style={{ fontSize: 28 }}>🔒</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>Полный клуб</span>
                  </div>
                )}
              </div>
              <div style={{ padding: '10px 14px 12px', filter: isLocked ? 'blur(3px)' : 'none', userSelect: isLocked ? 'none' : 'auto', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                {m.description && (
                  <p className="hmc-desc" style={{ marginBottom: 8 }}>{m.description}</p>
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

          return isLocked ? (
            <div key={m.id}>{card}</div>
          ) : (
            <Link key={m.id} href={href} style={{ textDecoration: 'none', display: 'block' }}>
              {card}
            </Link>
          )
        })}
      </div>

      {/* Upgrade banner */}
      {hasLockedMaterials && (
        <div style={{
          background: 'linear-gradient(135deg,#3D2B8A 0%,#7C5CFC 100%)',
          borderRadius: 20, padding: '24px 28px',
          display: 'flex', flexDirection: 'column' as const, gap: 12, marginTop: 24,
        }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'var(--font-unbounded)' }}>
            🔒 Все материалы — в полном клубе
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.6 }}>
            Откройте доступ ко всем инструкциям, видео и аудиопрактикам
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
        .hmc-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 640px) {
          .hmc-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 900px) {
          .hmc-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .hmc-card {
          background: #fff;
          border: 2px solid #EDE8FF;
          border-radius: 14px;
          overflow: hidden;
          transition: border-color .15s, transform .15s, box-shadow .15s;
          display: flex;
          flex-direction: column;
        }
        .hmc-card:not(.hmc-card--locked):hover {
          border-color: #DDD5FF;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(124,92,252,.12);
        }
        .hmc-desc {
          font-size: 11px;
          color: var(--muted);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

export default function HelpClient({
  materials,
  hasLockedMaterials,
  isAdmin,
}: {
  materials: HelpMaterial[]
  hasLockedMaterials: boolean
  isAdmin: boolean
}) {
  const [tab, setTab] = useState<'faq' | 'materials'>('faq')

  const tabBtn = (id: 'faq' | 'materials', label: string) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      style={{
        padding: '8px 20px',
        borderRadius: 12,
        border: 'none',
        background: tab === id ? 'var(--pur)' : 'transparent',
        color: tab === id ? '#fff' : 'var(--muted)',
        fontSize: 13,
        fontWeight: tab === id ? 700 : 600,
        cursor: 'pointer',
        fontFamily: 'var(--font-nunito)',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )

  return (
    <div>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 24,
        background: 'var(--bg)',
        borderRadius: 14,
        padding: 4,
        width: 'fit-content',
        border: '1px solid var(--border)',
      }}>
        {tabBtn('faq', '📚 FAQ')}
        {tabBtn('materials', '📂 Материалы')}
      </div>

      {tab === 'faq' && (
        <div style={{ minHeight: 400 }}>
          <ChannelFAQ isAdmin={isAdmin} />
        </div>
      )}

      {tab === 'materials' && (
        <MaterialsTab materials={materials} hasLockedMaterials={hasLockedMaterials} />
      )}
    </div>
  )
}
