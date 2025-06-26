import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser()

  const { data: { user } } = await supabase.auth.getUser()
  
  // Define protected routes
  const protectedRoutes = ['/dashboard', '/clients', '/pets', '/appointments', '/services', '/reports', '/settings']
  const authRoutes = ['/login', '/register', '/forgot-password']
  const premiumRoutes = ['/reports', '/premium-features']
  
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  const isPremiumRoute = premiumRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  
  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Redirect unauthenticated users to login
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Check premium features access
  if (user && isPremiumRoute) {
    // Get user's company and plan
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (userData?.company_id) {
      const { data: companyData } = await supabase
        .from('companies')
        .select('plan_type')
        .eq('id', userData.company_id)
        .single()
      
      if (companyData?.plan_type !== 'premium') {
        return NextResponse.redirect(new URL('/dashboard?upgrade=true', request.url))
      }
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
