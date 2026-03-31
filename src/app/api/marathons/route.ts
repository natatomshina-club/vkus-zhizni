import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()

  // Active first, then planned
  const { data: marathons } = await admin
    .from('marathons')
    .select('*')
    .in('status', ['active', 'planned'])
    .order('starts_at', { ascending: true })
    .limit(1)

  const marathon = marathons?.[0] ?? null

  // Also fetch past marathons (finished)
  const { data: past } = await admin
    .from('marathons')
    .select('id, title, month_label, emoji, starts_at, ends_at, status')
    .eq('status', 'finished')
    .order('ends_at', { ascending: false })
    .limit(6)

  return NextResponse.json({ marathon, past: past ?? [] })
}
