import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 }
  const { data: member } = await supabase
    .from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 }
  return { user, error: null, status: 200 }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { user, error, status } = await checkAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { memberId } = await params
  const admin = createServiceClient()

  const [
    { data: messages, error: msgErr },
    { data: memberProfile, error: memErr },
    { data: lastMeasurement },
  ] = await Promise.all([
    admin
      .from('private_messages')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: true }),
    admin
      .from('members')
      .select('id, name, full_name, email, status, created_at')
      .eq('id', memberId)
      .single(),
    admin
      .from('measurements')
      .select('weight')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 })
  if (memErr) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Mark member's unread messages as read
  await admin
    .from('private_messages')
    .update({ is_read: true })
    .eq('member_id', memberId)
    .eq('from_admin', false)
    .eq('is_read', false)

  return NextResponse.json({
    messages,
    member: { ...memberProfile, weight: lastMeasurement?.weight ?? null },
  })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { user, error, status } = await checkAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { memberId } = await params
  const admin = createServiceClient()

  // Validate memberId
  const { data: target } = await admin
    .from('members').select('id').eq('id', memberId).single()
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  if (!text) return NextResponse.json({ error: 'text обязателен' }, { status: 400 })
  if (text.length > 2000) return NextResponse.json({ error: 'max 2000 символов' }, { status: 400 })

  const { data, error: insErr } = await admin
    .from('private_messages')
    .insert({
      member_id: memberId,
      text,
      from_admin: true,  // only admin route can set this
      is_read: false,
    })
    .select()
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  return NextResponse.json({ message: data }, { status: 201 })
}
