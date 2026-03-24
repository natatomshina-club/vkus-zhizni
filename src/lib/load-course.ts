import { createServiceClient } from '@/lib/supabase/server'
import type { CourseLesson, CourseData } from '@/components/CoursePageClient'

// Visual overrides per slug (gradient + emoji). Falls back to defaults for new courses.
const COURSE_VISUALS: Record<string, { gradient: string; emoji: string }> = {
  'intro':       { gradient: 'linear-gradient(135deg, #7C5CFC 0%, #9B7BFF 100%)', emoji: '🌿' },
  'stop-diabet': { gradient: 'linear-gradient(135deg, #2A9D5C 0%, #52C98D 100%)', emoji: '💚' },
}
const DEFAULT_VISUAL = { gradient: 'linear-gradient(135deg, #7C5CFC 0%, #9B7BFF 100%)', emoji: '🎓' }

export function getCourseVisual(slug: string) {
  return COURSE_VISUALS[slug] ?? DEFAULT_VISUAL
}

// ── Load lessons for a course slug ─────────────────────────────────────────────
export async function loadCourseLessons(slug: string): Promise<{
  courseId: string | null
  title: string
  description: string | null
  lessons: CourseLesson[]
} | null> {
  try {
    const admin = createServiceClient()

    const { data: courseRow } = await admin
      .from('intro_courses')
      .select('id, title, description')
      .eq('slug', slug)
      .single()

    if (!courseRow) return null

    const { data: rows } = await admin
      .from('intro_lessons')
      .select('id, sort_order, title, lesson_type, video_url, bonus_video_url, text_content')
      .eq('course_id', courseRow.id)
      .eq('is_visible', true)
      .order('sort_order')

    if (!rows || rows.length === 0) {
      return { courseId: courseRow.id, title: courseRow.title, description: courseRow.description, lessons: [] }
    }

    // Load materials separately to avoid schema-cache issues
    const lessonIds = rows.map(r => r.id)
    const { data: materials } = await admin
      .from('intro_lesson_materials')
      .select('id, lesson_id, title, url, sort_order')
      .in('lesson_id', lessonIds)
      .order('sort_order')

    const matsByLesson = new Map<string, { id: string; title: string; url: string }[]>()
    for (const m of materials ?? []) {
      const arr = matsByLesson.get(m.lesson_id) ?? []
      arr.push({ id: m.id, title: m.title, url: m.url })
      matsByLesson.set(m.lesson_id, arr)
    }

    // Last text lesson is "final"
    const lastIdx = rows.length - 1

    const lessons: CourseLesson[] = rows.map((r, idx) => ({
      id: r.id,
      sortOrder: r.sort_order,
      title: r.title,
      type: (r.lesson_type as 'video' | 'text') ?? 'video',
      videoId: r.video_url ? r.video_url.split('/').pop() : undefined,
      bonusVideoId: r.bonus_video_url ? r.bonus_video_url.split('/').pop() : undefined,
      textContent: r.text_content ?? undefined,
      isFinalLesson: idx === lastIdx && r.lesson_type === 'text',
      materials: matsByLesson.get(r.id) ?? [],
    }))

    return { courseId: courseRow.id, title: courseRow.title, description: courseRow.description, lessons }
  } catch (e) {
    console.error('[loadCourseLessons]', e)
    return null
  }
}

// ── Build CourseData for CoursePageClient ──────────────────────────────────────
export function buildCourseData(opts: {
  slug: string
  title: string
  subtitle: string
  lessons: CourseLesson[]
}): CourseData {
  const videoCount = opts.lessons.filter(l => l.type === 'video').length
  const textCount  = opts.lessons.filter(l => l.type === 'text' && !l.isFinalLesson).length
  const parts = []
  if (videoCount > 0) parts.push(`${videoCount} видеоурок${videoCount === 1 ? '' : videoCount < 5 ? 'а' : 'ов'}`)
  if (textCount > 0)  parts.push(`${textCount} текстов${textCount === 1 ? 'ый' : 'ых'}`)
  if (opts.lessons.some(l => l.isFinalLesson)) parts.push('заключительный')

  return {
    title: opts.title,
    subtitle: opts.subtitle,
    lessonsLabel: parts.join(' + ') || `${opts.lessons.length} уроков`,
    storageKey: `vkus-course-${opts.slug}`,
    backHref: '/dashboard/courses',
    lessons: opts.lessons,
  }
}
