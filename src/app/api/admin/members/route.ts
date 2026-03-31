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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://club.nata-tomshina.ru'
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${siteUrl}/auth/callback?next=/dashboard&openInBrowser=1` },
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

  // Send invite email via Resend SDK
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { data: emailData, error: emailErr } = await resend.emails.send({
    from: 'Вкус Жизни <noreply@nata-tomshina.ru>',
    to: email,
    subject: 'Добро пожаловать в Клуб «Вкус Жизни» — ссылка для входа',
    html: `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF8FF;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8FF;padding:24px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

  <!-- Header -->
  <tr><td style="background:#3D2B8A;border-radius:16px 16px 0 0;padding:24px;text-align:center;">
    <p style="margin:0;font-size:20px;font-weight:700;color:#fff;letter-spacing:-0.3px;">🌿 Клуб Вкус Жизни</p>
    <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">Клуб стройных и здоровых</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#fff;border:1px solid #EDE8FF;border-top:none;padding:32px 28px;">

    <p style="margin:0 0 18px;font-size:16px;font-weight:700;color:#3D2B8A;">Привет, ${firstName}! 🌿</p>

    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#3D2B8A;">
      Наталья открыла тебе доступ в закрытый <strong>Клуб стройных и здоровых «Вкус Жизни»</strong>.
    </p>

    <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#3D2B8A;">
      Нажми кнопку ниже чтобы войти и начать свой путь к здоровью и стройности.
    </p>

    <!-- Button -->
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:24px;">
      <a href="${magicLink}"
        style="display:inline-block;background:#4CAF78;color:#fff;text-decoration:none;
               padding:15px 36px;border-radius:12px;font-size:16px;font-weight:700;
               letter-spacing:0.2px;">
        Войти в клуб →
      </a>
    </td></tr></table>

    <!-- Security note -->
    <p style="margin:0 0 28px;font-size:13px;line-height:1.6;color:#7B6FAA;
              background:#F8F5FF;border-radius:10px;padding:12px 16px;">
      🔒 Ссылка для входа действительна в течение <strong>24 часов</strong>.<br>
      Если вы не запрашивали вход — просто проигнорируйте это письмо.
    </p>

    <!-- Fallback link -->
    <p style="margin:0 0 32px;font-size:12px;color:#9B8FCC;text-align:center;line-height:1.6;">
      Если кнопка не работает, скопируйте ссылку в браузер:<br>
      <a href="${magicLink}" style="color:#7C5CFC;word-break:break-all;font-size:11px;">${magicLink}</a>
    </p>

    <!-- Signature -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="border-top:1px solid #EDE8FF;padding-top:24px;">
        <p style="margin:0;font-size:14px;line-height:1.8;color:#3D2B8A;">
          С заботой о вас,<br>
          <strong>Наталья Томшина</strong><br>
          Клуб стройных и здоровых «Вкус Жизни»<br>
          <a href="https://club.nata-tomshina.ru" style="color:#4CAF78;text-decoration:none;">club.nata-tomshina.ru</a>
        </p>
      </td></tr>
    </table>

  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#F0EEFF;border-radius:0 0 16px 16px;padding:20px 28px;border:1px solid #EDE8FF;border-top:none;">
    <p style="margin:0 0 8px;font-size:12px;color:#7B6FAA;line-height:1.6;text-align:center;">
      На это письмо отвечать не нужно.<br>
      По вопросам доступа пишите:
      <a href="mailto:nata.tomshina@gmail.com" style="color:#3D2B8A;font-weight:700;">nata.tomshina@gmail.com</a>
    </p>
    <p style="margin:0 0 8px;font-size:11px;color:#9B8FCC;line-height:1.6;text-align:center;">
      Вы получили это письмо, так как зарегистрированы в Клубе стройных и здоровых «Вкус Жизни».
    </p>
    <p style="margin:0;font-size:11px;text-align:center;">
      <a href="https://club.nata-tomshina.ru/legal/privacy" style="color:#9B8FCC;text-decoration:underline;">Политика конфиденциальности</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`,
  })

  if (emailErr || !emailData?.id) {
    console.error('[add-member] resend error:', emailErr)
    return NextResponse.json({
      member: { id: uid, email, full_name },
      magic_link: magicLink,
      warning: `Участница добавлена, но письмо не отправлено: ${emailErr?.message ?? 'нет id в ответе Resend'}`,
    }, { status: 201 })
  }

  return NextResponse.json({ member: { id: uid, email, full_name } }, { status: 201 })
  } catch (e) {
    console.error('[add-member] unhandled exception:', e)
    return NextResponse.json({ error: `Внутренняя ошибка: ${String(e)}` }, { status: 500 })
  }
}
