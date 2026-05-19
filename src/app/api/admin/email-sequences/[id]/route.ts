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

// PATCH /api/admin/email-sequences/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id } = await params
  const body = await req.json() as {
    subject?: string
    html?: string
    delay_days?: number
    is_active?: boolean
    step?: number
  }

  const admin = createServiceClient()
  const { data, error: dbErr } = await admin
    .from('email_sequences')
    .update({
      ...(body.subject !== undefined && { subject: body.subject }),
      ...(body.html !== undefined && { html: body.html }),
      ...(body.delay_days !== undefined && { delay_days: body.delay_days }),
      ...(body.is_active !== undefined && { is_active: body.is_active }),
      ...(body.step !== undefined && { step: body.step }),
    })
    .eq('id', id)
    .select('id, series, step, subject, html, delay_days, is_active, created_at')
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ email: data })
}

// DELETE /api/admin/email-sequences/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id } = await params
  const admin = createServiceClient()
  const { error: dbErr } = await admin
    .from('email_sequences')
    .delete()
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
