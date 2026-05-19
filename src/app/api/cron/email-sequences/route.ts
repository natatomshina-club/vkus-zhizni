import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/mailer'
import { baseEmailTemplate } from '@/lib/email-templates/base'
import { emailToToken } from '@/lib/email-utils'

export const dynamic = 'force-dynamic'

const FROM = 'Вкус Жизни <noreply@nata-tomshina.ru>'

// After welcome_leads completes → start evergreen
const NEXT_SERIES: Record<string, string> = {
  welcome_leads: 'evergreen',
}

export async function GET(req: Request) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceClient()
  const now = new Date().toISOString()

  // Find all due progress records
  const { data: dueProgress, error: progressErr } = await admin
    .from('subscriber_sequence_progress')
    .select('id, subscriber_id, series, current_step, next_send_at, completed')
    .eq('completed', false)
    .lte('next_send_at', now)
    .limit(200)

  if (progressErr) {
    console.error('[email-sequences cron] progress query error:', progressErr.message)
    return NextResponse.json({ error: progressErr.message }, { status: 500 })
  }

  if (!dueProgress || dueProgress.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  // Load all subscriber emails in one query
  const subIds = [...new Set(dueProgress.map(p => p.subscriber_id))]
  const { data: subscribers } = await admin
    .from('subscribers')
    .select('id, email, name, status')
    .in('id', subIds)

  const subMap = new Map((subscribers ?? []).map(s => [s.id, s]))

  let sent = 0
  let skipped = 0
  let completed = 0

  for (const progress of dueProgress) {
    const sub = subMap.get(progress.subscriber_id)

    // Skip unsubscribed or missing subscribers
    if (!sub || sub.status === 'unsubscribed') {
      await admin
        .from('subscriber_sequence_progress')
        .update({ completed: true })
        .eq('id', progress.id)
      skipped++
      continue
    }

    // Find next email in sequence (step = current_step + 1, is_active = true)
    const nextStep = (progress.current_step ?? 0) + 1
    const { data: seqEmail } = await admin
      .from('email_sequences')
      .select('id, step, subject, html, delay_days')
      .eq('series', progress.series)
      .eq('step', nextStep)
      .eq('is_active', true)
      .maybeSingle()

    if (!seqEmail) {
      // No more emails — mark completed
      await admin
        .from('subscriber_sequence_progress')
        .update({ completed: true })
        .eq('id', progress.id)
      completed++

      // Auto-start next series if configured
      const nextSeriesName = NEXT_SERIES[progress.series]
      if (nextSeriesName) {
        // Check if already has progress for next series
        const { data: existing } = await admin
          .from('subscriber_sequence_progress')
          .select('id')
          .eq('subscriber_id', progress.subscriber_id)
          .eq('series', nextSeriesName)
          .maybeSingle()

        if (!existing) {
          await admin.from('subscriber_sequence_progress').insert({
            subscriber_id: progress.subscriber_id,
            series: nextSeriesName,
            current_step: 0,
            next_send_at: new Date().toISOString(),
            completed: false,
          })
        }
      }
      continue
    }

    // Send email — wrap in template and replace unsubscribe token per recipient
    const wrappedHtml = baseEmailTemplate(seqEmail.html)
    const personalHtml = wrappedHtml.replace('{{unsubscribe_token}}', emailToToken(sub.email))
    const ok = await sendEmail({
      from: FROM,
      to: sub.email,
      subject: seqEmail.subject,
      html: personalHtml,
      raw: true,
    })

    if (ok) {
      const nextSendAt = new Date(Date.now() + (seqEmail.delay_days ?? 1) * 24 * 60 * 60 * 1000).toISOString()
      await admin
        .from('subscriber_sequence_progress')
        .update({
          current_step: nextStep,
          next_send_at: nextSendAt,
        })
        .eq('id', progress.id)
      sent++
    } else {
      console.error('[email-sequences cron] failed to send to:', sub.email)
    }
  }

  console.log(`[email-sequences cron] sent=${sent} skipped=${skipped} completed=${completed}`)
  return NextResponse.json({ ok: true, processed: dueProgress.length, sent, skipped, completed })
}
