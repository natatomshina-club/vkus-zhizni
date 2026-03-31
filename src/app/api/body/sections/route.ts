import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()

  const { data: member } = await admin
    .from('members')
    .select('subscription_status')
    .eq('email', user.email!)
    .single()

  const isTrial = member?.subscription_status === 'trial'

  const { data: sections, error: sectErr } = await admin
    .from('body_sections')
    .select('id, title, emoji, sort_order')
    .eq('is_active', true)
    .order('sort_order')

  if (sectErr) return NextResponse.json({ error: sectErr.message }, { status: 500 })

  const { data: materials } = await admin
    .from('body_materials')
    .select('id, section_id, title, description, format, content_url, thumbnail_url, duration_label, sort_order, views_count')
    .eq('is_published', true)
    .order('sort_order')

  // Group materials by section
  const matBySect = new Map<string, typeof materials>()
  for (const m of materials ?? []) {
    const list = matBySect.get(m.section_id) ?? []
    list.push(m)
    matBySect.set(m.section_id, list)
  }

  // Trial locking: first 3 materials (globally across all sections) are free
  let freeCount = 0
  const result = (sections ?? []).map(s => {
    const mats = (matBySect.get(s.id) ?? []).map(m => {
      freeCount++
      if (!isTrial || freeCount <= 3) return { ...m, locked: false }
      return { ...m, content_url: null, locked: true }
    })
    return { ...s, materials: mats }
  })

  return NextResponse.json({ sections: result, isTrial })
}
