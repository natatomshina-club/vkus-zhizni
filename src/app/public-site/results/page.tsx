import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ResultsClient from './ResultsClient'
import type { StoryCard } from './ResultsClient'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://byykvsjamtcklwtnjkpf.supabase.co'

function createPageClient() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Истории преображения — реальные результаты участниц | Вкус Жизни',
  description: 'Реальные истории женщин, которые вернули себе вкус жизни через метаболическое питание. Никакого фотошопа — только настоящие изменения.',
  alternates: {
    canonical: 'https://nata-tomshina.ru/results',
  },
  openGraph: {
    title: 'Истории преображения — реальные результаты участниц',
    description: 'Реальные истории женщин, которые вернули себе вкус жизни.',
    url: 'https://nata-tomshina.ru/results',
    type: 'website',
  },
}

export default async function ResultsPage() {
  const supabase = createPageClient()
  const { data } = await supabase
    .from('results_stories')
    .select('id, slug, name, metric_main, metric_label, tag_label, tag_filter, summary_quote, check_items, photo_before_url, photo_after_url')
    .eq('published', true)
    .order('order_index', { ascending: true })

  return <ResultsClient stories={(data ?? []) as StoryCard[]} />
}
