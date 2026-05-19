import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

// GET /api/admin/email-sequences?series=welcome_leads
export async function GET(req: NextRequest) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const series = req.nextUrl.searchParams.get('series')
  if (!series) return NextResponse.json({ error: 'series required' }, { status: 400 })

  const admin = createServiceClient()
  const { data, error: dbErr } = await admin
    .from('email_sequences')
    .select('id, series, step, subject, html, delay_days, is_active, created_at')
    .eq('series', series)
    .order('step', { ascending: true })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ emails: data ?? [] })
}

// POST /api/admin/email-sequences
export async function POST(req: NextRequest) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json() as {
    series: string
    subject: string
    html: string
    delay_days?: number
    is_active?: boolean
  }

  const { series, subject, html } = body
  if (!series?.trim() || !subject?.trim() || !html?.trim()) {
    return NextResponse.json({ error: 'series, subject, html required' }, { status: 400 })
  }

  const admin = createServiceClient()

  // Auto-assign step = max(step) + 1 for this series
  const { data: maxRow } = await admin
    .from('email_sequences')
    .select('step')
    .eq('series', series)
    .order('step', { ascending: false })
    .limit(1)
    .maybeSingle()

  const step = (maxRow?.step ?? 0) + 1

  const { data, error: dbErr } = await admin
    .from('email_sequences')
    .insert({
      series,
      step,
      subject,
      html,
      delay_days: body.delay_days ?? 1,
      is_active: body.is_active ?? true,
    })
    .select('id, series, step, subject, html, delay_days, is_active, created_at')
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ email: data }, { status: 201 })
}
