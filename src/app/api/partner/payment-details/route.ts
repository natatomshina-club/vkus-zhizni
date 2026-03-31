import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getPartnerFromCookies } from '@/lib/partner-auth'

export async function PUT(req: NextRequest) {
  const partner = await getPartnerFromCookies()
  if (!partner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { payment_details } = await req.json() as { payment_details?: string }
  if (typeof payment_details !== 'string') {
    return NextResponse.json({ error: 'payment_details required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('affiliates')
    .update({ payment_details: payment_details.trim() })
    .eq('id', partner.affiliate_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
