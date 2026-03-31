import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { WebinarRow, WebinarLesson, WebinarMaterial } from '@/types/webinars'
import WebinarPageClient from './WebinarPageClient'

export default async function WebinarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const admin = createServiceClient()

  // Get webinar
  const { data: webinar } = await admin
    .from('webinars')
    .select('id,slug,title,short_desc,full_desc,price,emoji,color_from,color_to,video_id,sort_order,is_published,content_type,created_at')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!webinar) redirect('/dashboard/webinars')

  // Check access
  const { data: access } = await admin
    .from('webinar_access')
    .select('id')
    .eq('member_id', user.id)
    .eq('webinar_id', webinar.id)
    .maybeSingle()

  if (!access) redirect('/dashboard/webinars')

  // Fetch lessons + materials
  const [lessonsRes, materialsRes] = await Promise.all([
    admin
      .from('webinar_lessons')
      .select('id,webinar_id,title,video_id,sort_order')
      .eq('webinar_id', webinar.id)
      .order('sort_order', { ascending: true }),
    admin
      .from('webinar_materials')
      .select('id,webinar_id,lesson_id,type,title,url,content,sort_order')
      .eq('webinar_id', webinar.id)
      .order('sort_order', { ascending: true }),
  ])

  return (
    <WebinarPageClient
      webinar={webinar as WebinarRow}
      lessons={(lessonsRes.data ?? []) as WebinarLesson[]}
      materials={(materialsRes.data ?? []) as WebinarMaterial[]}
    />
  )
}
