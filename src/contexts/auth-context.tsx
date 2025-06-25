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
  const [setupError, setSetupError] = useState<string | null>(null)
  
  let supabase: any = null
  
  try {
    supabase = createClient()
  } catch (error: any) {
    setSetupError(error.message)
    setLoading(false)
  }

  useEffect(() => {
    if (!supabase) return
    
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
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) return { error: error.message }
      return {}
    } catch (error) {
      return { error: 'Erro ao enviar email de recuperação' }
    }
  }

  // Se houver erro de configuração, mostrar página de setup
  if (setupError) {
    if (typeof window !== 'undefined') {
      window.location.href = '/setup'
    }
    return null
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