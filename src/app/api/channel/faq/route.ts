import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FAQ_CATEGORIES } from '@/types/channel'
import type { FaqCategory } from '@/types/channel'

function isValidCategory(c: unknown): c is FaqCategory {
  return typeof c === 'string' && (FAQ_CATEGORIES as readonly string[]).includes(c)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const q        = searchParams.get('q')?.trim() ?? ''
    const category = searchParams.get('category') ?? ''
    const cursor   = searchParams.get('cursor') ?? ''
    const limit    = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)

    let query = supabase
      .from('faq_items')
      .select('id, question, answer, category, source_post_id, created_by, created_at')
      .order('created_at', { ascending: false })
      .limit(limit + 1)

    if (q) {
      query = query.or(`question.ilike.%${q}%,answer.ilike.%${q}%`)
    }
    if (category && isValidCategory(category)) {
      query = query.eq('category', category)
    }
    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data, error } = await query

    if (error) {
      console.error('[faq GET]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const items = data ?? []
    const hasMore = items.length > limit
    if (hasMore) items.pop()

    return NextResponse.json({ items, hasMore })
  } catch (e) {
    console.error('[faq GET]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Admin check — query DB, never trust client
    const { data: member } = await supabase
      .from('members').select('role').eq('id', user.id).single()
    if (member?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json() as {
      question?: unknown
      answer?: unknown
      category?: unknown
      source_post_id?: unknown
    }

    const question = typeof body.question === 'string' ? body.question.trim() : ''
    const answer   = typeof body.answer === 'string'   ? body.answer.trim()   : ''
    const category = body.category

    if (!question)            return NextResponse.json({ error: 'question required' }, { status: 400 })
    if (question.length > 500) return NextResponse.json({ error: 'question max 500 chars' }, { status: 400 })
    if (!answer)              return NextResponse.json({ error: 'answer required' }, { status: 400 })
    if (answer.length > 3000)  return NextResponse.json({ error: 'answer max 3000 chars' }, { status: 400 })
    if (!isValidCategory(category)) return NextResponse.json({ error: 'invalid category' }, { status: 400 })

    // Validate source_post_id if provided
    let source_post_id: string | null = null
    if (body.source_post_id !== undefined && body.source_post_id !== null) {
      if (typeof body.source_post_id !== 'string') {
        return NextResponse.json({ error: 'source_post_id must be a string' }, { status: 400 })
      }
      const { data: post } = await supabase
        .from('channel_posts').select('id').eq('id', body.source_post_id).maybeSingle()
      if (!post) return NextResponse.json({ error: 'source_post_id not found' }, { status: 400 })
      source_post_id = body.source_post_id
    }

    const { data, error } = await supabase
      .from('faq_items')
      .insert({
        question,
        answer,
        category,
        source_post_id,
        created_by: user.id,  // never from body
        // No expires_at — FAQ is permanent
      })
      .select('id, question, answer, category, source_post_id, created_by, created_at')
      .single()

    if (error) {
      console.error('[faq POST]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    console.error('[faq POST]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
