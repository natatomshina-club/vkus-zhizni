import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string; day_number: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabase
    .from('members').select('role').eq('email', user.email).single()
  if (me?.role !== 'admin' && me?.role !== 'curator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, day_number } = await params
  const dayNum = parseInt(day_number)
  if (isNaN(dayNum)) return NextResponse.json({ error: 'Invalid day_number' }, { status: 400 })

  const admin = createServiceClient()

  // Set is_active = true for this day
  const { error: updateErr } = await admin
    .from('marathon_days')
    .update({ is_active: true })
    .eq('marathon_id', id)
    .eq('day_number', dayNum)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Get marathon for chat channel slug
  const { data: marathon } = await admin
    .from('marathons')
    .select('chat_channel_slug, title')
    .eq('id', id)
    .single()

  const channelSlug = marathon?.chat_channel_slug ?? `marathon-${id}`

  // Find Natalia's member_id
  const { data: natalia } = await admin
    .from('members')
    .select('id')
    .eq('email', 'nata.tomshina@gmail.com')
    .single()

  if (natalia) {
    const text =
      `🔥 День ${dayNum} марафона уже открыт!\n\n` +
      `Заходите на страницу марафона — там новое задание и рацион дня.\n` +
      `👉 https://club.nata-tomshina.ru/dashboard/marathon\n\n` +
      `Все вопросы и отчёты — здесь в чате 💬`

    await admin.from('channel_posts').insert({
      member_id: natalia.id,
      channel: channelSlug,
      text,
      is_pinned: false,
      is_ai_reply: false,
      expires_at: null,
      media_url: null,
      media_expires_at: null,
      meal_tag: null,
      parent_id: null,
    })
  }

  return NextResponse.json({ success: true, day_number: dayNum })
}
