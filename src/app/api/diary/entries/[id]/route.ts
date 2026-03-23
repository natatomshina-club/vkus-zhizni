import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/diary/entries/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // Delete only own entries (member_id check prevents deleting others' data)
    const { error } = await supabase
      .from('diary_entries')
      .delete()
      .eq('id', id)
      .eq('member_id', user.id)

    if (error) {
      console.error('diary entries DELETE error:', error)
      return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('diary entries DELETE exception:', err)
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 })
  }
}
