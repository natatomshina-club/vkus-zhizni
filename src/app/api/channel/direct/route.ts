import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { PrivateMessage } from '@/types/channel'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const { data, error } = await supabase
      .from('private_messages')
      .select('*')
      .eq('member_id', user.id)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Mark unread admin messages as read — некритично если упадёт
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createServiceClient()
        await supabaseAdmin
          .from('private_messages')
          .update({ is_read: true })
          .eq('member_id', user.id)
          .eq('from_admin', true)
          .eq('is_read', false)
      }
    } catch (e) {
      console.warn('Could not mark messages as read:', e)
    }

    return NextResponse.json({ messages: data as PrivateMessage[] })
  } catch (e) {
    console.error('direct GET - exception:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const text = typeof body?.text === 'string' ? body.text.trim() : ''

  if (!text) return NextResponse.json({ error: 'text обязателен' }, { status: 400 })
  if (text.length > 2000) return NextResponse.json({ error: 'max 2000 символов' }, { status: 400 })

  const { data, error } = await supabase
    .from('private_messages')
    .insert({
      member_id: user.id,
      text,
      from_admin: false,
      is_read: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ message: data as PrivateMessage }, { status: 201 })
}
