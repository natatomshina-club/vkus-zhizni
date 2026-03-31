'use client'

import Link from 'next/link'
import { useMember } from '@/contexts/MemberContext'

export default function MobileAdminBtn() {
  const { member } = useMember()
  const isAdmin = member?.role === 'admin'
  const isCurator = member?.role === 'curator'
  if (!isAdmin && !isCurator) return null

  const href = isCurator ? '/admin/marathons' : '/admin'

  return (
    <Link
      href={href}
      className="lg:hidden no-press"
      style={{
        position: 'fixed',
        top: 12,
        right: 16,
        zIndex: 50,
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        border: '1.5px solid var(--border)',
        borderRadius: '50%',
        boxShadow: '0 2px 8px rgba(124,92,252,0.12)',
        fontSize: 18,
        textDecoration: 'none',
      }}
      aria-label="Административная панель"
    >
      ⚙️
    </Link>
  )
}
