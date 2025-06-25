import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Cliente para uso no lado do cliente (browser)
export const createClient = () => {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Cliente para uso no servidor
export const createServerSupabaseClient = () => {
  const cookieStore = cookies()
  
  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Cliente para uso no servidor (com service role)
export const createAdminClient = () => {
  return createServerClient<Database>(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() { return undefined },
        set() {},
        remove() {},
      },
    }
  )
}

// Tipos de resposta do Supabase
export type SupabaseResponse<T> = {
  data: T | null
  error: any
}

// Helper para verificar se há erro
export const hasError = (response: SupabaseResponse<any>): boolean => {
  return response.error !== null
}

// Helper para extrair dados com segurança
export const getData = <T>(response: SupabaseResponse<T>): T | null => {
  return hasError(response) ? null : response.data
}