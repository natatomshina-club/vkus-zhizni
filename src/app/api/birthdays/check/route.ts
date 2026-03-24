import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceClient()

  const now = new Date()
  const monthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const year = now.getFullYear()

  // Find members whose birthday is today
  // birth_date is stored as DATE, we match on month-day
  const { data: members } = await admin
    .from('members')
    .select('id, full_name, name, email, birth_date')
    .not('birth_date', 'is', null)

  if (!members || members.length === 0) {
    return NextResponse.json({ ok: true, greeted: 0 })
  }

  const todayBirthdays = members.filter(m => {
    if (!m.birth_date) return false
    const bd = m.birth_date as string
    const md = bd.slice(5) // YYYY-MM-DD → MM-DD
    return md === monthDay
  })

  if (todayBirthdays.length === 0) {
    return NextResponse.json({ ok: true, greeted: 0 })
  }

  let greeted = 0

  for (const member of todayBirthdays) {
    // Check if already greeted this year
    const { data: existing } = await admin
      .from('birthday_greetings')
      .select('id')
      .eq('member_id', member.id)
      .eq('year', year)
      .maybeSingle()

    if (existing) continue

    const displayName = member.full_name ?? member.name ?? 'участница'
    const firstName = displayName.split(' ')[0]

    const message = `🎂 С Днём Рождения, ${firstName}!\n\nОт всей нашей команды клуба «Вкус Жизни» желаем тебе здоровья, радости и сил идти к своим целям! 🌸\n\nПусть этот год будет наполнен маленькими победами и большими переменами к лучшему! 💜\n\nС заботой, Наташа и клуб «Вкус Жизни»`

    // Send private message from admin
    const { data: adminMember } = await admin
      .from('members')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle()

    if (adminMember) {
      await admin.from('private_messages').insert({
        sender_id: adminMember.id,
        receiver_id: member.id,
        text: message,
      })
    }

    // Post to channel
    const channelPost = `🎂 Сегодня День Рождения у нашей участницы — ${displayName}!\n\nПоздравим её вместе! Желаем здоровья, красоты и достижения всех целей! 💜🌸`

    const { data: channelData } = await admin
      .from('channel_channels')
      .select('id')
      .eq('slug', 'general')
      .maybeSingle()

    if (channelData) {
      // Find admin user for channel post
      const { data: adminMemberForChannel } = await admin
        .from('members')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle()

      if (adminMemberForChannel) {
        await admin.from('channel_posts').insert({
          channel_id: channelData.id,
          author_id: adminMemberForChannel.id,
          text: channelPost,
        })
      }
    }

    // Record that we greeted this member this year
    await admin.from('birthday_greetings').insert({
      member_id: member.id,
      year,
    })

    greeted++
  }

  return NextResponse.json({ ok: true, greeted })
}
