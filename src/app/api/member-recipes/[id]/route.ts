import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// DELETE /api/member-recipes/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()
    const { data: member } = await admin.from('members').select('id').eq('email', user.email!).single()
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const { error } = await admin
      .from('member_recipes')
      .delete()
      .eq('id', id)
      .eq('member_id', member.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('member-recipes DELETE error:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
