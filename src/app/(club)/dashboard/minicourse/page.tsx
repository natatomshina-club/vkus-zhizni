import { redirect } from 'next/navigation'

export default function MinicourseLegacyRedirect() {
  redirect('/dashboard/courses')
}
