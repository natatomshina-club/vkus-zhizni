import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const plan = typeof body?.plan === 'string' ? body.plan : ''

    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

    const audienceId = process.env.RESEND_AUDIENCE_ID
    if (audienceId) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (resend.contacts.create as any)({
        audienceId,
        email,
        unsubscribed: false,
      }).catch(() => null)
    }

    console.log('join/track-email:', { email, plan })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('track-email error:', err)
    return NextResponse.json({ ok: true }) // always ok — non-critical
  }
}
