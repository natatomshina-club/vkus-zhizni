import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceClient()
  const now = new Date().toISOString()

  const { data: due, error } = await admin
    .from('intro_course_pm_schedule')
    .select('id, member_id, day_number, message')
    .lte('send_at', now)
    .is('sent_at', null)
    .limit(100)

  if (error) {
    console.error('[intro-course-pm] query error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!due || due.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  let sent = 0
  let failed = 0

  for (const row of due) {
    const { error: pmErr } = await admin
      .from('private_messages')
      .insert({
        member_id: row.member_id,
        text: row.message,
        from_admin: true,
        is_read: false,
      })

    if (pmErr) {
      console.error('[intro-course-pm] pm insert error:', row.id, pmErr.message)
      failed++
      continue
    }

    const { error: updateErr } = await admin
      .from('intro_course_pm_schedule')
      .update({ sent_at: now })
      .eq('id', row.id)

    if (updateErr) {
      console.error('[intro-course-pm] sent_at update error:', row.id, updateErr.message)
    }

    sent++
  }

  console.log(`[intro-course-pm] sent=${sent} failed=${failed}`)
  return NextResponse.json({ ok: true, sent, failed })
}
