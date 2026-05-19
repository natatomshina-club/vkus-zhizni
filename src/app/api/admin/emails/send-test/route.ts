import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/mailer'

export const dynamic = 'force-dynamic'

const FROM = 'Вкус Жизни <noreply@nata-tomshina.ru>'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createServiceClient()
    const { data: member } = await admin.from('members').select('role').eq('email', user.email).single()
    if (member?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { emails, subject, html } = await req.json() as {
      emails: string[]
      subject: string
      html: string
    }

    if (!emails?.length || !subject?.trim() || !html?.trim()) {
      return NextResponse.json({ error: 'emails, subject, and html required' }, { status: 400 })
    }

    const list = emails.map(e => e.trim()).filter(e => e.includes('@'))
    if (list.length === 0) {
      return NextResponse.json({ error: 'Нет валидных email адресов' }, { status: 400 })
    }

    let sent = 0
    let failed = 0
    const errors: string[] = []

    await Promise.all(list.map(async (email) => {
      const ok = await sendEmail({ from: FROM, to: email, subject, html })
      if (ok) sent++
      else {
        failed++
        errors.push(email)
      }
    }))

    return NextResponse.json({ sent, failed, errors })
  } catch (e) {
    console.error('[send-test]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
