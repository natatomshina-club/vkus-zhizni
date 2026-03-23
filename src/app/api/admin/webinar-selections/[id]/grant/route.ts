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

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id } = await params
  const admin = createServiceClient()

  const { data: selection } = await admin
    .from('webinar_selections')
    .select('id, member_id, webinar_id, status')
    .eq('id', id)
    .single()

  if (!selection) return NextResponse.json({ error: 'Запрос не найден' }, { status: 404 })
  if (selection.status === 'granted') return NextResponse.json({ error: 'Уже подтверждён' }, { status: 409 })

  const { data: webinar } = await admin
    .from('webinars')
    .select('title')
    .eq('id', selection.webinar_id)
    .single()

  // Check if access already exists
  const { data: existing } = await admin
    .from('webinar_access')
    .select('id')
    .eq('member_id', selection.member_id)
    .eq('webinar_id', selection.webinar_id)
    .maybeSingle()

  await Promise.all([
    !existing
      ? admin.from('webinar_access').insert({
          member_id: selection.member_id,
          webinar_id: selection.webinar_id,
          granted_by: 'admin',
        })
      : Promise.resolve(),
    admin.from('webinar_selections').update({ status: 'granted' }).eq('id', id),
    admin.from('private_messages').insert({
      member_id: selection.member_id,
      text: `✅ Доступ к вебинару «${webinar?.title ?? ''}» открыт! Заходи в раздел Вебинары и смотри 💚`,
      from_admin: true,
      is_read: false,
    }),
  ])

  return NextResponse.json({ success: true })
}
