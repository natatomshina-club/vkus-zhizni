import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FAQ_CATEGORIES } from '@/types/channel'
import type { FaqCategory } from '@/types/channel'

function isValidCategory(c: unknown): c is FaqCategory {
  return typeof c === 'string' && (FAQ_CATEGORIES as readonly string[]).includes(c)
}

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('members').select('role').eq('id', userId).single()
  return data?.role === 'admin'
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!await requireAdmin(supabase, user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: paramId } = await params

    const body = await request.json() as {
      question?: unknown
      answer?: unknown
      category?: unknown
      source_post_id?: unknown
    }

    const patch: Record<string, unknown> = {}

    if (body.question !== undefined) {
      if (typeof body.question !== 'string') return NextResponse.json({ error: 'question must be string' }, { status: 400 })
      const q = body.question.trim()
      if (!q)           return NextResponse.json({ error: 'question cannot be empty' }, { status: 400 })
      if (q.length > 500) return NextResponse.json({ error: 'question max 500 chars' }, { status: 400 })
      patch.question = q
    }

    if (body.answer !== undefined) {
      if (typeof body.answer !== 'string') return NextResponse.json({ error: 'answer must be string' }, { status: 400 })
      const a = body.answer.trim()
      if (!a)             return NextResponse.json({ error: 'answer cannot be empty' }, { status: 400 })
      if (a.length > 3000) return NextResponse.json({ error: 'answer max 3000 chars' }, { status: 400 })
      patch.answer = a
    }

    if (body.category !== undefined) {
      if (!isValidCategory(body.category)) return NextResponse.json({ error: 'invalid category' }, { status: 400 })
      patch.category = body.category
    }

    if (body.source_post_id !== undefined) {
      if (body.source_post_id !== null) {
        if (typeof body.source_post_id !== 'string') {
          return NextResponse.json({ error: 'source_post_id must be string or null' }, { status: 400 })
        }
        const { data: post } = await supabase
          .from('channel_posts').select('id').eq('id', body.source_post_id).maybeSingle()
        if (!post) return NextResponse.json({ error: 'source_post_id not found' }, { status: 400 })
      }
      patch.source_post_id = body.source_post_id
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'no fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('faq_items')
      .update(patch)
      .eq('id', paramId)
      .select('id, question, answer, category, source_post_id, created_by, created_at')
      .single()

    if (error) {
      console.error('[faq PATCH]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (e) {
    console.error('[faq PATCH]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!await requireAdmin(supabase, user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const { error } = await supabase
      .from('faq_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[faq DELETE]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[faq DELETE]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
