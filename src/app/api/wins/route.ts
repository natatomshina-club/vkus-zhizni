import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const limit = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') ?? '20')))
    const offset = Math.max(0, parseInt(request.nextUrl.searchParams.get('offset') ?? '0'))

    const { data, error } = await supabase
      .from('wins')
      .select('id, result, source, created_at')
      .eq('member_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[api/wins GET]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ wins: data ?? [], hasMore: (data?.length ?? 0) === limit })
  } catch (e) {
    console.error('[api/wins GET]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as { text?: string; source?: string }
    const text = body.text?.trim() ?? ''
    const source = body.source ?? 'wins'

    if (text.length < 3 || text.length > 500) {
      return NextResponse.json({ error: 'Текст должен быть от 3 до 500 символов' }, { status: 400 })
    }
    if (!['wins', 'dashboard'].includes(source)) {
      return NextResponse.json({ error: 'Неверный source' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('wins')
      .insert({
        member_id: user.id,
        result: text,
        source,
        week_date: new Date().toISOString().split('T')[0],
      })
      .select('id, result, source, created_at')
      .single()

    if (error) {
      console.error('[api/wins POST]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error('[api/wins POST]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
