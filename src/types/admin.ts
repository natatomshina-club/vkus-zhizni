export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'blocked'
export type Tariff = 'trial' | 'monthly' | 'halfyear'

export interface MemberRow {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
  subscription_status: SubscriptionStatus
  tariff: Tariff
  subscription_ends_at: string | null
  is_blocked: boolean
  blocked_at: string | null
  blocked_reason: string | null
  created_at: string
  birth_date: string | null
  admin_note: string | null
  is_manual_subscription: boolean
}

export interface AdminStats {
  total: number
  trial: number
  active: number
  cancelled: number
  blocked: number
  new_today: number
  new_week: number
}
