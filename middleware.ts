import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── ADMIN USER IDs ─────────────────────────────────────────────────────────
// Add your Supabase user ID here (Settings → Authentication → Users → your row)
const ADMIN_USER_IDS = [
  '1a5b902c-9e3a-44cd-970a-bb852b1cd5e4',
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/trial', '/login', '/confirmed']
  const isPublicRoute = publicRoutes.some(route => pathname === route)
  
  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // Protect /admin routes - ADMIN ONLY ACCESS
  if (pathname.startsWith('/admin')) {
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').filter(Boolean).map(c => {
        const idx = c.indexOf('=')
        return [c.slice(0, idx), c.slice(idx + 1)]
      })
    )

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })),
          setAll: () => {},
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !ADMIN_USER_IDS.includes(user.id)) {
      // Redirect non-admins to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next()
  }
  
  // Protect /dashboard/* routes - AUTHENTICATED USER ACCESS
  if (pathname.startsWith('/dashboard')) {
    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    // If not authenticated, redirect to login
    if (!user) {
      const url = new URL('/login', request.url)
      return NextResponse.redirect(url)
    }

    // Refresh session if expired
    await supabase.auth.getUser()

    return supabaseResponse
  }
  
  // For all other routes, allow access
  return NextResponse.next()
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