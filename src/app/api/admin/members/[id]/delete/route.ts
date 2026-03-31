import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { id } = await params
  const admin = createServiceClient()

  // Получаем email и auth_id перед удалением
  const { data: member } = await admin
    .from('members')
    .select('id, email')
    .eq('id', id)
    .single()

  if (!member) return NextResponse.json({ error: 'Участница не найдена' }, { status: 404 })

  // Каскадное удаление связанных данных
  const tables = [
    'wins',
    'payment_logs',
    'diary_entries',
    'measurements',
    'saved_recipes',
    'lesson_progress',
  ]
  for (const table of tables) {
    await admin.from(table).delete().eq('member_id', id)
  }

  // Таблицы с другим именем FK
  await admin.from('channel_posts').delete().eq('author_id', id)

  // Удаляем запись из members
  const { error: deleteError } = await admin.from('members').delete().eq('id', id)
  if (deleteError) {
    return NextResponse.json({ error: 'Ошибка удаления: ' + deleteError.message }, { status: 500 })
  }

  // Удаляем из Supabase Auth по email
  const { data: authUsers } = await admin.auth.admin.listUsers()
  const authUser = authUsers?.users?.find(u => u.email === member.email)
  if (authUser) {
    await admin.auth.admin.deleteUser(authUser.id)
  }

  return NextResponse.json({ ok: true })
}
