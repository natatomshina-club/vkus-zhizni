import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { inlineStyles, buildEmailHtml } from '@/lib/email-template'

export const dynamic = 'force-dynamic'

const FROM = 'Вкус Жизни <noreply@nata-tomshina.ru>'
const BATCH_SIZE = 50
const BATCH_DELAY_MS = 1000


function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

type Segment = 'trial' | 'monthly' | 'halfyear' | 'expired_trial' | 'expired' | 'cold' | 'getcourse_club'

async function fetchEmails(admin: ReturnType<typeof createServiceClient>, segment: Segment): Promise<string[]> {
  if (segment === 'cold') {
    const { data } = await admin.from('subscribers').select('email')
      .eq('status', 'active').eq('converted_to_member', false)
    return (data ?? []).map(r => r.email).filter(Boolean)
  }
  if (segment === 'getcourse_club') {
    const { data } = await admin.from('subscribers').select('email')
      .eq('source', 'getcourse_club').eq('status', 'active').eq('converted_to_member', false)
    return (data ?? []).map(r => r.email).filter(Boolean)
  }
  if (segment === 'trial') {
    const { data } = await admin.from('members').select('email')
      .eq('subscription_status', 'active').eq('tariff', 'trial')
    return (data ?? []).map(r => r.email).filter(Boolean)
  }
  if (segment === 'monthly') {
    const { data } = await admin.from('members').select('email')
      .eq('subscription_status', 'active').eq('tariff', 'monthly')
    return (data ?? []).map(r => r.email).filter(Boolean)
  }
  if (segment === 'halfyear') {
    const { data } = await admin.from('members').select('email')
      .eq('subscription_status', 'active').eq('tariff', 'halfyear')
    return (data ?? []).map(r => r.email).filter(Boolean)
  }
  if (segment === 'expired_trial') {
    const { data } = await admin.from('members').select('email')
      .eq('tariff', 'trial').eq('subscription_status', 'expired')
    return (data ?? []).map(r => r.email).filter(Boolean)
  }
  if (segment === 'expired') {
    const { data } = await admin.from('members').select('email')
      .eq('subscription_status', 'expired').neq('tariff', 'trial')
    return (data ?? []).map(r => r.email).filter(Boolean)
  }
  return []
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()
    const { data: member } = await admin.from('members').select('role').eq('email', user.email).single()
    if (member?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { subject, bodyHtml, segment } = await req.json() as {
      subject: string
      bodyHtml: string
      segment: Segment
    }

    if (!subject?.trim() || !bodyHtml?.trim() || !segment) {
      return NextResponse.json({ error: 'subject, bodyHtml, segment required' }, { status: 400 })
    }

    const emails = await fetchEmails(admin, segment)
    if (emails.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    const content = inlineStyles(bodyHtml)
    const resend = new Resend()
    let sent = 0

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE)

      await Promise.all(batch.map(async (email) => {
        const token = Buffer.from(email).toString('base64url')
        const html = buildEmailHtml(content, token)

        try {
          await resend.emails.send({ from: FROM, to: email, subject, html })
          sent++
        } catch (e) {
          console.error('[send-announcement] failed for', email, e)
        }
      }))

      if (i + BATCH_SIZE < emails.length) await sleep(BATCH_DELAY_MS)
    }

    try {
      await admin.from('email_campaigns').insert({
        title: subject,
        subject,
        body_html: buildEmailHtml(content, '{{UNSUBSCRIBE_TOKEN}}'),
        segment,
        sent_count: sent,
        sent_at: new Date().toISOString(),
      })
    } catch { /* non-critical */ }

    return NextResponse.json({ sent })
  } catch (e) {
    console.error('[send-announcement]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
