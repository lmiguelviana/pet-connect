import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Database } from '@/types/database'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Rotas que requerem autenticação
  const protectedRoutes = ['/dashboard', '/clients', '/pets', '/appointments', '/services', '/financial', '/reports']
  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  // Rotas de autenticação
  const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password']
  const isAuthRoute = authRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  // Redirecionar usuários não autenticados para login
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // Redirecionar usuários autenticados para dashboard
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Verificar plano para rotas premium
  if (session && isProtectedRoute) {
    const premiumRoutes = ['/financial', '/reports']
    const isPremiumRoute = premiumRoutes.some(route => req.nextUrl.pathname.startsWith(route))
    
    if (isPremiumRoute) {
      // Buscar dados da empresa
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', session.user.id)
        .single()

      if (userData) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('plan_type')
          .eq('id', userData.company_id)
          .single()

        if (companyData?.plan_type !== 'premium') {
          return NextResponse.redirect(new URL('/dashboard?upgrade=true', req.url))
        }
      }
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}