import { createServiceClient } from '@/lib/supabase/server'
import CoursePageClient, { type CourseLesson } from '@/components/CoursePageClient'
import { loadCourseLessons, buildCourseData } from '@/lib/load-course'

export const dynamic = 'force-dynamic'

const FALLBACK_LESSONS: CourseLesson[] = [
  {
    id: 'intro-0',
    sortOrder: 0,
    title: 'О практикуме',
    type: 'text',
    textContent: `Здравствуйте! Я Наталья Томшина, нутрициолог и основатель Клуба «Вкус Жизни».\n\nНа этом курсе вы узнаете правило волшебной тарелки, самый важный гормон похудения, научитесь выбирать продукты и перестанете постоянно думать о еде.\n\nНичего сложного — просто смотрите уроки и выполняйте простые задания. Я верю, что у вас всё получится! 💚`,
  },
  { id: 'intro-1', sortOrder: 1, title: 'Правильная тарелка для похудения', type: 'video', videoId: 'maqDNYomrqnC2hbBwxR4kW', bonusVideoId: 'w7m6j1upAnWuiHFhSDfdSy' },
  { id: 'intro-2', sortOrder: 2, title: 'Продукты, помогающие снижать вес', type: 'video', videoId: 'vAggowP18q2yqVqrnUmHiN' },
  { id: 'intro-3', sortOrder: 3, title: 'Порции', type: 'video', videoId: '2VpTvSt1vtj1dDMZvdqLe3' },
  { id: 'intro-4', sortOrder: 4, title: 'Вода, как лекарство', type: 'video', videoId: 'cK1X2ZtWXeU1oannqx53Po' },
  { id: 'intro-5', sortOrder: 5, title: 'Привычки до и после еды', type: 'video', videoId: 'iHcVVctpX1JswGz1zRxmZk' },
  { id: 'intro-6', sortOrder: 6, title: 'Перекусы — главный враг стройности', type: 'video', videoId: '5eKCzuJspnBA1NY6ZfY78D' },
  { id: 'intro-7', sortOrder: 7, title: 'У вас точно всё получится', type: 'text', isFinalLesson: true },
]

export default async function IntroCoursePageWrapper() {
  const result = await loadCourseLessons('intro')
  const lessons = (result && result.lessons.length > 0) ? result.lessons : FALLBACK_LESSONS

  const course = buildCourseData({
    slug: 'intro',
    title: result?.title ?? 'Волшебный пендель',
    subtitle: result?.description ?? 'Основы метода Натальи — от правильной тарелки до первого рациона',
    lessons,
  })
  // Keep legacy storageKey for existing progress
  course.storageKey = 'vkus-intro-progress'

  return <CoursePageClient course={course} />
}
