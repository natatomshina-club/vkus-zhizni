import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const admin = createServiceClient()

  // Get webinar info
  const { data: webinar } = await admin
    .from('webinars')
    .select('id, title, price')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!webinar) return NextResponse.json({ error: 'Вебинар не найден' }, { status: 404 })

  // Get member name
  const { data: member } = await admin
    .from('members')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  const name = member?.full_name ?? member?.email ?? 'Участница'

  // Find admin user
  const { data: adminMember } = await admin
    .from('members')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single()

  if (!adminMember) return NextResponse.json({ error: 'Ошибка конфигурации' }, { status: 500 })

  // Send message from member to admin
  await admin.from('private_messages').insert({
    member_id: user.id,
    text: `Наташа, хочу купить вебинар «${webinar.title}» — ${webinar.price} ₽`,
    from_admin: false,
    is_read: false,
  })

  return NextResponse.json({ success: true })
}
