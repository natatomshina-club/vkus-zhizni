export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'blocked'
export type Tariff = 'trial' | 'monthly' | 'halfyear'

export interface MemberRow {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin' | 'curator'
  subscription_status: SubscriptionStatus
  tariff: Tariff
  subscription_ends_at: string | null
  is_blocked: boolean
  blocked_at: string | null
  blocked_reason: string | null
  created_at: string
  subscription_started_at: string | null
  birth_date: string | null
  admin_note: string | null
  is_manual_subscription: boolean
  subscription_plan: string | null
}

export interface PaymentLog {
  id: string
  created_at: string
  amount: number | null
  plan: string | null
  event_type: string | null
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
