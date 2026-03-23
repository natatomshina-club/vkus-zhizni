import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ unread_count: 0 }, { status: 401 })

  const { count } = await supabase
    .from('private_messages')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', user.id)
    .eq('from_admin', true)
    .eq('is_read', false)

  return NextResponse.json({ unread_count: count ?? 0 })
}
