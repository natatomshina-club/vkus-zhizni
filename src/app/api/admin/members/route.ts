import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized', status: 401 as const }
  const { data: member } = await supabase.from('members').select('role').eq('id', user.id).single()
  if (member?.role !== 'admin') return { user: null, error: 'Forbidden', status: 403 as const }
  return { user, error: null, status: 200 as const }
}

export async function GET(req: Request) {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() ?? ''
  const statusFilter = searchParams.get('status') ?? 'all'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const offset = (page - 1) * limit

  const admin = createServiceClient()

  let query = admin
    .from('members')
    .select(
      'id, email, full_name, avatar_url, role, subscription_status, tariff, subscription_ends_at, is_blocked, blocked_at, blocked_reason, created_at, birth_date, admin_note, is_manual_subscription',
      { count: 'exact' }
    )

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  if (statusFilter !== 'all') {
    query = query.eq('subscription_status', statusFilter)
  }

  const { data, count, error: dbErr } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  return NextResponse.json({ members: data ?? [], total: count ?? 0, page })
}

export async function POST(req: Request) {
  try {
  const { user, error, status } = await requireAdmin()
  if (!user) return NextResponse.json({ error }, { status })

  const body = await req.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const full_name = typeof body?.full_name === 'string' ? body.full_name.trim() : ''
  const tariff = body?.tariff === 'halfyear' ? 'halfyear' : 'monthly'
  const admin_note = typeof body?.admin_note === 'string' ? body.admin_note.trim() : null

  if (!email || !full_name) {
    return NextResponse.json({ error: 'email и имя обязательны' }, { status: 400 })
  }

  const admin = createServiceClient()

  // Check duplicate: query members table (fast, no pagination issues)
  const { data: existingMember } = await admin
    .from('members')
    .select('id, email')
    .eq('email', email)
    .maybeSingle()
  if (existingMember) {
    return NextResponse.json({ error: 'Участница с таким email уже есть. Найди её в списке по поиску.' }, { status: 409 })
  }

  // Calculate subscription end date
  const days = tariff === 'halfyear' ? 180 : 30
  const endsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

  // Create auth user
  const { data: newUser, error: authErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  })
  if (authErr || !newUser?.user) {
    const msg = authErr?.message ?? 'Не удалось создать пользователя'
    console.error('[add-member] createUser failed:', msg)
    // Supabase returns this when email already exists in auth.users but not in members
    const isAlreadyExists = msg.toLowerCase().includes('already') || msg.toLowerCase().includes('exists')
    if (isAlreadyExists) {
      return NextResponse.json({ error: 'Email уже зарегистрирован в системе, но участницы нет в базе. Зайди в Supabase → Authentication → Users и удали пользователя с этим email, потом попробуй снова.' }, { status: 409 })
    }
    return NextResponse.json({ error: `Ошибка создания аккаунта: ${msg}` }, { status: 500 })
  }

  const uid = newUser.user.id

  // Upsert members record (safe even if DB trigger already created a partial row)
  const { error: memberErr } = await admin.from('members').upsert({
    id: uid,
    email,
    full_name,
    name: full_name.split(' ')[0],
    subscription_status: 'active',
    status: 'active',
    tariff,
    subscription_ends_at: endsAt,
    admin_note: admin_note || null,
    is_manual_subscription: true,
  }, { onConflict: 'id' })

  if (memberErr) {
    console.error('[add-member] members upsert failed:', memberErr)
    // Rollback auth user — log but don't throw if rollback itself fails
    const { error: rollbackErr } = await admin.auth.admin.deleteUser(uid)
    if (rollbackErr) console.error('[add-member] rollback deleteUser failed:', rollbackErr)
    return NextResponse.json({
      error: `Участница создана в auth, но запись не сохранилась: ${memberErr.message}. Возможно не запущены SQL-миграции (admin_note, is_manual_subscription).`,
    }, { status: 500 })
  }

  // Generate magic link
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vkuszhizni.ru'
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${siteUrl}/auth/callback?next=/dashboard` },
  })

  if (linkErr || !linkData?.properties?.action_link) {
    console.error('[add-member] generateLink failed:', linkErr)
    // User created successfully — return partial success
    return NextResponse.json({
      member: { id: uid, email, full_name },
      warning: `Участница добавлена, но ссылка-приглашение не отправлена: ${linkErr?.message ?? 'нет action_link'}`,
    }, { status: 201 })
  }

  const magicLink = linkData.properties.action_link
  const firstName = full_name.split(' ')[0]

  // Send invite email via Resend
  const resend = new Resend()
  const emailResult = await resend.emails.send({
    from: 'Наталья Томшина <hello@vkuszhizni.ru>',
    to: email,
    subject: 'Наталья Томшина приглашает тебя в Клуб «Вкус Жизни»',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2D1F6E;">
        <div style="background: linear-gradient(135deg, #7C5CFC 0%, #9B7CFF 100%); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
          <p style="color: #fff; font-size: 22px; font-weight: 700; margin: 0;">Вкус Жизни</p>
          <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 4px 0 0;">Клуб стройных и здоровых</p>
        </div>
        <div style="background: #fff; padding: 32px 24px; border-radius: 0 0 16px 16px; border: 1px solid #EDE8FF; border-top: none;">
          <p style="font-size: 16px; margin: 0 0 16px;">Привет, ${firstName}! 🌿</p>
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px; color: #3D2B8A;">
            Наталья открыла тебе доступ в закрытый <strong>Клуб стройных и здоровых «Вкус Жизни»</strong>.
          </p>
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 28px; color: #2D1F6E;">
            Нажми кнопку ниже чтобы войти — ссылка действует 24 часа.
          </p>
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #7C5CFC 0%, #9B7CFF 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 700;">
              Войти в клуб →
            </a>
          </div>
          <p style="font-size: 13px; color: #9B8FCC; text-align: center;">
            Если кнопка не работает, скопируй ссылку:<br>
            <a href="${magicLink}" style="color: #7C5CFC; word-break: break-all;">${magicLink}</a>
          </p>
        </div>
        <p style="text-align: center; font-size: 12px; color: #9B8FCC; margin-top: 16px;">
          С заботой, Наталья Томшина 💚
        </p>
      </div>
    `,
  }).catch(e => { console.error('[add-member] email send failed:', e); return null })

  if (!emailResult) {
    return NextResponse.json({
      member: { id: uid, email, full_name },
      warning: 'Участница добавлена, но письмо не отправлено — проверь RESEND_API_KEY в переменных окружения.',
    }, { status: 201 })
  }

  return NextResponse.json({ member: { id: uid, email, full_name } }, { status: 201 })
  } catch (e) {
    console.error('[add-member] unhandled exception:', e)
    return NextResponse.json({ error: `Внутренняя ошибка: ${String(e)}` }, { status: 500 })
  }
}
