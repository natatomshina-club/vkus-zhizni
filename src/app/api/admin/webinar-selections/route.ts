import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function GET() {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const admin = createServiceClient()

  const { data: selections } = await admin
    .from('webinar_selections')
    .select('id, member_id, webinar_id, status, selected_at')
    .eq('status', 'pending')
    .order('selected_at', { ascending: true })

  if (!selections || selections.length === 0) return NextResponse.json({ selections: [] })

  const memberIds = [...new Set(selections.map(s => s.member_id))]
  const webinarIds = [...new Set(selections.map(s => s.webinar_id))]

  const [membersRes, webinarsRes] = await Promise.all([
    admin.from('members').select('id, full_name, email').in('id', memberIds),
    admin.from('webinars').select('id, title, emoji').in('id', webinarIds),
  ])

  const membersMap = Object.fromEntries((membersRes.data ?? []).map(m => [m.id, m]))
  const webinarsMap = Object.fromEntries((webinarsRes.data ?? []).map(w => [w.id, w]))

  const result = selections.map(s => ({
    ...s,
    member: membersMap[s.member_id] ?? null,
    webinar: webinarsMap[s.webinar_id] ?? null,
  }))

  return NextResponse.json({ selections: result })
}
