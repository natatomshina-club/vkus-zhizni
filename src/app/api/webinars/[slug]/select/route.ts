import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getMonthsInClub, getWebinarQuota, canSelectType } from '@/lib/webinars'
import type { WebinarAccess, WebinarSelection } from '@/types/webinars'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const admin = createServiceClient()

  // Get webinar
  const { data: webinar } = await admin
    .from('webinars')
    .select('id, title, content_type')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!webinar) return NextResponse.json({ error: 'Вебинар не найден' }, { status: 404 })

  // Get member info
  const { data: member } = await admin
    .from('members')
    .select('created_at, full_name, email')
    .eq('id', user.id)
    .single()

  if (!member) return NextResponse.json({ error: 'Участница не найдена' }, { status: 404 })

  const months = getMonthsInClub(member.created_at)

  // Check type eligibility
  if (!canSelectType(webinar as unknown as import('@/types/webinars').WebinarRow, months)) {
    return NextResponse.json({ error: 'Этот тип контента недоступен при вашем статусе' }, { status: 403 })
  }

  // Check existing access
  const { data: existingAccess } = await admin
    .from('webinar_access')
    .select('id')
    .eq('member_id', user.id)
    .eq('webinar_id', webinar.id)
    .maybeSingle()

  if (existingAccess) return NextResponse.json({ error: 'Доступ уже есть' }, { status: 409 })

  // Check existing selection
  const { data: existingSelection } = await admin
    .from('webinar_selections')
    .select('id, status')
    .eq('member_id', user.id)
    .eq('webinar_id', webinar.id)
    .maybeSingle()

  if (existingSelection) return NextResponse.json({ error: 'Заявка уже отправлена' }, { status: 409 })

  const quota = getWebinarQuota(months)

  // Check quota (non-Бриллиант)
  if (quota !== Infinity) {
    const { data: selections } = await admin
      .from('webinar_selections')
      .select('id')
      .eq('member_id', user.id)
      .in('status', ['pending', 'granted']) as { data: WebinarSelection[] | null }

    const used = selections?.length ?? 0
    if (used >= quota) {
      return NextResponse.json({ error: 'Квота исчерпана' }, { status: 403 })
    }
  }

  const name = member.full_name ?? member.email ?? 'Участница'

  // Find admin user
  const { data: adminMember } = await admin
    .from('members')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single()

  if (quota === Infinity) {
    // Бриллиант — auto-grant
    await admin.from('webinar_access').insert({
      member_id: user.id,
      webinar_id: webinar.id,
      granted_by: 'status',
    })
    return NextResponse.json({ state: 'has_access' })
  }

  // Create pending selection
  await admin.from('webinar_selections').insert({
    member_id: user.id,
    webinar_id: webinar.id,
    status: 'pending',
  })

  // Notify admin via private message
  if (adminMember) {
    await admin.from('private_messages').insert({
      member_id: user.id,
      text: `${name} выбрала вебинар «${webinar.title}» — открой доступ в админке`,
      from_admin: false,
      is_read: false,
    })
  }

  return NextResponse.json({ state: 'pending' })
}
