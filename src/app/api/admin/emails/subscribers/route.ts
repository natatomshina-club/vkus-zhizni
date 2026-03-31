import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()
  const { data: member } = await admin.from('members').select('role').eq('email', user.email).single()
  if (member?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sp = req.nextUrl.searchParams
  const page  = Math.max(1, parseInt(sp.get('page')  ?? '1',  10))
  const limit = Math.min(200, Math.max(1, parseInt(sp.get('limit') ?? '50', 10)))
  const search = sp.get('search')?.trim() ?? ''

  const from = (page - 1) * limit
  const to   = from + limit - 1

  // ── Paginated query ────────────────────────────────────────────────
  let query = admin
    .from('subscribers')
    .select('id, email, name, source, status, converted_to_member, subscribed_at', { count: 'exact' })
    .order('subscribed_at', { ascending: false })

  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
  }

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const total      = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  // ── Stats (always full base, independent of search/page) ──────────
  const [sTotal, sCold, sClub, sConverted, sUnsub] = await Promise.all([
    admin.from('subscribers').select('*', { count: 'exact', head: true }),
    admin.from('subscribers').select('*', { count: 'exact', head: true })
      .eq('status', 'active').eq('converted_to_member', false),
    admin.from('subscribers').select('*', { count: 'exact', head: true })
      .eq('source', 'getcourse_club').eq('status', 'active'),
    admin.from('subscribers').select('*', { count: 'exact', head: true })
      .eq('converted_to_member', true),
    admin.from('subscribers').select('*', { count: 'exact', head: true })
      .eq('status', 'unsubscribed'),
  ])

  return NextResponse.json({
    subscribers: data ?? [],
    total,
    page,
    totalPages,
    stats: {
      total:       sTotal.count     ?? 0,
      cold:        sCold.count      ?? 0,
      clubCount:   sClub.count      ?? 0,
      converted:   sConverted.count ?? 0,
      unsubscribed: sUnsub.count    ?? 0,
    },
  })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()
  const { data: member } = await admin.from('members').select('role').eq('email', user.email).single()
  if (member?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const { error } = await admin.from('subscribers').delete().eq('email', email)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
