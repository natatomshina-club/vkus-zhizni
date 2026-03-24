import { notFound } from 'next/navigation'
import CoursePageClient from '@/components/CoursePageClient'
import { loadCourseLessons, buildCourseData } from '@/lib/load-course'

export const dynamic = 'force-dynamic'

export default async function DynamicCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Skip slugs that have their own static pages
  if (slug === 'intro' || slug === 'stop-diabet') notFound()

  const result = await loadCourseLessons(slug)
  if (!result) notFound()

  const course = buildCourseData({
    slug,
    title: result.title,
    subtitle: result.description ?? '',
    lessons: result.lessons,
  })

  return <CoursePageClient course={course} />
}
