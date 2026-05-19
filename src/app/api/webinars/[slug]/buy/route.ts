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

  // Get member by email (not user.id!)
  const { data: member } = await admin
    .from('members')
    .select('id, full_name, email')
    .eq('email', user.email!)
    .single()

  if (!member) return NextResponse.json({ error: 'Участница не найдена' }, { status: 404 })

  // Insert into webinar_selections (pending queue), skip if already exists
  await admin.from('webinar_selections').upsert(
    {
      member_id: member.id,
      webinar_id: webinar.id,
      status: 'pending',
    },
    { onConflict: 'member_id,webinar_id', ignoreDuplicates: true }
  )

  // Send message from member to admin
  await admin.from('private_messages').insert({
    member_id: member.id,
    text: `Наташа, хочу купить вебинар «${webinar.title}» — ${webinar.price} ₽`,
    from_admin: false,
    is_read: false,
  })

  return NextResponse.json({ success: true })
}
