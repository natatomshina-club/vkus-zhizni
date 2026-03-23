// ── Channel definitions ────────────────────────────────────────────────────────

export type ChannelSlug = 'boltalka' | 'plates' | 'faq' | 'direct' | `marathon-${string}`
export type ChannelType = 'feed' | 'faq' | 'direct'

export interface Channel {
  slug: ChannelSlug
  label: string
  icon: string
  type: ChannelType
  description: string
  group?: 'personal' | 'marathon'
  mediaExpiresHours?: number  // plates: 72h
  locked?: boolean            // marathon: trial members see locked state
}

// ── DB table types ─────────────────────────────────────────────────────────────

export interface ChannelPost {
  id: string
  member_id: string
  channel: string
  text: string | null
  media_url: string | null
  media_expires_at: string | null
  meal_tag: 'breakfast' | 'lunch' | 'snack' | null
  is_ai_reply: boolean
  is_pinned: boolean
  parent_id: string | null
  likes_count: number
  expires_at: string | null
  created_at: string
}

/** Post with computed fields returned by API */
export interface PostWithMeta extends ChannelPost {
  liked_by_me: boolean
  comments_count: number
  member: { name: string | null; full_name: string | null } | null
}

export interface ChannelLike {
  id: string
  post_id: string
  member_id: string
  created_at: string
}

// ── FAQ ────────────────────────────────────────────────────────────────────────

export const FAQ_CATEGORIES = [
  'питание', 'продукты', 'тяга', 'замеры', 'гормоны',
  'здоровье', 'пищеварение', 'образ_жизни', 'психология', 'техническое',
] as const

export type FaqCategory = typeof FAQ_CATEGORIES[number]

export const FAQ_CATEGORY_LABELS: Record<FaqCategory, string> = {
  питание:     'Питание',
  продукты:    'Продукты',
  тяга:        'Тяга к сладкому',
  замеры:      'Замеры и вес',
  гормоны:     'Гормоны',
  здоровье:    'Здоровье',
  пищеварение: 'Пищеварение',
  образ_жизни: 'Образ жизни',
  психология:  'Психология',
  техническое: 'Техническое',
}

export const FAQ_CATEGORY_COLORS: Record<FaqCategory, { bg: string; text: string }> = {
  питание:     { bg: '#F0EEFF', text: '#7C5CFC' },
  продукты:    { bg: '#E8F5E9', text: '#2D6A4F' },
  тяга:        { bg: '#FFF3E0', text: '#E65100' },
  замеры:      { bg: '#E3F2FD', text: '#1565C0' },
  гормоны:     { bg: '#FCE4EC', text: '#880E4F' },
  здоровье:    { bg: '#E8F5E9', text: '#1B5E20' },
  пищеварение: { bg: '#FFF8E1', text: '#F57F17' },
  образ_жизни: { bg: '#E0F7FA', text: '#006064' },
  психология:  { bg: '#EDE7F6', text: '#4527A0' },
  техническое: { bg: '#ECEFF1', text: '#37474F' },
}

export interface FaqItem {
  id: string
  question: string
  answer: string
  category: FaqCategory
  source_post_id: string | null
  created_by: string
  created_at: string
}

export interface PrivateMessage {
  id: string
  member_id: string
  text: string
  from_admin: boolean
  is_read: boolean
  created_at: string
}

export interface ChannelNotification {
  id: string
  member_id: string
  post_id: string | null
  type: 'mention' | 'reply' | 'like' | 'direct_reply'
  is_read: boolean
  created_at: string
}

// ── Admin types ────────────────────────────────────────────────────────────────

export interface AdminDirectThread {
  member_id: string
  member_name: string
  last_message: string
  last_message_at: string
  unread_count: number
}

export interface AdminChannelView {
  directThreads?: AdminDirectThread[]
  marathonControl?: {
    activeMarathonId: string | null
    canCreate: boolean
    canArchive: boolean
  }
  faqControl?: {
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
  }
}

// ── Marathon ───────────────────────────────────────────────────────────────────

export interface MarathonRow {
  id: string
  title: string
  status: 'active' | 'finished' | 'archived' | 'draft'
  starts_at: string
  ends_at: string | null
  next_date: string | null
}
