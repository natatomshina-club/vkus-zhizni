import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { INTRO_COURSE_MESSAGES } from '@/lib/intro-course-messages'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const admin = createServiceClient()
  const { data: member } = await admin.from('members').select('role').eq('email', user.email).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id: memberId } = await params
  const admin = createServiceClient()

  // Проверить не запущен ли уже курс
  const { data: existing } = await admin
    .from('intro_course_pm_schedule')
    .select('id')
    .eq('member_id', memberId)
    .limit(1)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'already_launched' }, { status: 409 })
  }

  // Получить email участницы
  const { data: memberRow, error: memberErr } = await admin
    .from('members')
    .select('email')
    .eq('id', memberId)
    .single()

  if (memberErr || !memberRow) {
    return NextResponse.json({ error: 'Участница не найдена' }, { status: 404 })
  }

  const now = new Date()
  const launchedAt = now.toISOString()

  // Создать 13 записей в intro_course_pm_schedule
  const scheduledPMs = INTRO_COURSE_MESSAGES.map(({ day, text }) => {
    const sendAt = new Date(now)
    sendAt.setDate(sendAt.getDate() + day - 1)
    sendAt.setUTCHours(9, 0, 0, 0)
    if (day === 1 && sendAt <= now) {
      sendAt.setDate(sendAt.getDate() + 1)
    }
    return {
      member_id: memberId,
      day_number: day,
      message: text,
      send_at: sendAt.toISOString(),
    }
  })

  const { error: pmErr } = await admin
    .from('intro_course_pm_schedule')
    .insert(scheduledPMs)

  if (pmErr) {
    console.error('[launch-intro-course] pm insert error:', pmErr.message)
    return NextResponse.json({ error: pmErr.message }, { status: 500 })
  }

  // Запустить email-серию (через subscriber_sequence_progress)
  try {
    const { data: subRow } = await admin
      .from('subscribers')
      .select('id')
      .eq('email', memberRow.email)
      .maybeSingle()

    if (subRow?.id) {
      const { data: existingProgress } = await admin
        .from('subscriber_sequence_progress')
        .select('id')
        .eq('subscriber_id', subRow.id)
        .eq('series', 'intro_course')
        .maybeSingle()

      if (!existingProgress) {
        await admin.from('subscriber_sequence_progress').insert({
          subscriber_id: subRow.id,
          series: 'intro_course',
          current_step: 0,
          next_send_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          completed: false,
        })
      }
    }
  } catch (e) {
    console.warn('[launch-intro-course] email sequence error:', e)
  }

  return NextResponse.json({ ok: true, launched_at: launchedAt })
}
