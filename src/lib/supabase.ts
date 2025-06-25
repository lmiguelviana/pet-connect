import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_url_here' || supabaseAnonKey === 'your_supabase_anon_key_here') {
  throw new Error('Please configure your Supabase environment variables in .env.local')
}

// Cliente para uso no lado do cliente (browser)
export const createClient = () => {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
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