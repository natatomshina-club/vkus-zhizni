import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    const link: string | null = typeof body?.link === 'string' ? body.link : null
    const ids: string[] | null = Array.isArray(body?.ids) ? body.ids : null

    const admin = createServiceClient()
    const { data: member } = await admin
      .from('members')
      .select('id')
      .eq('email', user.email!)
      .single()

    if (!member) return NextResponse.json({ ok: true })

    let query = admin
      .from('notifications')
      .update({ is_read: true })
      .eq('member_id', member.id)
      .eq('is_read', false)

    if (ids) {
      query = query.in('id', ids)
    } else if (link) {
      query = query.eq('link', link)
    }

    await query

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[notifications/read POST]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
