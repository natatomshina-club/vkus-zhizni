import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

function formatDateRu(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceClient()
  const resend = new Resend()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const in1Day = new Date(today)
  in1Day.setDate(in1Day.getDate() + 1)
  const in1DayEnd = new Date(in1Day)
  in1DayEnd.setDate(in1DayEnd.getDate() + 1)

  const in5Days = new Date(today)
  in5Days.setDate(in5Days.getDate() + 5)
  const in5DaysEnd = new Date(in5Days)
  in5DaysEnd.setDate(in5DaysEnd.getDate() + 1)

  const todayStr = today.toISOString().slice(0, 10)

  // Find admin for private messages
  const { data: adminMember } = await admin
    .from('members')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle()

  // Find manual active members expiring in 1 or 5 days
  // who haven't already been reminded today
  const { data: members } = await admin
    .from('members')
    .select('id, email, full_name, name, subscription_ends_at, last_expiry_reminder_sent')
    .eq('subscription_status', 'active')
    .eq('is_manual_subscription', true)
    .or(`subscription_ends_at.gte.${in1Day.toISOString()},subscription_ends_at.lt.${in1DayEnd.toISOString()},subscription_ends_at.gte.${in5Days.toISOString()},subscription_ends_at.lt.${in5DaysEnd.toISOString()}`)

  if (!members || members.length === 0) {
    return NextResponse.json({ ok: true, reminded: 0 })
  }

  // Filter: expiring in exactly 1 or 5 days + not reminded today
  const targets = members.filter(m => {
    if (!m.subscription_ends_at) return false
    if (m.last_expiry_reminder_sent === todayStr) return false
    const ends = new Date(m.subscription_ends_at)
    ends.setHours(0, 0, 0, 0)
    const diff = Math.round((ends.getTime() - today.getTime()) / 86400000)
    return diff === 1 || diff === 5
  })

  let reminded = 0

  for (const m of targets) {
    const displayName = m.full_name ?? m.name ?? 'участница'
    const firstName = displayName.split(' ')[0]
    const endsDate = formatDateRu(m.subscription_ends_at!)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://club.nata-tomshina.ru'

    // 1. Send email
    await resend.emails.send({
      from: 'Наталья Томшина <onboarding@resend.dev>',
      to: m.email,
      subject: `${firstName}, твой доступ в Клуб «Вкус Жизни» скоро заканчивается`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2D1F6E;">
          <div style="background: linear-gradient(135deg, #7C5CFC 0%, #9B7CFF 100%); padding: 28px 24px; border-radius: 16px 16px 0 0; text-align: center;">
            <p style="color: #fff; font-size: 20px; font-weight: 700; margin: 0;">Вкус Жизни</p>
            <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 4px 0 0;">Клуб стройных и здоровых</p>
          </div>
          <div style="background: #fff; padding: 28px 24px; border-radius: 0 0 16px 16px; border: 1px solid #EDE8FF; border-top: none;">
            <p style="font-size: 16px; margin: 0 0 16px;">Привет, ${firstName}! 🌿</p>
            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px; color: #3D2B8A;">
              Твой доступ в Клуб стройных и здоровых «Вкус Жизни» заканчивается <strong>${endsDate}</strong>.
            </p>
            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 28px; color: #2D1F6E;">
              Чтобы продолжить — напиши Наталье напрямую, она поможет с продлением.
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${siteUrl}/dashboard/channel" style="display: inline-block; background: linear-gradient(135deg, #2A9D5C 0%, #52C98D 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 700;">
                Написать Наталье →
              </a>
            </div>
          </div>
          <p style="text-align: center; font-size: 12px; color: #9B8FCC; margin-top: 16px;">
            С заботой, Наталья Томшина 💚
          </p>
        </div>
      `,
    }).catch(e => console.error('[reminder email]', m.email, e))

    // 2. Send private message from admin
    if (adminMember) {
      const pmText = `${firstName}, привет! 🌿 Твой доступ в клуб заканчивается ${endsDate}. Напиши мне здесь чтобы продолжить — разберёмся с продлением 💚`
      await admin.from('private_messages').insert({
        sender_id: adminMember.id,
        receiver_id: m.id,
        text: pmText,
      }).then(({ error: e }) => { if (e) console.error('[reminder pm]', m.id, e) })
    }

    // 3. Mark reminded today
    await admin
      .from('members')
      .update({ last_expiry_reminder_sent: todayStr })
      .eq('id', m.id)

    reminded++
  }

  return NextResponse.json({ ok: true, reminded })
}
