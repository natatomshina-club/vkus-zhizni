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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://club.nata-tomshina.ru'

  // Send emails + PMs in parallel
  await Promise.all(targets.map(async m => {
    const displayName = m.full_name ?? m.name ?? 'участница'
    const firstName = displayName.split(' ')[0]
    const endsDate = formatDateRu(m.subscription_ends_at!)

    const emailPromise = resend.emails.send({
      from: 'Вкус Жизни <noreply@nata-tomshina.ru>',
      to: m.email,
      subject: `${firstName}, твой доступ в Клуб «Вкус Жизни» скоро заканчивается`,
      html: `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF8FF;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8FF;padding:24px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

  <!-- Header -->
  <tr><td style="background:#3D2B8A;border-radius:16px 16px 0 0;padding:24px;text-align:center;">
    <p style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.3px;">🌿 Клуб Вкус Жизни</p>
    <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Клуб стройных и здоровых</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#fff;border:1px solid #EDE8FF;border-top:none;padding:32px 28px;">

    <p style="margin:0 0 18px;font-size:16px;font-weight:700;color:#3D2B8A;">Привет, ${firstName}! 🌿</p>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3D2B8A;">
      Твой доступ в Клуб стройных и здоровых «Вкус Жизни» заканчивается <strong>${endsDate}</strong>.
    </p>

    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#3D2B8A;">
      Чтобы продолжить — напиши Наталье напрямую, она поможет с продлением.
    </p>

    <!-- Button -->
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">
      <a href="${siteUrl}/dashboard/channel"
        style="display:inline-block;background:#4CAF78;color:#fff;text-decoration:none;
               padding:15px 36px;border-radius:12px;font-size:16px;font-weight:700;
               letter-spacing:0.2px;">
        Написать Наталье →
      </a>
    </td></tr></table>

    <!-- Signature -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="border-top:1px solid #EDE8FF;padding-top:24px;">
        <p style="margin:0;font-size:14px;line-height:1.8;color:#3D2B8A;">
          С заботой о вас,<br>
          <strong>Наталья Томшина</strong><br>
          Клуб стройных и здоровых «Вкус Жизни»<br>
          <a href="https://club.nata-tomshina.ru" style="color:#4CAF78;text-decoration:none;">club.nata-tomshina.ru</a>
        </p>
      </td></tr>
    </table>

  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#F0EEFF;border-radius:0 0 16px 16px;padding:20px 28px;border:1px solid #EDE8FF;border-top:none;">
    <p style="margin:0 0 8px;font-size:12px;color:#7B6FAA;line-height:1.6;text-align:center;">
      На это письмо отвечать не нужно.<br>
      По вопросам доступа пишите:
      <a href="mailto:nata.tomshina@gmail.com" style="color:#3D2B8A;font-weight:700;">nata.tomshina@gmail.com</a>
    </p>
    <p style="margin:0 0 8px;font-size:11px;color:#9B8FCC;line-height:1.6;text-align:center;">
      Вы получили это письмо, так как зарегистрированы в Клубе стройных и здоровых «Вкус Жизни».
    </p>
    <p style="margin:0;font-size:11px;text-align:center;">
      <a href="https://club.nata-tomshina.ru/legal/privacy" style="color:#9B8FCC;text-decoration:underline;">Политика конфиденциальности</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`,
    }).catch(e => console.error('[reminder email]', m.email, e))

    const pmPromise = adminMember
      ? admin.from('private_messages').insert({
          sender_id: adminMember.id,
          receiver_id: m.id,
          text: `${firstName}, привет! 🌿 Твой доступ в клуб заканчивается ${endsDate}. Напиши мне здесь чтобы продолжить — разберёмся с продлением 💚`,
        }).then(({ error: e }) => { if (e) console.error('[reminder pm]', m.id, e) })
      : Promise.resolve()

    await Promise.all([emailPromise, pmPromise])
  }))

  // Batch update last_expiry_reminder_sent for all targets
  const ids = targets.map(m => m.id)
  await admin
    .from('members')
    .update({ last_expiry_reminder_sent: todayStr })
    .in('id', ids)

  return NextResponse.json({ ok: true, reminded: targets.length })
}
