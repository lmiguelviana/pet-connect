import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

type QueryFunction<T> = (supabase: SupabaseClient, companyId: string) => Promise<T[]>

interface UseSupabaseQueryOptions {
  enabled?: boolean
  refetchOnMount?: boolean
}

interface UseSupabaseQueryResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSupabaseQuery<T>(
  queryFn: QueryFunction<T>,
  deps: any[] = [],
  options: UseSupabaseQueryOptions = {}
): UseSupabaseQueryResult<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { company } = useAuth()
  const supabase = createClient()

  const { enabled = true, refetchOnMount = true } = options

  const loadData = async () => {
    if (!company?.id || !enabled) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const result = await queryFn(supabase, company.id)
      setData(result || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Erro na query:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (refetchOnMount) {
      loadData()
    }
  }, [company?.id, enabled, ...deps])

  return {
    data,
    loading,
    error,
    refetch: loadData
  }
}

// Hook específico para queries simples
export function useSupabaseTable<T>(
  tableName: string,
  select: string = '*',
  filters?: Record<string, any>,
  orderBy?: { column: string; ascending?: boolean }
) {
  return useSupabaseQuery<T>(async (supabase, companyId) => {
    let query = supabase
      .from(tableName)
      .select(select)
      .eq('company_id', companyId)

    // Aplicar filtros adicionais
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value)
        }
      })
    }

    // Aplicar ordenação
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
    }

    const { data, error } = await query
    if (error) throw error
    return data
  })
}