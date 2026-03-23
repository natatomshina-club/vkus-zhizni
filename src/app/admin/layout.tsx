import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const { data: member } = await supabase
    .from('members')
    .select('role')
    .eq('id', user.id)
    .single()

  if (member?.role !== 'admin') redirect('/dashboard')

  return (
    <div style={{ minHeight: '100dvh', background: '#FAF8FF', fontFamily: 'var(--font-nunito)' }}>
      {/* Top bar */}
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid #EDE8FF',
          padding: '0 20px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <Link
          href="/dashboard"
          style={{
            fontSize: 13,
            color: '#7B6FAA',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 10,
            background: '#F0EEFF',
          }}
        >
          ← Вернуться в клуб
        </Link>

        <span
          style={{
            fontFamily: 'var(--font-unbounded)',
            fontSize: 13,
            fontWeight: 700,
            color: '#3D2B8A',
          }}
        >
          Панель Наташи
        </span>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 48px' }}>
        {children}
      </main>
    </div>
  )
}
