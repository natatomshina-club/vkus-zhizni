import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

const FROM = 'Вкус Жизни <noreply@nata-tomshina.ru>'

function buildEmail(siteUrl: string, body: string): string {
  return `<!DOCTYPE html>
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

    ${body}

    <!-- Signature -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="border-top:1px solid #EDE8FF;padding-top:24px;">
        <p style="margin:0;font-size:14px;line-height:1.8;color:#3D2B8A;">
          С теплом,<br>
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
</html>`
}

// ── Шаблон 1 — дни 1, 2, 3 ──────────────────────────────────────────────────
function template1(firstName: string, siteUrl: string): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 18px;font-size:16px;font-weight:700;color:#3D2B8A;">${firstName}, здравствуйте 🌸</p>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3D2B8A;">
      Ваш доступ в Клуб «Вкус Жизни» закончился, и я очень не хочу,
      чтобы Вы потеряли темп, который набрали внутри.
    </p>

    <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#3D2B8A;">Сейчас Вам недоступны:</p>
    <p style="margin:0 0 4px;font-size:15px;line-height:1.7;color:#3D2B8A;">— ежемесячные марафоны</p>
    <p style="margin:0 0 4px;font-size:15px;line-height:1.7;color:#3D2B8A;">— медитации и вебинары</p>
    <p style="margin:0 0 4px;font-size:15px;line-height:1.7;color:#3D2B8A;">— Умная кухня и подбор меню</p>
    <p style="margin:0 0 4px;font-size:15px;line-height:1.7;color:#3D2B8A;">— чат участниц и поддержка кураторов</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#3D2B8A;">— дневник, трекер и Ваша история прогресса</p>

    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#3D2B8A;">
      Всё это ждёт Вас обратно — стоит только продлить подписку.
    </p>

    <!-- Button -->
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">
      <a href="${siteUrl}"
        style="display:inline-block;background:#4CAF78;color:#fff;text-decoration:none;
               padding:15px 36px;border-radius:12px;font-size:16px;font-weight:700;
               letter-spacing:0.2px;">
        Вернуться в Клуб →
      </a>
    </td></tr></table>

    <p style="margin:0 0 0;font-size:14px;line-height:1.7;color:#7B6FAA;">
      Если что-то пошло не так с оплатой (например, карта истекла или
      банк не пропустил списание) — напишите мне, разберёмся.
    </p>
  `
  return {
    subject: 'Ваш доступ в Клуб приостановлен',
    html: buildEmail(siteUrl, body),
  }
}

// ── Шаблон 2 — день 15 ───────────────────────────────────────────────────────
function template2(firstName: string, siteUrl: string): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 18px;font-size:16px;font-weight:700;color:#3D2B8A;">${firstName}, привет 🧡</p>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3D2B8A;">
      Через несколько дней в Клубе стартует новый ежемесячный
      марафон — и я подумала о Вас.
    </p>

    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#3D2B8A;">
      Если возвращаться — то на марафон самое время. С него легче
      снова войти в Клуб, чем «когда-нибудь потом».
    </p>

    <!-- Button -->
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">
      <a href="${siteUrl}"
        style="display:inline-block;background:#4CAF78;color:#fff;text-decoration:none;
               padding:15px 36px;border-radius:12px;font-size:16px;font-weight:700;
               letter-spacing:0.2px;">
        Вернуться к марафону →
      </a>
    </td></tr></table>
  `
  return {
    subject: 'Скоро старт ежемесячного марафона',
    html: buildEmail(siteUrl, body),
  }
}

// ── Шаблон 3 — день 30 ───────────────────────────────────────────────────────
function template3(firstName: string, siteUrl: string): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 18px;font-size:16px;font-weight:700;color:#3D2B8A;">${firstName}, здравствуйте 🌷</p>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3D2B8A;">
      Прошёл месяц с тех пор, как Вы покинули Клуб. Я понимаю — жизнь,
      дела, иногда хочется паузы. Это нормально.
    </p>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3D2B8A;">
      Хочу, чтобы Вы знали: Ваш статус и история прогресса ещё
      сохранены. Если вернётесь сейчас — продолжите с того места, где
      остановились. Уровень, замеры, дневник, победы — всё на месте.
    </p>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3D2B8A;">
      После этого срока статус начнёт обнуляться. Не из-за строгости,
      а потому что Клуб — это про регулярность.
    </p>

    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#3D2B8A;">
      Если есть желание вернуться — двери открыты.
    </p>

    <!-- Button -->
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">
      <a href="${siteUrl}"
        style="display:inline-block;background:#4CAF78;color:#fff;text-decoration:none;
               padding:15px 36px;border-radius:12px;font-size:16px;font-weight:700;
               letter-spacing:0.2px;">
        Вернуться в Клуб →
      </a>
    </td></tr></table>
  `
  return {
    subject: 'Вы ещё можете вернуться без потери статуса',
    html: buildEmail(siteUrl, body),
  }
}

// ── GET handler ──────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://club.nata-tomshina.ru'

  const { data: members, error } = await admin
    .from('members')
    .select('id, email, full_name, name, subscription_ends_at, expiry_followup_step')
    .eq('subscription_status', 'expired')
    .lt('expiry_followup_step', 30)
    .not('subscription_ends_at', 'is', null)

  if (error) {
    console.error('[expiry-followup] DB error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!members || members.length === 0) {
    return NextResponse.json({ ok: true, checked: 0, sent: 0, skipped: 0 })
  }

  let sent = 0
  let skipped = 0

  for (const m of members) {
    const day = Math.floor(
      (Date.now() - new Date(m.subscription_ends_at!).getTime()) / (24 * 60 * 60 * 1000)
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const step: number = (m as any).expiry_followup_step ?? 0

    const displayName = m.full_name ?? m.name ?? 'участница'
    const firstName = displayName.split(' ')[0]

    let tpl: { subject: string; html: string } | null = null
    let newStep = step

    if      (day === 1  && step < 1)  { tpl = template1(firstName, siteUrl); newStep = 1  }
    else if (day === 2  && step < 2)  { tpl = template1(firstName, siteUrl); newStep = 2  }
    else if (day === 3  && step < 3)  { tpl = template1(firstName, siteUrl); newStep = 3  }
    else if (day === 15 && step < 15) { tpl = template2(firstName, siteUrl); newStep = 15 }
    else if (day === 30 && step < 30) { tpl = template3(firstName, siteUrl); newStep = 30 }

    if (!tpl) {
      skipped++
      continue
    }

    const ok = await sendEmail({ from: FROM, to: m.email, subject: tpl.subject, html: tpl.html, raw: true })
    if (ok) {
      await admin.from('members').update({ expiry_followup_step: newStep }).eq('id', m.id)
      sent++
    } else {
      console.error('[expiry-followup] send failed for:', m.email)
      skipped++
    }
  }

  return NextResponse.json({ ok: true, checked: members.length, sent, skipped })
}
