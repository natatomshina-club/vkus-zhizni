import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export type AdminAuthResult =
  | { ok: true; user: { id: string; email: string }; role: 'admin' | 'curator' }
  | { ok: false; response: NextResponse }

/**
 * Проверяет что текущий пользователь — админ или куратор.
 * Lookup идёт по email (правило 24 из CLAUDE.md).
 *
 * Использование в API-роуте:
 *   const auth = await requireAdmin()
 *   if (!auth.ok) return auth.response
 *   // дальше используем auth.user, auth.role
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user || !user.email) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('role')
    .eq('email', user.email)
    .maybeSingle()

  if (memberError || !member || (member.role !== 'admin' && member.role !== 'curator')) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email },
    role: member.role as 'admin' | 'curator',
  }
}
