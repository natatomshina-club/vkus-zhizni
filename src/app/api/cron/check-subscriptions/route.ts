import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceClient()
  const resend = new Resend()

  // Find members whose subscription has expired but status not yet updated
  const { data: expired, error } = await admin
    .from('members')
    .select('id, email, full_name, name')
    .lt('subscription_ends_at', new Date().toISOString())
    .in('subscription_status', ['active', 'trial'])

  if (error) {
    console.error('[check-subscriptions] DB error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!expired || expired.length === 0) {
    return NextResponse.json({ ok: true, expired: 0 })
  }

  const ids = expired.map(m => m.id)

  // Mark all as expired in one query
  await admin
    .from('members')
    .update({ subscription_status: 'expired' })
    .in('id', ids)

  // Send notification emails
  let emailed = 0
  for (const m of expired) {
    const displayName = m.full_name ?? m.name ?? 'участница'
    const firstName = displayName.split(' ')[0]

    const { error: emailErr } = await resend.emails.send({
      from: 'Вкус Жизни <noreply@nata-tomshina.ru>',
      to: m.email,
      subject: 'Доступ в клуб приостановлен',
      html: `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF8FF;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8FF;padding:24px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

  <tr><td style="background:#3D2B8A;border-radius:16px 16px 0 0;padding:24px;text-align:center;">
    <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">🌿 Клуб Вкус Жизни</p>
    <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Клуб стройных и здоровых</p>
  </td></tr>

  <tr><td style="background:#fff;border:1px solid #EDE8FF;border-top:none;padding:32px 28px;">
    <p style="margin:0 0 18px;font-size:16px;font-weight:700;color:#3D2B8A;">Привет, ${firstName}! 🌿</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3D2B8A;">
      Ваша подписка истекла, и доступ в клуб «Вкус Жизни» временно приостановлен.
    </p>
    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#3D2B8A;">
      Возобновите доступ — и все ваши данные (дневник, рецепты, замеры) сохранятся.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">
      <a href="https://club.nata-tomshina.ru/join"
        style="display:inline-block;background:#4CAF78;color:#fff;text-decoration:none;
               padding:15px 36px;border-radius:12px;font-size:16px;font-weight:700;">
        Продлить подписку →
      </a>
    </td></tr></table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="border-top:1px solid #EDE8FF;padding-top:24px;">
        <p style="margin:0;font-size:14px;line-height:1.8;color:#3D2B8A;">
          С заботой,<br>
          <strong>Наталья Томшина</strong><br>
          <a href="https://club.nata-tomshina.ru" style="color:#4CAF78;text-decoration:none;">club.nata-tomshina.ru</a>
        </p>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="background:#F0EEFF;border-radius:0 0 16px 16px;padding:20px 28px;border:1px solid #EDE8FF;border-top:none;">
    <p style="margin:0 0 8px;font-size:12px;color:#7B6FAA;line-height:1.6;text-align:center;">
      По вопросам: <a href="mailto:nata.tomshina@gmail.com" style="color:#3D2B8A;font-weight:700;">nata.tomshina@gmail.com</a>
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
    })

    if (emailErr) {
      console.error('[check-subscriptions] email error:', m.email, emailErr)
    } else {
      emailed++
    }
  }

  return NextResponse.json({ ok: true, expired: ids.length, emailed })
}
