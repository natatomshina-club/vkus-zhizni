import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin only
  const { data: member } = await supabase
    .from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const admin = createServiceClient()

  // Get marathon
  const { data: marathon, error: mErr } = await admin
    .from('marathons').select('id, title, status, ends_at, next_date').eq('id', id).single()
  if (mErr || !marathon) {
    return NextResponse.json({ error: 'Marathon not found' }, { status: 404 })
  }
  if (marathon.status === 'finished') {
    return NextResponse.json({ error: 'Already finished' }, { status: 400 })
  }

  // Mark finished
  const { error: finishErr } = await admin
    .from('marathons').update({ status: 'finished' }).eq('id', id)
  if (finishErr) return NextResponse.json({ error: finishErr.message }, { status: 500 })

  const channelSlug = `marathon-${id}`

  // Create pinned stub post
  const nextLabel = marathon.next_date ?? 'скоро'
  const { error: pinErr } = await admin
    .from('channel_posts')
    .insert({
      member_id: user.id,
      channel: channelSlug,
      text: `🏁 Марафон завершён! Следующий марафон — ${nextLabel}`,
      is_pinned: true,
      is_ai_reply: false,
      expires_at: null,        // pinned stub lives forever
      media_url: null,
      media_expires_at: null,
      meal_tag: null,
      parent_id: null,
    })
  if (pinErr) return NextResponse.json({ error: pinErr.message }, { status: 500 })

  // Set expires_at on all regular posts (ends_at + 5 days)
  if (marathon.ends_at) {
    const exp = new Date(marathon.ends_at)
    exp.setDate(exp.getDate() + 5)
    await admin
      .from('channel_posts')
      .update({ expires_at: exp.toISOString() })
      .eq('channel', channelSlug)
      .eq('is_pinned', false)
      .is('expires_at', null)
  }

  return NextResponse.json({ success: true })
}
