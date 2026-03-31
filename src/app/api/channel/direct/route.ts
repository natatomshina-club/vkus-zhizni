import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { PrivateMessage } from '@/types/channel'

async function getMemberId(userEmail: string): Promise<string | null> {
  const admin = createServiceClient()
  const { data } = await admin.from('members').select('id').eq('email', userEmail).single()
  return data?.id ?? null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const memberId = await getMemberId(user.email!)
    if (!memberId) return NextResponse.json({ messages: [] })

    const { data, error } = await createServiceClient()
      .from('private_messages')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Mark unread admin messages as read
    try {
      await createServiceClient()
        .from('private_messages')
        .update({ is_read: true })
        .eq('member_id', memberId)
        .eq('from_admin', true)
        .eq('is_read', false)
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

  const memberId = await getMemberId(user.email!)
  if (!memberId) return NextResponse.json({ error: 'Участница не найдена' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  const media_url: string | null = typeof body?.media_url === 'string' ? body.media_url.trim() || null : null

  if (media_url) {
    try {
      const parsedMedia = new URL(media_url)
      const parsedSupabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://invalid')
      if (parsedMedia.hostname !== parsedSupabase.hostname) {
        return NextResponse.json({ error: 'Invalid media domain' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid media domain' }, { status: 400 })
    }
  }

  if (!text && !media_url) return NextResponse.json({ error: 'text или фото обязательны' }, { status: 400 })
  if (text.length > 2000) return NextResponse.json({ error: 'max 2000 символов' }, { status: 400 })

  const { data, error } = await createServiceClient()
    .from('private_messages')
    .insert({
      member_id: memberId,
      text: text || '',
      media_url,
      from_admin: false,
      is_read: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ message: data as PrivateMessage }, { status: 201 })
}
