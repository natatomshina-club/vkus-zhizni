import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createServiceClient()

  const { data } = await admin
    .from('meditations')
    .select('play_count')
    .eq('id', id)
    .single()

  await admin
    .from('meditations')
    .update({ play_count: (data?.play_count ?? 0) + 1 })
    .eq('id', id)

  return NextResponse.json({ ok: true })
}
