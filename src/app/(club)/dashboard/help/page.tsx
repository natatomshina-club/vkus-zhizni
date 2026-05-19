import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import HelpClient from './HelpClient'

export const dynamic = 'force-dynamic'

interface HelpMaterial {
  id: string
  title: string
  description: string | null
  format: string
  content_url: string | null
  thumbnail_url: string | null
  duration_label: string | null
  sort_order: number
  views_count: number
  is_published: boolean
  attachments: { name: string; url: string }[] | null
  locked: boolean
}

export default async function HelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const admin = createServiceClient()
  const { data: member } = await admin
    .from('members')
    .select('role, subscription_status')
    .eq('email', user.email!)
    .single()

  const isAdmin = member?.role === 'admin'
  const isTrial = member?.subscription_status !== 'active'

  let query = admin
    .from('help_materials')
    .select('id, title, description, format, content_url, thumbnail_url, duration_label, sort_order, views_count, is_published, attachments')
    .order('sort_order')

  if (!isAdmin) query = query.eq('is_published', true)

  const { data } = await query
  const raw = data ?? []

  const materials: HelpMaterial[] = raw.map((m, i) => {
    if (isAdmin || !isTrial || i < 3) return { ...m, locked: false }
    return { ...m, content_url: null, locked: true }
  })

  const hasLockedMaterials = !isAdmin && isTrial && materials.some(m => m.locked)

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 96px', fontFamily: 'var(--font-nunito)' }}>
      <h1 style={{ fontFamily: 'var(--font-unbounded)', fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
        🗺 Карта помощи
      </h1>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>
        Инструкции, ответы на вопросы и материалы на все случаи жизни
      </p>

      <HelpClient
        materials={materials}
        hasLockedMaterials={hasLockedMaterials}
        isAdmin={isAdmin}
      />
    </div>
  )
}
