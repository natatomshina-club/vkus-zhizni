import CoursePageClient, { type CourseLesson } from '@/components/CoursePageClient'
import { loadCourseLessons, buildCourseData } from '@/lib/load-course'

export const dynamic = 'force-dynamic'

const FALLBACK_LESSONS: CourseLesson[] = [
  { id: 'sd-1', sortOrder: 1, title: 'Почему врачи не лечат диабет', type: 'video', videoId: 'dd4GGZqrnhmonz7eKxZ4QY' },
  { id: 'sd-2', sortOrder: 2, title: 'Потеряла 4 года здоровья — история моей мамы', type: 'video', videoId: 'jMG7tWCwz9923ePBH6dXXJ' },
  { id: 'sd-3', sortOrder: 3, title: 'Почему диетические продукты не помогают похудеть', type: 'video', videoId: 'rnL6XJD9ATRfEmFMvEfyCC' },
  { id: 'sd-4', sortOrder: 4, title: 'Лечебное питание для восстановления здоровья', type: 'video', videoId: '75oRf7iiPyQRaAT1QKFXNK' },
  { id: 'sd-5', sortOrder: 5, title: 'Ваш следующий шаг', type: 'text', isFinalLesson: true },
]

export default async function StopDiabetPageWrapper() {
  const result = await loadCourseLessons('stop-diabet')
  const lessons = (result && result.lessons.length > 0) ? result.lessons : FALLBACK_LESSONS

  const course = buildCourseData({
    slug: 'stop-diabet',
    title: result?.title ?? 'Стоп Диабет',
    subtitle: result?.description ?? 'Правильное питание для восстановления здоровья и снижения сахара в крови',
    lessons,
  })
  // Keep legacy storageKey
  course.storageKey = 'vkus-stopdiabet-progress'

  return <CoursePageClient course={course} />
}
