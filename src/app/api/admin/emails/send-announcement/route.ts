import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/mailer'
import { inlineStyles } from '@/lib/email-template'
import { baseEmailTemplate } from '@/lib/email-templates/base'
import { emailToToken } from '@/lib/email-utils'

export const dynamic = 'force-dynamic'

const FROM = 'Вкус Жизни <noreply@nata-tomshina.ru>'
const BATCH_SIZE = 50
const BATCH_DELAY_MS = 1000


function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

type Segment = 'trial' | 'monthly' | 'halfyear' | 'expired_trial' | 'expired' | 'cold' | 'getcourse_club' | 'leads'

const LEAD_SOURCES = ['website_free', 'marathon', 'blog']

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
  if (segment === 'leads') {
    const { data } = await admin.from('subscribers').select('email')
      .in('source', LEAD_SOURCES).eq('status', 'active')
    return (data ?? []).map(r => r.email).filter(Boolean)
  }
  if (segment === 'trial') {
    const { data } = await admin.from('members').select('email')
      .eq('subscription_status', 'trial')
    return (data ?? []).map(r => r.email).filter(Boolean)
  }
  if (segment === 'monthly') {
    const { data } = await admin.from('members').select('email')
      .eq('subscription_status', 'active').in('tariff', ['month', 'monthly'])
    return (data ?? []).map(r => r.email).filter(Boolean)
  }
  if (segment === 'halfyear') {
    const { data } = await admin.from('members').select('email')
      .eq('subscription_status', 'active').eq('tariff', 'halfyear')
    return (data ?? []).map(r => r.email).filter(Boolean)
  }
  if (segment === 'expired_trial') {
    const { data } = await admin.from('members').select('email')
      .eq('subscription_status', 'expired').in('tariff', ['trial', 'Пробный'])
    return (data ?? []).map(r => r.email).filter(Boolean)
  }
  if (segment === 'expired') {
    const { data } = await admin.from('members').select('email')
      .eq('subscription_status', 'expired').in('tariff', ['month', 'monthly', 'halfyear'])
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

    const { subject, bodyHtml, segment, emails: customEmails } = await req.json() as {
      subject: string
      bodyHtml: string
      segment?: Segment
      emails?: string[]
    }

    if (!subject?.trim() || !bodyHtml?.trim() || (!segment && !customEmails?.length)) {
      return NextResponse.json({ error: 'subject, bodyHtml, and either segment or emails required' }, { status: 400 })
    }

    const emails = customEmails?.length
      ? customEmails.map(e => e.trim()).filter(Boolean)
      : await fetchEmails(admin, segment!)
    if (emails.length === 0) {
      return NextResponse.json({ sent: 0 })
    }

    const content = inlineStyles(bodyHtml)
    // Build full template once; replace {{unsubscribe_token}} per recipient
    const templateHtml = baseEmailTemplate(content)
    let sent = 0

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE)

      await Promise.all(batch.map(async (email) => {
        const html = templateHtml.replace('{{unsubscribe_token}}', emailToToken(email))
        const ok = await sendEmail({ from: FROM, to: email, subject, html, raw: true })
        if (ok) sent++
        else console.error('[send-announcement] failed for', email)
      }))

      if (i + BATCH_SIZE < emails.length) await sleep(BATCH_DELAY_MS)
    }

    try {
      await admin.from('email_campaigns').insert({
        title: subject,
        subject,
        body_html: templateHtml,
        segment: segment ?? 'custom',
        sent_count: sent,
        sent_at: new Date().toISOString(),
      })
    } catch { /* non-critical */ }

    // История рассылок
    try {
      await admin.from('email_campaign_logs').insert({
        subject,
        segment: segment ?? 'custom',
        recipients_count: sent,
        sent_by: user.email ?? null,
      })
    } catch { /* non-critical */ }

    return NextResponse.json({ sent })
  } catch (e) {
    console.error('[send-announcement]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
