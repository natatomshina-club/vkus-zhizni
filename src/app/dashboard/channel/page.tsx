import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChannelLayout from './ChannelLayout'
import type { Channel, MarathonRow } from '@/types/channel'

export default async function ChannelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: member } = await supabase
    .from('members')
    .select('role, status, name, full_name')
    .eq('id', user.id)
    .single()

  const isAdmin = member?.role === 'admin'
  const memberStatus = member?.status ?? 'trial'
  const memberName: string = member?.name ?? member?.full_name ?? 'Участница'
  const memberFullName: string | null = member?.full_name ?? null

  const { data: marathon } = await supabase
    .from('marathons')
    .select('id, title, status, starts_at, ends_at, next_date')
    .in('status', ['active', 'finished'])
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
      <ChannelLayout channels={channels} memberId={user.id} isAdmin={isAdmin} memberName={memberName} memberFullName={memberFullName} />
    </div>
  )
}
