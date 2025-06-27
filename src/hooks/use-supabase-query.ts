import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface UseSupabaseQueryOptions {
  enabled?: boolean
  refetchOnMount?: boolean
}

interface UseSupabaseQueryResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: UseSupabaseQueryOptions = {}
): UseSupabaseQueryResult<T> {
  const { enabled = true, refetchOnMount = true } = options
  
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const executeQuery = async () => {
    if (!enabled) return
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await queryFn()
      
      if (result.error) {
        setError(result.error.message || 'Erro ao buscar dados')
        setData(null)
      } else {
        setData(result.data)
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (refetchOnMount) {
      executeQuery()
    }
  }, [enabled, refetchOnMount])

  return {
    data,
    loading,
    error,
    refetch: executeQuery
  }
}

// Hook especializado para consultas de tabelas
export function useSupabaseTable<T>(
  tableName: string,
  options: UseSupabaseQueryOptions & {
    select?: string
    filters?: Record<string, any>
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
  } = {}
): UseSupabaseQueryResult<T[]> {
  const { select = '*', filters = {}, orderBy, limit, ...queryOptions } = options
  
  const queryFn = async () => {
    const supabase = createClient()
    let query = supabase.from(tableName).select(select)
    
    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value)
      }
    })
    
    // Aplicar ordenação
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
    }
    
    // Aplicar limite
    if (limit) {
      query = query.limit(limit)
    }
    
    return query
  }
  
  return useSupabaseQuery<T[]>(queryFn, queryOptions)
}
