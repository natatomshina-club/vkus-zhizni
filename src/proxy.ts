import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Not logged in → redirect to /auth
  if (
    !user &&
    (pathname.startsWith('/dashboard') ||
      pathname.startsWith('/admin') ||
      pathname === '/onboarding')
  ) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Logged in on /auth → go to dashboard
  if (user && pathname === '/auth') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Onboarding + blocked check (only on dashboard/onboarding to minimise DB calls)
  if (user && (pathname.startsWith('/dashboard') || pathname === '/onboarding')) {
    const { data: member } = await supabase
      .from('members')
      .select('weight, is_blocked, role')
      .eq('id', user.id)
      .single()

    // Blocked non-admins → /blocked
    if (member?.is_blocked && member?.role !== 'admin') {
      return NextResponse.redirect(new URL('/blocked', request.url))
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

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/auth', '/onboarding', '/blocked'],
}
