import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdminUserId } from '@/lib/admin-ids'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/trial', '/login', '/confirmed']
  if (publicRoutes.some(route => pathname === route)) {
    return NextResponse.next()
  }

  // Routes below either require auth (/admin, /dashboard) or are unprotected
  const needsAuth = pathname.startsWith('/admin') || pathname.startsWith('/dashboard')
  if (!needsAuth) {
    return NextResponse.next()
  }

  // === SHARED AUTH FLOW ===
  // One createServerClient setup for both /admin and /dashboard. Uses Next's
  // native cookie API and propagates refreshed session cookies back to the
  // client — essential for session rotation to persist across requests.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Authenticate. getUser() handles session refresh internally and, via the
  // setAll callback above, writes rotated cookies back to the response.
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // === ROUTE-SPECIFIC AUTHORIZATION ===
  // /admin: must be an admin user. Non-admins are redirected to /dashboard
  // rather than /login, since they're authenticated — just not authorized.
  if (pathname.startsWith('/admin') && !isAdminUserId(user.id)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}

export { proxy as middleware }
