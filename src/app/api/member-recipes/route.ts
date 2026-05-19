import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function getMemberId(email: string): Promise<string | null> {
  const admin = createServiceClient()
  const { data } = await admin.from('members').select('id').eq('email', email).single()
  return data?.id ?? null
}

// GET /api/member-recipes
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const memberId = await getMemberId(user.email!)
    if (!memberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const admin = createServiceClient()
    const { data, error } = await admin
      .from('member_recipes')
      .select('id, name, ingredients, total_calories, total_protein, total_fat, total_carbs, servings_count, created_at')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ recipes: data ?? [] })
  } catch (err) {
    console.error('member-recipes GET error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}

// POST /api/member-recipes
// Body: { name, ingredients, total_calories, total_protein, total_fat, total_carbs }
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const memberId = await getMemberId(user.email!)
    if (!memberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const body = await request.json() as {
      name: string
      ingredients: unknown[]
      total_calories?: number
      total_protein?: number
      total_fat?: number
      total_carbs?: number
      servings_count?: number
    }
    const { name, ingredients, total_calories, total_protein, total_fat, total_carbs, servings_count } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Название рецепта обязательно' }, { status: 400 })
    }
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: 'Рецепт должен содержать хотя бы один продукт' }, { status: 400 })
    }
    if (servings_count === undefined || !Number.isInteger(servings_count) || servings_count < 1) {
      return NextResponse.json({ error: 'Укажите количество порций (не менее 1)' }, { status: 400 })
    }

    const admin = createServiceClient()
    const { data, error } = await admin
      .from('member_recipes')
      .insert({
        member_id:      memberId,
        name:           name.trim(),
        ingredients,
        total_calories: total_calories ?? 0,
        total_protein:  total_protein  ?? 0,
        total_fat:      total_fat      ?? 0,
        total_carbs:    total_carbs    ?? 0,
        servings_count,
      })
      .select('id, name, ingredients, total_calories, total_protein, total_fat, total_carbs, servings_count, created_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ recipe: data })
  } catch (err) {
    console.error('member-recipes POST error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
