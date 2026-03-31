import { createServiceClient } from '@/lib/supabase/server'
import { tokenToEmail } from '@/lib/email-utils'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''
  const email = tokenToEmail(token)

  if (!email || !email.includes('@')) {
    return NextResponse.redirect(new URL('/unsubscribed?error=1', req.url))
  }

  const admin = createServiceClient()
  await admin
    .from('subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('email', email)

  return NextResponse.redirect(new URL('/unsubscribed', req.url))
}
