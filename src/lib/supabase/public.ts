import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://byykvsjamtcklwtnjkpf.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_2V678YWUVeSiT0g1mUOHKg_zfOUFSVj'

/** Anon client for public site — no cookies, no auth. */
export function createSupabasePublic() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
