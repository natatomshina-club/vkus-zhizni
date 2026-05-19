import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()
    const { data: member } = await admin
      .from('members')
      .select('id')
      .eq('email', user.email!)
      .single()

    if (!member) return NextResponse.json({ notifications: [], unread_count: 0 })

    const { data: notifications } = await admin
      .from('notifications')
      .select('id, type, type_extra, text, link, is_read, created_at')
      .eq('member_id', member.id)
      .order('is_read', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(20)

    const list = notifications ?? []
    const unread_count = list.filter(n => !n.is_read).length

    return NextResponse.json({ notifications: list, unread_count })
  } catch (e) {
    console.error('[notifications GET]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
