import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ count: 0 })

    const { count, error } = await supabase
      .from('wins')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', user.id)

    if (error) {
      console.error('[api/wins/count GET]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ count: count ?? 0 })
  } catch (e) {
    console.error('[api/wins/count GET]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
