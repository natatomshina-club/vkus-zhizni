import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id: webinarId } = await params
  const body = await req.json().catch(() => null)
  const memberId = typeof body?.member_id === 'string' ? body.member_id : null
  if (!memberId) return NextResponse.json({ error: 'member_id обязателен' }, { status: 400 })

  const admin = createServiceClient()

  const { data: webinar } = await admin
    .from('webinars')
    .select('title')
    .eq('id', webinarId)
    .single()

  if (!webinar) return NextResponse.json({ error: 'Вебинар не найден' }, { status: 404 })

  // Check if access already exists
  const { data: existing } = await admin
    .from('webinar_access')
    .select('id')
    .eq('member_id', memberId)
    .eq('webinar_id', webinarId)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Доступ уже открыт' }, { status: 409 })

  await Promise.all([
    admin.from('webinar_access').insert({
      member_id: memberId,
      webinar_id: webinarId,
      granted_by: 'purchase',
    }),
    admin.from('private_messages').insert({
      member_id: memberId,
      text: `✅ Доступ к вебинару «${webinar.title}» открыт! Заходи в раздел Вебинары и смотри 💚`,
      from_admin: true,
      is_read: false,
    }),
  ])

  return NextResponse.json({ success: true })
}
