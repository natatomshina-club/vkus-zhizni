import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const tagsParam = searchParams.get('tags')
  const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : []

  const admin = createServiceClient()
  let query = admin
    .from('cookbook_recipes')
    .select('id, title, category, photo_urls, video_url, ingredients, servings, calories, protein, fat, carbs, instructions, tags, sort_order')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (category) query = query.eq('category', category)
  if (tags.length > 0) query = query.overlaps('tags', tags)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ recipes: data ?? [] })
}
