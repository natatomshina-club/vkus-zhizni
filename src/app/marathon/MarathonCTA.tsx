'use client'
import { useState } from 'react'

export default function MarathonCTA({ style }: { style?: React.CSSProperties }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #4CAF78 0%, #3D9B65 100%)',
          color: '#fff', fontFamily: 'var(--font-unbounded)', fontSize: 15,
          fontWeight: 700, padding: '16px 36px', borderRadius: 50,
          border: 'none', cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(76,175,120,.35)',
          ...style,
        }}
      >
        Участвовать →
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 24,
              padding: '32px 28px',
              width: '100%', maxWidth: 400,
              position: 'relative',
              boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
            }}
          >
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: '#F0EEFF', border: 'none', borderRadius: '50%',
                width: 32, height: 32, cursor: 'pointer',
                fontSize: 16, color: '#7B6FAA',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ×
            </button>

            <div style={{ fontSize: 28, marginBottom: 8 }}>🏃</div>
            <h2 style={{
              fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700,
              color: '#3D2B8A', margin: '0 0 8px',
            }}>
              Участие в марафоне
            </h2>
            <p style={{ fontSize: 14, color: '#7B6FAA', margin: '0 0 24px', lineHeight: 1.6 }}>
              Марафоны доступны участницам клуба «Вкус Жизни»
            </p>

            {/* Tariff card */}
            <div style={{
              background: 'linear-gradient(135deg, #3D2B8A 0%, #5B3FA8 100%)',
              borderRadius: 20, padding: '24px 22px',
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.15)', borderRadius: 100,
                padding: '4px 12px', marginBottom: 16,
              }}>
                <span style={{ fontSize: 14 }}>⭐</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '.05em' }}>
                  Подписка Месяц
                </span>
              </div>

              <div style={{ fontFamily: 'var(--font-unbounded)', fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: 4 }}>
                1 500 ₽
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>
                в месяц · автопродление
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Все курсы и вебинары',
                  'Умная кухня',
                  'Марафон месяца',
                  'Медитации',
                  'Чат клуба',
                  'Отмена в любой момент',
                ].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                    <span style={{ color: '#4CAF78', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href="#"
                style={{
                  display: 'block', width: '100%', padding: '14px',
                  background: '#4CAF78', color: '#fff',
                  fontFamily: 'var(--font-unbounded)', fontSize: 14, fontWeight: 700,
                  borderRadius: 14, textDecoration: 'none', textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(76,175,120,0.35)',
                  boxSizing: 'border-box',
                }}
              >
                Вступить в клуб →
              </a>
            </div>

            <p style={{ fontSize: 13, color: '#7B6FAA', textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
              Уже участница клуба?{' '}
              <a
                href="https://club.nata-tomshina.ru"
                style={{ color: '#7C5CFC', fontWeight: 600, textDecoration: 'none' }}
              >
                Войти →
              </a>
            </p>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 600px) {
          .marathon-modal-inner {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            border-radius: 24px 24px 0 0 !important;
            max-width: 100% !important;
            padding-bottom: 32px !important;
          }
        }
      `}</style>
    </>
  )
}
