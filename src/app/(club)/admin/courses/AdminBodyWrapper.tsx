'use client'

import { useState } from 'react'
import Link from 'next/link'
import AdminCoursesClient from './AdminCoursesClient'
import AdminBodyTab from './AdminBodyTab'

export default function AdminBodyWrapper() {
  const [tab, setTab] = useState<'courses' | 'materials'>('courses')

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <Link href="/admin" style={{ fontSize: 13, color: '#7B6FAA', textDecoration: 'none', padding: '6px 12px', borderRadius: 10, background: '#F0EEFF', display: 'inline-block', marginBottom: 12 }}>
            ← Назад
          </Link>
          <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, color: '#2D1F6E', margin: 0 }}>
            🌿 Я и моё тело
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {([
          { key: 'courses' as const, label: 'Вводные курсы' },
          { key: 'materials' as const, label: 'Материалы' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              background: tab === t.key ? '#3D2B8A' : '#F0EEFF',
              color: tab === t.key ? '#fff' : '#7B6FAA',
              fontFamily: 'var(--font-nunito)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'courses' ? <AdminCoursesClient /> : <AdminBodyTab />}
    </div>
  )
}
