import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()

  // Active first, then planned
  const [{ data: marathons }, { data: past }, { data: member }] = await Promise.all([
    admin
      .from('marathons')
      .select('id, title, description, starts_at, ends_at, duration_days, status, month_label, chat_channel_slug, ration_pdf_url, shopping_list_pdf_url, announce_title, announce_features, announce_prepare_text, emoji, next_date')
      .in('status', ['active', 'planned'])
      .order('starts_at', { ascending: true })
      .limit(1),
    admin
      .from('marathons')
      .select('id, title, month_label, emoji, starts_at, ends_at, status')
      .eq('status', 'finished')
      .order('ends_at', { ascending: false })
      .limit(6),
    admin
      .from('members')
      .select('subscription_status')
      .eq('email', user.email!)
      .single(),
  ])

  const marathon = marathons?.[0] ?? null

  return NextResponse.json({
    marathon,
    past: past ?? [],
    subscription_status: member?.subscription_status ?? null,
  })
}
