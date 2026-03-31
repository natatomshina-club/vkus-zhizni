import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Transliterate Russian → Latin for ref_code generation
function transliterate(text: string): string {
  const map: Record<string, string> = {
    а:'a', б:'b', в:'v', г:'g', д:'d', е:'e', ё:'yo', ж:'zh', з:'z',
    и:'i', й:'y', к:'k', л:'l', м:'m', н:'n', о:'o', п:'p', р:'r',
    с:'s', т:'t', у:'u', ф:'f', х:'kh', ц:'ts', ч:'ch', ш:'sh',
    щ:'shch', ъ:'', ы:'y', ь:'', э:'e', ю:'yu', я:'ya',
  }
  return text
    .toLowerCase()
    .split('')
    .map(c => map[c] ?? (/[a-z0-9]/.test(c) ? c : ''))
    .join('')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 16)
}

function randomDigits(n: number): string {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('')
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, promo_text } = await req.json() as {
      name?: string; email?: string; promo_text?: string
    }

    if (!name?.trim() || !email?.trim() || !promo_text?.trim()) {
      return NextResponse.json({ error: 'Заполните все обязательные поля' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail.includes('@')) {
      return NextResponse.json({ error: 'Некорректный email' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Check if email already exists in affiliates
    const { data: existing } = await supabase
      .from('affiliates')
      .select('id')
      .eq('email', cleanEmail)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Заявка с этим email уже существует' }, { status: 409 })
    }

    // Generate unique ref_code: translitName_XXXX
    const base = transliterate(name.trim()) || 'partner'
    let refCode = `${base}_${randomDigits(4)}`
    // Ensure uniqueness
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: taken } = await supabase
        .from('affiliates')
        .select('id')
        .eq('ref_code', refCode)
        .single()
      if (!taken) break
      refCode = `${base}_${randomDigits(4)}`
    }

    // Insert affiliate application
    const { error: insertError } = await supabase.from('affiliates').insert({
      name: name.trim(),
      email: cleanEmail,
      ref_code: refCode,
      status: 'pending',
      commission_rate: 0.20,
      recurring_rate: 0.10,
      promo_text: promo_text.trim(),
    })

    if (insertError) {
      console.error('[partner/apply] insert error:', insertError.message)
      return NextResponse.json({ error: 'Не удалось сохранить заявку' }, { status: 500 })
    }

    // Notify admin
    await resend.emails.send({
      from: 'Вкус Жизни <hello@nata-tomshina.ru>',
      to: ['nata.tomshina@gmail.com', 'jm-consult@mail.ru'],
      subject: `Новая заявка партнёра — ${name.trim()}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;">
          <h2 style="font-size:22px;color:#3D2B8A;margin:0 0 20px;">Новая заявка в партнёрскую программу</h2>
          <table style="width:100%;border-collapse:collapse;font-size:15px;">
            <tr><td style="padding:10px 0;color:#7B6FAA;width:140px;">Имя</td><td style="padding:10px 0;color:#2D1F6E;font-weight:600;">${name.trim()}</td></tr>
            <tr><td style="padding:10px 0;color:#7B6FAA;">Email</td><td style="padding:10px 0;color:#2D1F6E;">${cleanEmail}</td></tr>
            <tr><td style="padding:10px 0;color:#7B6FAA;">Ref-код</td><td style="padding:10px 0;color:#7C5CFC;font-weight:700;font-family:monospace;">${refCode}</td></tr>
            <tr><td style="padding:10px 0;color:#7B6FAA;vertical-align:top;">Как продвигать</td><td style="padding:10px 0;color:#2D1F6E;line-height:1.6;">${promo_text.trim().replace(/\n/g, '<br>')}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #EDE8FF;margin:28px 0;">
          <p style="font-size:13px;color:#9B8FCC;margin:0;">Одобрите или отклоните заявку в <a href="https://club.nata-tomshina.ru/admin" style="color:#7C5CFC;">панели администратора</a>.</p>
        </div>
      `,
    }).catch(e => console.error('[partner/apply] admin email error:', e))

    // Confirm to applicant
    await resend.emails.send({
      from: 'Наталья Томшина <hello@nata-tomshina.ru>',
      to: cleanEmail,
      subject: 'Заявка в партнёрскую программу получена',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 24px;">
          <h2 style="font-size:22px;color:#3D2B8A;margin:0 0 16px;">Привет, ${name.trim().split(' ')[0]}! 👋</h2>
          <p style="font-size:16px;color:#2D1F6E;line-height:1.7;margin:0 0 20px;">
            Мы получили вашу заявку на участие в партнёрской программе клуба «Вкус Жизни».
          </p>
          <p style="font-size:15px;color:#7B6FAA;line-height:1.7;margin:0 0 28px;">
            Рассмотрим в течение <strong style="color:#3D2B8A;">2 рабочих дней</strong> и напишем на этот email с дальнейшими инструкциями.
          </p>
          <div style="background:#F0EEFF;border-radius:14px;padding:20px 24px;margin-bottom:28px;">
            <p style="margin:0;font-size:14px;color:#3D2B8A;line-height:1.6;">
              Пока ждёте ответа — можете сами познакомиться с клубом и программой, чтобы рекомендовать её с удовольствием 🌿
            </p>
          </div>
          <div style="text-align:center;margin-bottom:32px;">
            <a href="https://www.nata-tomshina.ru/club" style="display:inline-block;background:linear-gradient(135deg,#7C5CFC,#5B3FA8);color:#fff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:100px;text-decoration:none;">
              Познакомиться с клубом →
            </a>
          </div>
          <hr style="border:none;border-top:1px solid #EDE8FF;margin:0 0 20px;">
          <p style="font-size:13px;color:#9B8FCC;margin:0;">Наталья Томшина · Клуб «Вкус Жизни»</p>
        </div>
      `,
    }).catch(e => console.error('[partner/apply] confirm email error:', e))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[partner/apply] error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
