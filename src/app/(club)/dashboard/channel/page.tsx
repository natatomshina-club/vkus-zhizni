import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChannelLayout from './ChannelLayout'
import type { Channel, MarathonRow } from '@/types/channel'

export default async function ChannelPage({
  searchParams,
}: {
  searchParams: Promise<{ ch?: string; slug?: string; post?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { ch, slug, post } = await searchParams
  const initialChannel = ch ?? slug
  const initialPost = post

  const { data: member } = await supabase
    .from('members')
    .select('role, subscription_status, name, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  const isAdmin = member?.role === 'admin'
  const isCurator = member?.role === 'curator'
  const memberStatus = member?.subscription_status ?? 'trial'
  const memberName: string = member?.name ?? member?.full_name ?? 'Участница'
  const memberFullName: string | null = member?.full_name ?? null
  const memberAvatarUrl: string | null = member?.avatar_url ?? null

  const { data: marathon } = await supabase
    .from('marathons')
    .select('id, title, status, starts_at, ends_at, next_date')
    .in('status', ['active'])
    .order('starts_at', { ascending: false })
    .limit(1)
    .maybeSingle() as { data: MarathonRow | null }

  const channels: Channel[] = [
    {
      slug: 'boltalka',
      label: 'Болталка',
      icon: '💬',
      type: 'feed',
      description: 'Свободное общение участниц клуба',
    },
    {
      slug: 'plates',
      label: 'Тарелочки',
      icon: '🍽️',
      type: 'feed',
      description: 'Фото еды — медиа хранятся 72 часа',
      mediaExpiresHours: 72,
    },
    {
      slug: 'faq',
      label: 'FAQ',
      icon: '📚',
      type: 'faq',
      description: 'Вопросы и ответы от Натальи',
    },
    {
      slug: 'direct',
      label: 'Наташе',
      icon: '✉️',
      type: 'direct',
      description: 'Приватный диалог с Натальей',
      group: 'personal',
    },
    ...(marathon
      ? [{
          slug: `marathon-${marathon.id}` as const,
          label: marathon.title ?? 'Марафон',
          icon: '🔥',
          type: 'feed' as const,
          description: marathon.status === 'finished'
            ? `Завершён — следующий ${marathon.next_date ?? 'скоро'}`
            : 'Канал текущего марафона',
          group: 'marathon' as const,
          locked: memberStatus === 'trial',
        }]
      : []),
  ]

  return (
    <div className="h-full overflow-hidden">
      <ChannelLayout channels={channels} memberId={user.id} isAdmin={isAdmin} isCurator={isCurator} memberName={memberName} memberFullName={memberFullName} memberAvatarUrl={memberAvatarUrl} initialChannel={initialChannel} initialPost={initialPost} />
    </div>
  )
}
