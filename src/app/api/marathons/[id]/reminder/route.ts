import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()

  const { data: member } = await admin
    .from('members')
    .select('id')
    .or(`id.eq.${user.id},email.eq.${user.email}`)
    .maybeSingle()

  if (!member) return NextResponse.json({ registered: false })

  const { data } = await admin
    .from('marathon_reminders')
    .select('id')
    .eq('marathon_id', id)
    .eq('member_id', member.id)
    .maybeSingle()

  return NextResponse.json({ registered: !!data })
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()

  // Look up member by auth user id OR by email (handles id mismatch)
  const { data: member } = await admin
    .from('members')
    .select('id, email, full_name, name, first_name')
    .or(`id.eq.${user.id},email.eq.${user.email}`)
    .maybeSingle()

  if (!member) {
    console.error('[reminder] member not found for user:', user.id, user.email)
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  const memberId = member.id

  const { data: existing } = await admin
    .from('marathon_reminders')
    .select('id')
    .eq('marathon_id', id)
    .eq('member_id', memberId)
    .maybeSingle()

  if (existing) return NextResponse.json({ ok: true, already: true })

  const { error: insertError } = await admin.from('marathon_reminders').insert({
    marathon_id: id,
    member_id: memberId,
    remind_at: new Date().toISOString(),
    sent: false,
  })

  if (insertError) {
    console.error('[reminder] insert error:', insertError.code, insertError.message, insertError.details)
    return NextResponse.json({ error: insertError.message, code: insertError.code }, { status: 500 })
  }

  // Send confirmation email (best-effort — never fails the request)
  try {
    const { data: marathon } = await admin
      .from('marathons')
      .select('title, next_date, month_label')
      .eq('id', id)
      .single()

    if (member.email && marathon) {
      const firstName = member.first_name
        || (() => { const p = (member.full_name ?? member.name ?? '').trim().split(/\s+/); return p.length >= 2 ? p[1] : p[0] })()
        || 'участница'
      const dateLabel = marathon.month_label ?? marathon.next_date ?? ''
      await sendEmail({
        to: member.email,
        subject: `Напомним о марафоне «${marathon.title}» ✅`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;">
            <h2 style="font-size:20px;color:#3D2B8A;margin:0 0 12px;">Привет, ${firstName}! 🙌</h2>
            <p style="font-size:15px;color:#2D1F6E;line-height:1.7;margin:0 0 16px;">
              Ты записалась на уведомление о марафоне <strong>«${marathon.title}»</strong>${dateLabel ? ` (${dateLabel})` : ''}.
            </p>
            <p style="font-size:15px;color:#7B6FAA;line-height:1.7;margin:0;">
              Мы пришлём письмо, как только марафон будет открыт для записи. 💜
            </p>
            <hr style="border:none;border-top:1px solid #EDE8FF;margin:28px 0;">
            <p style="font-size:13px;color:#9B8FCC;margin:0;">Наталья Томшина · Клуб «Вкус Жизни»</p>
          </div>
        `,
      })
    }
  } catch (e) {
    console.error('[reminder] email error (non-fatal):', e)
  }

  return NextResponse.json({ ok: true })
}
