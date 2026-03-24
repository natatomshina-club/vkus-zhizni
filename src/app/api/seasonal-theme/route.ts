import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const revalidate = 3600 // 1 hour

export async function GET() {
  const admin = createServiceClient()

  // Get today's date in MM-DD format
  const now = new Date()
  const today = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // First check if any theme is force-enabled
  const { data: forced } = await admin
    .from('seasonal_themes')
    .select('id, slug, title, emoji, particle_type, accent_color, accent_light, is_forced')
    .eq('is_forced', true)
    .limit(1)
    .maybeSingle()

  if (forced) {
    return NextResponse.json({ theme: forced })
  }

  // Otherwise check if today falls within any theme's date range
  const { data: themes } = await admin
    .from('seasonal_themes')
    .select('id, slug, title, emoji, particle_type, accent_color, accent_light, is_forced, start_date, end_date')

  if (!themes || themes.length === 0) {
    return NextResponse.json({ theme: null })
  }

  const active = themes.find(t => {
    const start = t.start_date as string
    const end = t.end_date as string
    if (start <= end) {
      return today >= start && today <= end
    }
    // Wraps around year boundary (e.g. 12-01 to 01-15)
    return today >= start || today <= end
  })

  return NextResponse.json({ theme: active ?? null })
}
