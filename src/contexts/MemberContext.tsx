'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Member = {
  id: string
  name: string
  email: string
  role: string
  status: string
  trial_ends_at: string | null
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
  const supabase = createClient()

  const fetchMember = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('members')
      .select('id,email,name,full_name,role,status,trial_ends_at,age,weight,height,goal_weight,health_conditions,allergies,kbju_calories,kbju_protein,kbju_fat,kbju_carbs,kitchen_requests_today')
      .eq('id', user.id)
      .single()
    if (data) setMember({
      ...data,
      name: data.full_name || data.name || 'Участница',
      role: data.role ?? 'user',
      health_conditions: data.health_conditions || [],
      kitchen_requests_today: data.kitchen_requests_today ?? 0,
    })
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    // fetchMember is async — setState is called inside the resolved promise, not synchronously
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
