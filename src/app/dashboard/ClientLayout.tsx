'use client'

import { usePathname } from 'next/navigation'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isChannelPage = pathname.startsWith('/dashboard/channel')

  return (
    <main
      className={
        isChannelPage
          ? 'flex-1 h-full overflow-hidden'
          : 'flex-1 h-full overflow-y-auto pb-20 lg:pb-0'
      }
    >
      {children}
    </main>
  )
}
