import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getCourseVisual } from '@/lib/load-course'
import BodyMaterialsClient from './BodyMaterialsClient'

export const dynamic = 'force-dynamic'

const FALLBACK_COURSES = [
  { slug: 'intro', title: 'Волшебный пендель', description: 'Правило волшебной тарелки, выбор продуктов и первые шаги к стройности без голода', lessons_count: null as number | null },
  { slug: 'stop-diabet', title: 'Стоп Диабет', description: 'Лечебное питание для восстановления здоровья и снижения уровня сахара в крови', lessons_count: null as number | null },
]

async function getCourses(admin: ReturnType<typeof createServiceClient>) {
  try {
    const { data, error } = await admin
      .from('intro_courses')
      .select('id, slug, title, description, sort_order')
      .order('sort_order')

    if (error || !data || data.length === 0) return FALLBACK_COURSES

    const { data: lessons } = await admin
      .from('intro_lessons')
      .select('course_id')
      .in('course_id', data.map(c => c.id))
      .eq('is_visible', true)

    const countMap = new Map<string, number>()
    for (const l of lessons ?? []) {
      countMap.set(l.course_id, (countMap.get(l.course_id) ?? 0) + 1)
    }

    return data.map(c => ({
      slug: c.slug, title: c.title, description: c.description,
      lessons_count: countMap.get(c.id) ?? 0,
    }))
  } catch {
    return FALLBACK_COURSES
  }
}

interface BodyMaterial {
  id: string; section_id: string; title: string; description: string | null
  format: string; content_url: string | null; thumbnail_url: string | null
  duration_label: string | null; sort_order: number; locked: boolean
}
interface BodySection { id: string; title: string; emoji: string; sort_order: number; materials: BodyMaterial[] }

async function getBodySections(admin: ReturnType<typeof createServiceClient>, isTrial: boolean): Promise<BodySection[]> {
  const { data: sections, error } = await admin
    .from('body_sections')
    .select('id, title, emoji, sort_order')
    .eq('is_active', true)
    .order('sort_order')

  if (error || !sections || sections.length === 0) return []

  const { data: materials } = await admin
    .from('body_materials')
    .select('id, section_id, title, description, format, content_url, thumbnail_url, duration_label, sort_order')
    .eq('is_published', true)
    .order('sort_order')

  const matBySect = new Map<string, typeof materials>()
  for (const m of materials ?? []) {
    const list = matBySect.get(m.section_id) ?? []
    list.push(m)
    matBySect.set(m.section_id, list)
  }

  let freeCount = 0
  return sections.map(s => ({
    ...s,
    materials: (matBySect.get(s.id) ?? []).map(m => {
      freeCount++
      if (!isTrial || freeCount <= 3) return { ...m, locked: false }
      return { ...m, content_url: null, locked: true }
    }),
  }))
}

export default async function CoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()

  let isTrial = true
  if (user?.email) {
    const { data: member } = await admin.from('members').select('subscription_status').eq('email', user.email).single()
    isTrial = member?.subscription_status !== 'active'
  }

  const [courses, sections] = await Promise.all([
    getCourses(admin),
    getBodySections(admin, isTrial),
  ])

  const hasLockedMaterials = isTrial && sections.some(s => s.materials.some(m => m.locked))

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 96px', fontFamily: 'var(--font-nunito)' }}>

      {/* Header */}
      <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
        🌿 Я и моё тело
      </h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32 }}>
        Вводные курсы и материалы от Натальи Томшиной
      </p>

      {/* ── A: Вводные курсы ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9B8FCC', textTransform: 'uppercase', letterSpacing: '.07em', whiteSpace: 'nowrap' }}>
          Вводные курсы
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 40 }}>
        {courses.map(c => {
          const visual = getCourseVisual(c.slug)
          const lessonsLabel = c.lessons_count !== null
            ? `${c.lessons_count} урок${c.lessons_count === 1 ? '' : c.lessons_count < 5 ? 'а' : 'ов'}`
            : 'Видеоуроки'
          return (
            <Link key={c.slug} href={`/dashboard/courses/${c.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ background: '#fff', border: '2px solid var(--border)', borderRadius: 16, overflow: 'hidden' }} className="card-lift">
                <div style={{ background: visual.gradient, padding: '18px 20px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 32, flexShrink: 0 }}>{visual.emoji}</span>
                  <p style={{ fontFamily: 'var(--font-unbounded)', fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.3, margin: 0 }}>
                    {c.title}
                  </p>
                </div>
                <div style={{ padding: '12px 20px 16px' }}>
                  {c.description && (
                    <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, marginBottom: 12 }}>{c.description}</p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>🎓 {lessonsLabel}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--pur)', background: 'var(--pur-lt)', padding: '5px 12px', borderRadius: 8 }}>
                      Начать →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── B: Материалы клуба ── */}
      {sections.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#9B8FCC', textTransform: 'uppercase', letterSpacing: '.07em', whiteSpace: 'nowrap' }}>
              Материалы клуба
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <BodyMaterialsClient sections={sections} hasLockedMaterials={hasLockedMaterials} />
        </>
      )}
    </div>
  )
}
