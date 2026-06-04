import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminCookbookClient from './AdminCookbookClient'

export default async function AdminCookbookPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')
  return <AdminCookbookClient />
}
