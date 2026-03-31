import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (caller?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  const role = body?.role

  if (role !== 'curator' && role !== 'member') {
    return NextResponse.json({ error: 'Допустимые роли: curator, member' }, { status: 400 })
  }

  const admin = createServiceClient()

  const { data: target } = await admin.from('members').select('role').eq('id', id).single()
  if (!target) return NextResponse.json({ error: 'Участница не найдена' }, { status: 404 })
  if (target.role === 'admin') return NextResponse.json({ error: 'Нельзя изменить роль администратора' }, { status: 403 })

  const dbRole = role === 'member' ? 'user' : 'curator'

  const { data, error } = await admin
    .from('members')
    .update({ role: dbRole })
    .eq('id', id)
    .select('id, role')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ member: data })
}
