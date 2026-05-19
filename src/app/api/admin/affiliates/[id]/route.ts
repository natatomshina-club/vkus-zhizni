import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/mailer'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createServiceClient()
  const { data: member } = await admin.from('members').select('role').eq('email', user.email).single()
  return member?.role === 'admin' ? admin : null
}

// PATCH /api/admin/affiliates/[id] — change status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { status } = await req.json() as { status: string }

  if (!['active', 'suspended', 'blocked'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data: affiliate, error: fetchErr } = await admin
    .from('affiliates')
    .select('id, name, email, ref_code, status')
    .eq('id', id)
    .single()

  if (fetchErr || !affiliate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await admin
    .from('affiliates')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send welcome email when approving
  if (status === 'active' && affiliate.status === 'pending') {
    const refUrl = `https://www.nata-tomshina.ru/join?ref=${affiliate.ref_code}`
    const dashUrl = 'https://www.nata-tomshina.ru/partner/login'
    const firstName = (affiliate.name as string).split(' ')[0]

    await sendEmail({
      from: 'Наталья Томшина <noreply@nata-tomshina.ru>',
      to: affiliate.email,
      subject: 'Добро пожаловать в партнёрскую программу «Вкус Жизни»! 🎉',
      html: `
        <div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:40px 24px;">
          <h2 style="font-size:22px;color:#3D2B8A;margin:0 0 16px;">Привет, ${firstName}! 🎉</h2>
          <p style="font-size:16px;color:#2D1F6E;line-height:1.7;margin:0 0 20px;">
            Ваша заявка в партнёрскую программу клуба «Вкус Жизни» одобрена!
          </p>
          <p style="font-size:15px;color:#7B6FAA;line-height:1.7;margin:0 0 24px;">
            Теперь вы можете зарабатывать, рекомендуя клуб своей аудитории. Вот ваша персональная реферальная ссылка:
          </p>
          <div style="background:#F0EEFF;border-radius:14px;padding:18px 24px;margin-bottom:28px;">
            <p style="margin:0;font-size:13px;color:#7B6FAA;margin-bottom:6px;">Ваша реферальная ссылка:</p>
            <p style="margin:0;font-family:monospace;font-size:15px;color:#3D2B8A;font-weight:700;word-break:break-all;">${refUrl}</p>
          </div>
          <p style="font-size:15px;color:#7B6FAA;line-height:1.7;margin:0 0 28px;">
            Делитесь ссылкой везде — в сторис, блоге, Telegram-канале. За каждую вступившую участницу вы получаете <strong style="color:#3D2B8A;">20% от первого платежа</strong> и <strong style="color:#3D2B8A;">10% от каждого продления</strong>.
          </p>
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${dashUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C5CFC,#5B3FA8);color:#fff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:100px;text-decoration:none;">
              Войти в кабинет партнёра →
            </a>
          </div>
          <hr style="border:none;border-top:1px solid #EDE8FF;margin:0 0 20px;">
          <p style="font-size:13px;color:#9B8FCC;margin:0;">Вопросы: <a href="mailto:hello@nata-tomshina.ru" style="color:#7C5CFC;">hello@nata-tomshina.ru</a></p>
        </div>
      `,
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
