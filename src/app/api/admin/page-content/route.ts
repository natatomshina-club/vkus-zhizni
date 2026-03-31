import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function GET(req: Request) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { searchParams } = new URL(req.url)
  const page = searchParams.get('page')
  if (!page) return NextResponse.json({ error: 'page param required' }, { status: 400 })

  const admin = createServiceClient()
  const { data } = await admin
    .from('page_content')
    .select('key, value')
    .eq('page', page)

  return NextResponse.json({ data: data ?? [] })
}

export async function PUT(req: Request) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => null)
  const { page, updates } = body ?? {}

  if (!page || !Array.isArray(updates)) {
    return NextResponse.json({ error: 'page and updates[] required' }, { status: 400 })
  }

  const admin = createServiceClient()
  const rows = updates
    .filter((u: { key: string; value: string }) => u.key)
    .map((u: { key: string; value: string }) => ({
      page,
      key: u.key,
      value: u.value ?? '',
      updated_at: new Date().toISOString(),
    }))

  const { error: dbErr } = await admin
    .from('page_content')
    .upsert(rows, { onConflict: 'page,key' })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
