import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MemberProvider } from '@/contexts/MemberContext'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import ClientLayout from './ClientLayout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  return (
    <MemberProvider>
      <div className="flex h-screen" style={{ background: 'var(--bg)' }}>
        <Sidebar />

        <ClientLayout>{children}</ClientLayout>

        <MobileNav />
      </div>
    </MemberProvider>
  )
}
