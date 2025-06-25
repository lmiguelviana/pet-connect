# 🔐 Fase 02 - Sistema de Autenticação

## 📋 Objetivos da Fase

- Implementar autenticação completa com Supabase Auth
- Criar páginas de login, registro e recuperação de senha
- Configurar middleware de autenticação
- Implementar controle de acesso por planos
- Criar sistema de onboarding para novas empresas

## ⏱️ Estimativa: 3-4 dias

## 🛠️ Tarefas Detalhadas

### 1. Configuração do Supabase Auth

#### 1.1 Configurar Políticas de Autenticação
```sql
-- Configurar no Supabase Dashboard > Authentication > Settings

-- Site URL: http://localhost:3000 (dev) / https://petconnect.com (prod)
-- Redirect URLs: 
--   http://localhost:3000/auth/callback
--   https://petconnect.com/auth/callback

-- Email Templates personalizados
-- Confirm signup: Bem-vindo ao Pet Connect!
-- Magic Link: Acesse sua conta Pet Connect
-- Reset Password: Redefinir senha Pet Connect
```

#### 1.2 Configurar Providers de Autenticação
```sql
-- Habilitar apenas Email/Password por enquanto
-- Futuramente: Google, Apple (se necessário)
```

### 2. Estrutura de Autenticação

#### 2.1 Context de Autenticação
```typescript
// src/contexts/auth-context.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@/lib/supabase'
import { Company, User as AppUser } from '@/types'

interface AuthContextType {
  user: User | null
  appUser: AppUser | null
  company: Company | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, companyData: any) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Verificar sessão atual
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await loadUserData(session.user.id)
      }
      
      setLoading(false)
    }

    getSession()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserData(session.user.id)
        } else {
          setAppUser(null)
          setCompany(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = async (userId: string) => {
    try {
      // Buscar dados do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) throw userError
      setAppUser(userData)

      // Buscar dados da empresa
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userData.company_id)
        .single()

      if (companyError) throw companyError
      setCompany(companyData)
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) return { error: error.message }
      return {}
    } catch (error) {
      return { error: 'Erro inesperado ao fazer login' }
    }
  }

  const signUp = async (email: string, password: string, companyData: any) => {
    try {
      // 1. Criar usuário no Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: companyData.ownerName,
          }
        }
      })

      if (authError) return { error: authError.message }
      if (!data.user) return { error: 'Erro ao criar usuário' }

      // 2. Criar empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyData.companyName,
          email: companyData.companyEmail,
          phone: companyData.phone,
          address: companyData.address,
          cnpj: companyData.cnpj,
          plan_type: 'free'
        })
        .select()
        .single()

      if (companyError) return { error: 'Erro ao criar empresa' }

      // 3. Criar usuário na tabela users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          company_id: company.id,
          name: companyData.ownerName,
          email: email,
          role: 'owner'
        })

      if (userError) return { error: 'Erro ao criar perfil do usuário' }

      return {}
    } catch (error) {
      return { error: 'Erro inesperado ao criar conta' }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) return { error: error.message }
      return {}
    } catch (error) {
      return { error: 'Erro ao enviar email de recuperação' }
    }
  }

  const value = {
    user,
    appUser,
    company,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

#### 2.2 Middleware de Autenticação
```typescript
// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
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
```

### 3. Páginas de Autenticação

#### 3.1 Layout de Autenticação
```typescript
// src/app/(auth)/layout.tsx
import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo - Formulário */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🐾</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Pet Connect</h1>
            <p className="text-gray-600 mt-2">Sistema de gestão para pet shops</p>
          </div>
          {children}
        </div>
      </div>

      {/* Lado direito - Imagem/Branding */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700">
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🐕🐱</div>
              <h2 className="text-3xl font-bold mb-4">Gerencie seu pet shop com facilidade</h2>
              <p className="text-xl opacity-90 max-w-md">
                Controle clientes, pets, agendamentos e finanças em um só lugar
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### 3.2 Página de Login
```typescript
// src/app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error)
    } else {
      router.push('/dashboard')
    }
    
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Entrar na sua conta</h2>
        <p className="text-gray-600 mt-2">Acesse o painel do seu pet shop</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="mt-1"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Lembrar de mim
            </label>
          </div>

          <div className="text-sm">
            <Link
              href="/auth/forgot-password"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Esqueceu a senha?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={loading}
        >
          Entrar
        </Button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Novo por aqui?</span>
          </div>
        </div>

        <div className="mt-6">
          <Link href="/auth/register">
            <Button variant="outline" className="w-full">
              Criar conta gratuita
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
```

#### 3.3 Página de Registro
```typescript
// src/app/(auth)/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companyEmail: '',
    phone: '',
    cnpj: '',
    address: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: Dados pessoais, 2: Dados da empresa
  const { signUp } = useAuth()
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNextStep = () => {
    if (step === 1) {
      // Validar dados pessoais
      if (!formData.ownerName || !formData.email || !formData.password) {
        setError('Preencha todos os campos obrigatórios')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem')
        return
      }
      if (formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres')
        return
      }
      setError('')
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.companyName) {
      setError('Nome da empresa é obrigatório')
      setLoading(false)
      return
    }

    const { error } = await signUp(formData.email, formData.password, formData)
    
    if (error) {
      setError(error)
    } else {
      router.push('/dashboard?welcome=true')
    }
    
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Criar conta gratuita</h2>
        <p className="text-gray-600 mt-2">
          {step === 1 ? 'Seus dados pessoais' : 'Dados do seu pet shop'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex-1 h-2 rounded-full ${
            step >= 1 ? 'bg-primary-500' : 'bg-gray-200'
          }`} />
          <div className="mx-2 text-sm text-gray-500">1</div>
          <div className={`flex-1 h-2 rounded-full ${
            step >= 2 ? 'bg-primary-500' : 'bg-gray-200'
          }`} />
          <div className="mx-2 text-sm text-gray-500">2</div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          {error}
        </Alert>
      )}

      {step === 1 ? (
        <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-6">
          <div>
            <Label htmlFor="ownerName">Seu nome completo *</Label>
            <Input
              id="ownerName"
              type="text"
              value={formData.ownerName}
              onChange={(e) => handleInputChange('ownerName', e.target.value)}
              required
              placeholder="João Silva"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              placeholder="joao@petshop.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              placeholder="••••••••"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar senha *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              required
              placeholder="••••••••"
              className="mt-1"
            />
          </div>

          <Button type="submit" className="w-full">
            Próximo
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="companyName">Nome do pet shop *</Label>
            <Input
              id="companyName"
              type="text"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              required
              placeholder="Pet Shop do João"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="companyEmail">Email da empresa</Label>
            <Input
              id="companyEmail"
              type="email"
              value={formData.companyEmail}
              onChange={(e) => handleInputChange('companyEmail', e.target.value)}
              placeholder="contato@petshop.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              type="text"
              value={formData.cnpj}
              onChange={(e) => handleInputChange('cnpj', e.target.value)}
              placeholder="00.000.000/0001-00"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Rua das Flores, 123 - Centro"
              className="mt-1"
            />
          </div>

          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Voltar
            </Button>
            <Button
              type="submit"
              loading={loading}
              className="flex-1"
            >
              Criar conta
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 text-center">
        <span className="text-gray-600">Já tem uma conta? </span>
        <Link
          href="/auth/login"
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Fazer login
        </Link>
      </div>
    </div>
  )
}
```

#### 3.4 Página de Recuperação de Senha
```typescript
// src/app/(auth)/forgot-password/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await resetPassword(email)
    
    if (error) {
      setError(error)
    } else {
      setSuccess(true)
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Email enviado!</h2>
          <p className="text-gray-600 mt-2">
            Enviamos um link para redefinir sua senha para <strong>{email}</strong>
          </p>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Não recebeu o email? Verifique sua caixa de spam ou tente novamente.
          </p>
          
          <Button
            variant="outline"
            onClick={() => setSuccess(false)}
            className="w-full"
          >
            Tentar outro email
          </Button>
          
          <Link href="/auth/login">
            <Button variant="ghost" className="w-full">
              Voltar para o login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Esqueceu sua senha?</h2>
        <p className="text-gray-600 mt-2">
          Digite seu email e enviaremos um link para redefinir sua senha
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            className="mt-1"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          loading={loading}
        >
          Enviar link de recuperação
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/auth/login"
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Voltar para o login
        </Link>
      </div>
    </div>
  )
}
```

### 4. Callback de Autenticação

#### 4.1 Página de Callback
```typescript
// src/app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirecionar para dashboard após autenticação
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

### 5. Hooks Utilitários

#### 5.1 Hook para Verificação de Plano
```typescript
// src/hooks/use-plan.ts
import { useAuth } from '@/contexts/auth-context'

export function usePlan() {
  const { company } = useAuth()
  
  const isPremium = company?.plan_type === 'premium'
  const isFree = company?.plan_type === 'free'
  
  const checkFeature = (feature: string) => {
    if (isPremium) return true
    
    // Funcionalidades do plano gratuito
    const freeFeatures = [
      'basic_dashboard',
      'client_management',
      'pet_management',
      'basic_appointments',
      'service_management'
    ]
    
    return freeFeatures.includes(feature)
  }
  
  const getLimits = () => {
    if (isPremium) {
      return {
        clients: Infinity,
        pets: Infinity,
        users: Infinity,
        appointments: Infinity,
        photos: Infinity
      }
    }
    
    return {
      clients: 20,
      pets: 30,
      users: 1,
      appointments: 10,
      photos: 0
    }
  }
  
  return {
    isPremium,
    isFree,
    checkFeature,
    getLimits,
    planType: company?.plan_type || 'free'
  }
}
```

### 6. Componentes de Proteção

#### 6.1 Componente ProtectedRoute
```typescript
// src/components/auth/protected-route.tsx
'use client'

import { useAuth } from '@/contexts/auth-context'
import { usePlan } from '@/hooks/use-plan'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiresPremium?: boolean
  feature?: string
}

export function ProtectedRoute({ 
  children, 
  requiresPremium = false, 
  feature 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const { isPremium, checkFeature } = usePlan()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert>
          Você precisa estar logado para acessar esta página.
        </Alert>
      </div>
    )
  }
  
  if (requiresPremium && !isPremium) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-8V7m0 0V5m0 2h2m-2 0H8" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Recurso Premium</h2>
            <p className="text-gray-600 mb-6">
              Esta funcionalidade está disponível apenas no plano Premium.
            </p>
            <Button className="w-full">
              Fazer upgrade para Premium
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  if (feature && !checkFeature(feature)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert>
          Você não tem permissão para acessar este recurso.
        </Alert>
      </div>
    )
  }
  
  return <>{children}</>
}
```

## ✅ Critérios de Aceitação

- [ ] Sistema de autenticação funcionando com Supabase
- [ ] Páginas de login, registro e recuperação de senha criadas
- [ ] Middleware de autenticação implementado
- [ ] Context de autenticação funcionando
- [ ] Controle de acesso por planos implementado
- [ ] Componentes de proteção criados
- [ ] Onboarding de novas empresas funcionando
- [ ] Redirecionamentos corretos implementados

## 🔄 Próximos Passos

Após completar esta fase:
1. **Fase 03**: Criar dashboard principal
2. Implementar banco de dados no Supabase
3. Configurar políticas RLS

## 📝 Notas Importantes

- Testar todos os fluxos de autenticação
- Verificar redirecionamentos em diferentes cenários
- Implementar tratamento de erros adequado
- Configurar emails de confirmação personalizados
- Testar controle de acesso por planos

---

**Tempo estimado: 3-4 dias**  
**Complexidade: Média**  
**Dependências: Fase 01 concluída**