import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const admin = createServiceClient()
  const { data: member } = await admin.from('members').select('role').eq('email', user.email!).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function GET() {
  const { error, status } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  const admin = createServiceClient()
  const { data, error: dbErr } = await admin
    .from('cookbook_recipes')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ recipes: data ?? [] })
}

export async function POST(req: Request) {
  const { error, status } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })

  const body = await req.json() as {
    title: string
    category: string
    photo_urls?: string[]
    video_url?: string
    ingredients?: string
    servings?: number
    calories?: number
    protein?: number
    fat?: number
    carbs?: number
    instructions?: string
    tags?: string[]
    is_published?: boolean
    sort_order?: number
  }

  if (!body.title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })
  if (!body.category?.trim()) return NextResponse.json({ error: 'category required' }, { status: 400 })

  const admin = createServiceClient()
  const { data, error: dbErr } = await admin
    .from('cookbook_recipes')
    .insert({
      title: body.title.trim(),
      category: body.category,
      photo_urls: body.photo_urls ?? [],
      video_url: body.video_url || null,
      ingredients: body.ingredients || null,
      servings: body.servings ?? null,
      calories: body.calories ?? null,
      protein: body.protein ?? null,
      fat: body.fat ?? null,
      carbs: body.carbs ?? null,
      instructions: body.instructions || null,
      tags: body.tags ?? [],
      is_published: body.is_published ?? false,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ recipe: data }, { status: 201 })
}
