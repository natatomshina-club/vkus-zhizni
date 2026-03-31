'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMember } from '@/contexts/MemberContext'

function MobileTrialBanner() {
  const { member, loading } = useMember()
  if (loading || !member) return null
  const effectiveStatus = member.subscription_status || member.status
  if (effectiveStatus !== 'trial') return null

  return (
    <div
      className="lg:hidden flex items-center justify-between gap-2 px-3 py-2 border-b"
      style={{
        background: 'linear-gradient(90deg, var(--pur) 0%, #9B7CFF 100%)',
        borderColor: 'transparent',
        flexShrink: 0,
      }}
    >
      <span className="text-xs font-semibold text-white/90" style={{ fontFamily: 'var(--font-nunito)' }}>
        ⏱ Пробный · 7 дней
      </span>
      <Link
        href="/dashboard/upgrade"
        className="text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap"
        style={{ background: 'rgba(255,255,255,0.22)', color: '#fff', fontFamily: 'var(--font-nunito)' }}
      >
        Открыть доступ →
      </Link>
    </div>
  )
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isChannelPage = pathname.startsWith('/dashboard/channel')

  return (
    <main
      className={
        isChannelPage
          ? 'flex-1 h-full overflow-hidden flex flex-col'
          : 'flex-1 h-full overflow-y-auto pb-20 lg:pb-0 flex flex-col'
      }
    >
      {!isChannelPage && <MobileTrialBanner />}
      <div className={isChannelPage ? 'flex-1 overflow-hidden' : 'flex-1'}>
        {children}
      </div>
    </main>
  )
}
