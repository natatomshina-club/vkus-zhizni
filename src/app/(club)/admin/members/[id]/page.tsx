import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import type { MemberRow } from '@/types/admin'
import MemberClient from './MemberClient'

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createServiceClient()

  const { data, error } = await admin
    .from('members')
    .select('id, email, full_name, avatar_url, role, subscription_status, tariff, subscription_ends_at, is_blocked, blocked_at, blocked_reason, created_at, birth_date, admin_note, is_manual_subscription')
    .eq('id', id)
    .single()

  if (error || !data) redirect('/admin/members')

  const member = data as MemberRow

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link
          href="/admin/members"
          style={{
            fontSize: 13,
            color: '#7B6FAA',
            textDecoration: 'none',
            padding: '8px 12px',
            borderRadius: 10,
            background: '#F0EEFF',
          }}
        >
          ← Назад
        </Link>
        <h1
          style={{
            fontFamily: 'var(--font-unbounded)',
            fontSize: 16,
            fontWeight: 700,
            color: '#3D2B8A',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {member.full_name ?? member.email}
        </h1>
      </div>

      <MemberClient initial={member} />
    </div>
  )
}
