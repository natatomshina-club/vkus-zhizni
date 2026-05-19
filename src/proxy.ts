import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Service-role клиент для DB запросов в middleware (обходит RLS)
function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://byykvsjamtcklwtnjkpf.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function handleRefCode(request: NextRequest): Promise<NextResponse | null> {
  const refCode = request.nextUrl.searchParams.get('ref')
  if (!refCode) return null

  const admin = createAdminClient()

  // Verify affiliate exists and is active
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id')
    .eq('ref_code', refCode)
    .eq('status', 'active')
    .single()

  // Redirect stripping ?ref regardless — valid or not, to avoid leaking in URLs
  // Use request.nextUrl — on Vercel edge it always has the correct pathname
  const cleanUrl = new URL(request.nextUrl.toString())
  cleanUrl.searchParams.delete('ref')
  console.log('[ref] redirect:', request.nextUrl.toString(), '→', cleanUrl.toString())
  const redirect = NextResponse.redirect(cleanUrl)

  if (!affiliate) return redirect

  // Set cookie (httpOnly:false so JS can read it on /join page)
  redirect.cookies.set('ref_code', refCode, {
    maxAge: 60 * 24 * 60 * 60, // 60 days
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    domain: '.nata-tomshina.ru',
  })

  // Record click with deduplication
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? request.headers.get('x-real-ip')
      ?? 'unknown'
    const ua = request.headers.get('user-agent') ?? ''
    const [ipHash, uaHash] = await Promise.all([sha256(ip), sha256(ua)])

    // Dedup: skip if same ip_hash + affiliate_id clicked in last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: existing } = await admin
      .from('affiliate_clicks')
      .select('id')
      .eq('affiliate_id', affiliate.id)
      .eq('ip_hash', ipHash)
      .gte('landed_at', since)
      .limit(1)
      .single()

    if (!existing) {
      await admin.from('affiliate_clicks').insert({
        affiliate_id: affiliate.id,
        ip_hash: ipHash,
        user_agent_hash: uaHash,
      })
    }
  } catch {
    // Non-critical — don't block the redirect
  }

  return redirect
}

export async function proxy(request: NextRequest) {
  // ── Affiliate ref tracking ────────────────────────────────────────
  if (request.nextUrl.searchParams.has('ref')) {
    const refRedirect = await handleRefCode(request)
    if (refRedirect) return refRedirect
  }
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://byykvsjamtcklwtnjkpf.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_2V678YWUVeSiT0g1mUOHKg_zfOUFSVj',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') ?? ''

  // Route public site SEO pages to /public-site/* prefix
  const PUBLIC_SITE_PATHS = ['/blog', '/recipes', '/about', '/results', '/club', '/free', '/free-kurs', '/marathon', '/menyu', '/racion']
  const isPublicSitePath = PUBLIC_SITE_PATHS.some(p =>
    pathname === p || pathname.startsWith(p + '/')
  )
  if (hostname === 'nata-tomshina.ru' || hostname === 'www.nata-tomshina.ru') {
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/public-site', request.url))
    }
    if (isPublicSitePath) {
      return NextResponse.rewrite(new URL(`/public-site${pathname}`, request.url))
    }
  }

  // /auth и /auth/* — никогда не редиректить, страница сама управляет состоянием
  if (pathname.startsWith('/auth')) {
    return NextResponse.next()
  }

  // club.nata-tomshina.ru root → redirect to dashboard or auth
  if (hostname === 'club.nata-tomshina.ru' && pathname === '/') {
    return NextResponse.redirect(new URL(user ? '/dashboard' : '/auth', request.url))
  }

  // Not logged in → redirect to /auth
  if (
    !user &&
    (pathname.startsWith('/dashboard') ||
      pathname.startsWith('/admin') ||
      pathname === '/onboarding')
  ) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Onboarding + blocked check (only on dashboard/onboarding to minimise DB calls)
  if (user && (pathname.startsWith('/dashboard') || pathname === '/onboarding')) {
    // Service role — обходит RLS, ищем по email (ID может не совпадать с auth user ID)
    const supabaseAdmin = createAdminClient()
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('weight, is_blocked, role, subscription_status, subscription_ends_at')
      .eq('email', user.email)
      .single()

    console.log('Middleware member lookup result:', {
      path: pathname,
      userEmail: user?.email,
      userId: user?.id,
      memberFound: !!member,
      subscriptionStatus: member?.subscription_status,
      subscriptionEndsAt: member?.subscription_ends_at,
      role: member?.role,
    })

    // Blocked non-admins → /blocked
    if (member?.is_blocked && member?.role !== 'admin') {
      return NextResponse.redirect(new URL('/blocked', request.url))
    }

    // Admins and curators always pass through
    if (member?.role === 'admin' || member?.role === 'curator') {
      // skip subscription check, fall through to profile/onboarding checks
    } else if (
      pathname.startsWith('/dashboard') &&
      member?.subscription_status !== 'active' &&
      member?.subscription_status !== 'trial'
    ) {
      console.log('Middleware redirect to /join:', {
        path: pathname,
        userEmail: user?.email,
        subscriptionStatus: member?.subscription_status,
        subscriptionEndsAt: member?.subscription_ends_at,
        reason: member ? 'subscription_status not active/trial' : 'member row not found by email',
      })
      return NextResponse.redirect(new URL('/join', request.url))
    }

    const hasProfile = !!member?.weight

    // Not filled profile → redirect to onboarding
    if (!hasProfile && pathname !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // Already filled → skip onboarding
    if (hasProfile && pathname === '/onboarding') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Curator admin route restriction: only /admin/marathons* is allowed
  if (user && pathname.startsWith('/admin')) {
    const { data: adminMember } = await supabase
      .from('members')
      .select('role')
      .eq('id', user.id)
      .single()
    if (adminMember?.role === 'curator' && !pathname.startsWith('/admin/marathons')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)'],
}
