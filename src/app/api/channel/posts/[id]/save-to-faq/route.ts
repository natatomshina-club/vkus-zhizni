import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Admin only
    const { data: member } = await supabase
      .from('members').select('role').eq('id', user.id).single()
    if (member?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json() as { question?: string; answer?: string; category?: string }
    const question = body.question?.trim() ?? ''
    const answer   = body.answer?.trim()   ?? ''
    const category = body.category?.trim() ?? ''

    if (!question || !answer || !category) {
      return NextResponse.json({ error: 'question, answer, category required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('faq_items')
      .insert({
        question,
        answer,
        category,
        source_post_id: params.id,
        created_by: user.id,
      })
      .select('id, question, answer, category, source_post_id, created_by, created_at')
      .single()

    if (error) {
      console.error('[save-to-faq POST]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Post is NOT deleted — it lives its 30 days as usual
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error('[save-to-faq POST]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
