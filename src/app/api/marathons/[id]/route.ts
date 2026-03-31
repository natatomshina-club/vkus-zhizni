import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()
  const { data: marathon, error } = await admin
    .from('marathons')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !marathon) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ marathon })
}
