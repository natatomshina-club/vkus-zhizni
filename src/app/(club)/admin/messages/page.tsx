import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import MessagesLayout from './MessagesLayout'

export default async function AdminMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: member } = await supabase
    .from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') redirect('/dashboard')

  const admin = createServiceClient()

  // Initial dialogs
  const { data: messages } = await admin
    .from('private_messages')
    .select('member_id, text, from_admin, is_read, created_at, member:members!inner(id, name, full_name, email, status, created_at)')
    .order('created_at', { ascending: true })

  type MsgRow = {
    member_id: string
    text: string
    from_admin: boolean
    is_read: boolean
    created_at: string
    member: { id: string; name: string | null; full_name: string | null; email: string; status: string; created_at: string } | null
  }

  const dialogMap = new Map<string, {
    member_id: string
    member: MsgRow['member']
    last_message: string
    last_message_at: string
    unread_count: number
  }>()

  for (const msg of (messages ?? []) as unknown as MsgRow[]) {
    const existing = dialogMap.get(msg.member_id)
    if (!existing) {
      dialogMap.set(msg.member_id, {
        member_id: msg.member_id,
        member: msg.member,
        last_message: msg.text.slice(0, 60),
        last_message_at: msg.created_at,
        unread_count: !msg.from_admin && !msg.is_read ? 1 : 0,
      })
    } else {
      existing.last_message = msg.text.slice(0, 60)
      existing.last_message_at = msg.created_at
      if (!msg.from_admin && !msg.is_read) existing.unread_count++
    }
  }

  const dialogs = Array.from(dialogMap.values()).sort((a, b) => {
    if (a.unread_count > 0 && b.unread_count === 0) return -1
    if (a.unread_count === 0 && b.unread_count > 0) return 1
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  })

  // Active marathon
  const { data: marathon } = await admin
    .from('marathons')
    .select('id, title, status, ends_at, next_date')
    .eq('status', 'active')
    .order('starts_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Suspense fallback={null}>
        <MessagesLayout initialDialogs={dialogs} marathon={marathon} />
      </Suspense>
    </div>
  )
}
