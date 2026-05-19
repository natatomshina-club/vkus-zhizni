'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const btnBack: React.CSSProperties = {
  fontSize: 13, color: '#7B6FAA', textDecoration: 'none',
  padding: '8px 12px', borderRadius: 10, background: '#F0EEFF',
}

interface StoryRow {
  id: string
  slug: string
  name: string
  tag_label: string | null
  published: boolean
  order_index: number
  created_at: string
}

const btnPrimary: React.CSSProperties = {
  padding: '8px 20px', borderRadius: 10, background: 'var(--pur)', color: '#fff',
  fontFamily: 'var(--font-nunito)', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
}
const btnDanger: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 8, background: '#FFF0F0', color: '#C0395A',
  fontFamily: 'var(--font-nunito)', fontSize: 13, fontWeight: 600, border: '1.5px solid #FFCDD2', cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 8, border: '1.5px solid var(--border)',
  background: 'none', fontFamily: 'var(--font-nunito)', fontSize: 13, fontWeight: 600,
  color: 'var(--pur)', cursor: 'pointer',
}

export default function ResultsStoriesAdminPage() {
  const router = useRouter()
  const [stories, setStories] = useState<StoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/results-stories')
    if (res.ok) {
      const { stories: s } = await res.json() as { stories: StoryRow[] }
      setStories(s ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    setDeleting(true)
    await fetch(`/api/admin/results-stories/${id}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    load()
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/admin" style={btnBack}>← Назад</Link>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 700, color: '#3D2B8A', margin: 0 }}>
            Истории преображения
          </h1>
          <p style={{ fontSize: 13, color: '#7B6FAA', margin: '4px 0 0' }}>
            Публичные карточки и страницы историй участниц
          </p>
        </div>
        <Link href="/admin/results-stories/new" style={{ textDecoration: 'none' }}>
          <button style={btnPrimary}>+ Новая история</button>
        </Link>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #EDE8FF', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#7B6FAA', fontSize: 14 }}>
            Загрузка…
          </div>
        ) : stories.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: '#7B6FAA', margin: '0 0 16px' }}>Историй пока нет.</p>
            <Link href="/admin/results-stories/new" style={{ textDecoration: 'none' }}>
              <button style={btnPrimary}>Создать первую →</button>
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #EDE8FF', background: '#FAF8FF' }}>
                {['Имя', 'Тег', 'Статус', 'Порядок', 'Действия'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#7B6FAA', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stories.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: i < stories.length - 1 ? '1px solid #F0EEFF' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#3D2B8A' }}>
                    {s.name}
                    <div style={{ fontSize: 11, color: '#9B8FCC', fontWeight: 400, marginTop: 2 }}>{s.slug}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>
                    {s.tag_label ?? '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: s.published ? '#E8FFF4' : '#F5F5F5',
                      color: s.published ? '#1A6B44' : '#7B6FAA',
                    }}>
                      {s.published ? 'Опубликовано' : 'Черновик'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>
                    {s.order_index}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button style={btnSecondary} onClick={() => router.push(`/admin/results-stories/${s.id}`)}>
                        Редактировать
                      </button>
                      {s.slug && (
                        <a
                          href={`https://nata-tomshina.ru/results/${s.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ ...btnSecondary, textDecoration: 'none', display: 'inline-block' }}
                        >
                          ↗
                        </a>
                      )}
                      <button style={btnDanger} onClick={() => setDeleteId(s.id)}>
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', maxWidth: 360, width: '90%', textAlign: 'center' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#3D2B8A', marginBottom: 8 }}>Удалить историю?</p>
            <p style={{ fontSize: 13, color: '#7B6FAA', marginBottom: 24 }}>
              Это действие необратимо. Фото в Storage останутся.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button style={btnSecondary} onClick={() => setDeleteId(null)} disabled={deleting}>
                Отмена
              </button>
              <button style={btnDanger} onClick={() => handleDelete(deleteId)} disabled={deleting}>
                {deleting ? 'Удаляем…' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
