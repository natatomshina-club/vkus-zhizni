'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

type Member = {
  id: string
  name: string
  email: string
  role: string
  status: string
  subscription_status: string
  trial_ends_at: string | null
  created_at: string | null
  age: number | null
  weight: number | null
  height: number | null
  goal_weight: number | null
  health_conditions: string[]
  allergies: string | null
  kbju_calories: number | null
  kbju_protein: number | null
  kbju_fat: number | null
  kbju_carbs: number | null
  kitchen_requests_today: number
}

type MemberContextType = {
  member: Member | null
  loading: boolean
  refreshMember: () => Promise<void>
}

const MemberContext = createContext<MemberContextType>({
  member: null, loading: true, refreshMember: async () => {}
})

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMember = useCallback(async () => {
    try {
      const res = await fetch('/api/member/me')
      if (!res.ok) { setLoading(false); return }
      const json = await res.json() as { member: Member & { full_name?: string } }
      const data = json.member
      if (data) setMember({
        ...data,
        name: data.full_name || data.name || 'Участница',
        role: data.role ?? 'user',
        health_conditions: data.health_conditions || [],
        kitchen_requests_today: data.kitchen_requests_today ?? 0,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMember()
  }, [fetchMember])

  return (
    <MemberContext.Provider value={{ member, loading, refreshMember: fetchMember }}>
      {children}
    </MemberContext.Provider>
  )
}

export const useMember = () => useContext(MemberContext)
