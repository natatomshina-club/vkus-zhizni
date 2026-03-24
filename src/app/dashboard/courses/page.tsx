import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { getCourseVisual } from '@/lib/load-course'

// Hardcoded fallback if DB is unavailable
const FALLBACK_COURSES = [
  {
    slug: 'intro',
    title: 'Волшебный пендель',
    description: 'Правило волшебной тарелки, выбор продуктов и первые шаги к стройности без голода',
    lessons_count: null as number | null,
  },
  {
    slug: 'stop-diabet',
    title: 'Стоп Диабет',
    description: 'Лечебное питание для восстановления здоровья и снижения уровня сахара в крови',
    lessons_count: null as number | null,
  },
]

async function getCourses() {
  try {
    const admin = createServiceClient()
    const { data, error } = await admin
      .from('intro_courses')
      .select('id, slug, title, description, sort_order')
      .order('sort_order')

    if (error || !data || data.length === 0) return FALLBACK_COURSES

    // Count visible lessons per course
    const courseIds = data.map(c => c.id)
    const { data: lessons } = await admin
      .from('intro_lessons')
      .select('course_id')
      .in('course_id', courseIds)
      .eq('is_visible', true)

    const countMap = new Map<string, number>()
    for (const l of lessons ?? []) {
      countMap.set(l.course_id, (countMap.get(l.course_id) ?? 0) + 1)
    }

    return data.map(c => ({
      slug: c.slug,
      title: c.title,
      description: c.description,
      lessons_count: countMap.get(c.id) ?? 0,
    }))
  } catch {
    return FALLBACK_COURSES
  }
}

export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
  const courses = await getCourses()

  return (
    <div style={{
      maxWidth: 680,
      margin: '0 auto',
      padding: '24px 16px 96px',
      fontFamily: 'var(--font-nunito)',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-unbounded)',
        fontSize: 20, fontWeight: 800,
        color: 'var(--text)', marginBottom: 6,
      }}>
        Курсы
      </h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>
        Видеоуроки от Натальи Томшиной
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {courses.map(c => {
          const visual = getCourseVisual(c.slug)
          const lessonsLabel = c.lessons_count !== null
            ? `${c.lessons_count} урок${c.lessons_count === 1 ? '' : c.lessons_count < 5 ? 'а' : 'ов'}`
            : 'Видеоуроки'

          return (
            <Link
              key={c.slug}
              href={`/dashboard/courses/${c.slug}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div
                style={{
                  background: '#fff',
                  border: '2px solid #EDE8FF',
                  borderRadius: 20,
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                }}
                className="card-lift"
              >
                <div style={{
                  background: visual.gradient,
                  padding: '20px 20px 18px',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                }}>
                  <span style={{ fontSize: 36, flexShrink: 0 }}>{visual.emoji}</span>
                  <div>
                    <p style={{ fontFamily: 'var(--font-unbounded)', fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.3, margin: 0 }}>
                      {c.title}
                    </p>
                  </div>
                </div>

                <div style={{ padding: '16px 20px 20px' }}>
                  {c.description && (
                    <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.65, marginBottom: 14 }}>
                      {c.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      🎓 {lessonsLabel}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--pur)', background: '#F0EEFF', padding: '6px 14px', borderRadius: 10 }}>
                      Начать →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
