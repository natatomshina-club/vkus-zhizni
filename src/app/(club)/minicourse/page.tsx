import { redirect } from 'next/navigation'

export default function PublicMinicourseLegacyRedirect() {
  redirect('/dashboard/courses')
}
