import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: true })

    const admin = createServiceClient()
    const { data } = await admin
      .from('help_materials')
      .select('views_count')
      .eq('id', id)
      .single()

    if (data) {
      await admin
        .from('help_materials')
        .update({ views_count: (data.views_count ?? 0) + 1 })
        .eq('id', id)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[help/materials/view]', e)
    return NextResponse.json({ ok: true })
  }
}
