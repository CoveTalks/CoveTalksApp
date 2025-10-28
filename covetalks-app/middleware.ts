import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protect dashboard routes
  if (!user && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  // BUT allow certain auth pages that authenticated users need to access
  if (user && pathname.startsWith('/auth')) {
    // Allow these auth pages even for authenticated users:
    const allowedAuthPages = [
      '/auth/profile-setup',  // Users need this when onboarding_completed is false
      '/auth/confirm',         // Needed for magic link confirmation
      '/auth/onboarding',      // Edge case for type selection
      '/auth/logout'           // If you have a logout page
    ]
    
    // Check if current path is allowed
    const isAllowedPage = allowedAuthPages.some(page => pathname.startsWith(page))
    
    if (isAllowedPage) {
      // For profile-setup specifically, check if they should be there
      if (pathname.startsWith('/auth/profile-setup')) {
        // Check if onboarding is already completed
        const { data: member } = await supabase
          .from('members')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()
        
        // If onboarding is already completed, redirect to dashboard
        if (member?.onboarding_completed) {
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard'
          // Preserve subscription success parameter if present
          const subscription = request.nextUrl.searchParams.get('subscription')
          if (subscription) {
            url.searchParams.set('subscription', subscription)
          }
          return NextResponse.redirect(url)
        }
      }
      
      // Allow access to the auth page
      return supabaseResponse
    }
    
    // For other auth pages (login, register, etc.), redirect to dashboard
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
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
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}