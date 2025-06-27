'use client'

import { useState, useEffect } from 'react'
import { ServicePackage } from '@/types/services'
import { toast } from 'sonner'

interface UseServicePackagesReturn {
  packages: ServicePackage[]
  loading: boolean
  error: string | null
  statistics: {
    total: number
    active: number
    inactive: number
    total_value: number
  }
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  // Funções
  fetchPackages: (params?: FetchPackagesParams) => Promise<void>
  createPackage: (packageData: Omit<ServicePackage, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => Promise<ServicePackage | null>
  updatePackage: (id: string, packageData: Partial<ServicePackage>) => Promise<ServicePackage | null>
  deletePackage: (id: string) => Promise<boolean>
  searchPackages: (query: string) => Promise<void>
  filterByStatus: (status: 'all' | 'active' | 'inactive') => Promise<void>
}

interface FetchPackagesParams {
  page?: number
  limit?: number
  search?: string
  status?: 'all' | 'active' | 'inactive'
}

export function useServicePackages(): UseServicePackagesReturn {
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    total_value: 0
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Buscar pacotes
  const fetchPackages = async (params: FetchPackagesParams = {}) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams({
        page: (params.page || pagination.page).toString(),
        limit: (params.limit || pagination.limit).toString(),
        ...(params.search && { search: params.search }),
        ...(params.status && params.status !== 'all' && { status: params.status })
      })

      const response = await fetch(`/api/service-packages?${searchParams}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar pacotes')
      }

      const data = await response.json()
      setPackages(data.packages || [])
      setStatistics(data.statistics || statistics)
      setPagination(data.pagination || pagination)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Criar pacote
  const createPackage = async (
    packageData: Omit<ServicePackage, 'id' | 'company_id' | 'created_at' | 'updated_at'>
  ): Promise<ServicePackage | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/service-packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(packageData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar pacote')
      }

      const data = await response.json()
      toast.success('Pacote criado com sucesso!')
      
      // Recarregar lista
      await fetchPackages()
      
      return data.package

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Atualizar pacote
  const updatePackage = async (
    id: string, 
    packageData: Partial<ServicePackage>
  ): Promise<ServicePackage | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/service-packages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(packageData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar pacote')
      }

      const data = await response.json()
      toast.success('Pacote atualizado com sucesso!')
      
      // Atualizar lista local
      setPackages(prev => prev.map(pkg => 
        pkg.id === id ? { ...pkg, ...data.package } : pkg
      ))
      
      return data.package

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Excluir pacote
  const deletePackage = async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/service-packages/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir pacote')
      }

      toast.success('Pacote excluído com sucesso!')
      
      // Remover da lista local
      setPackages(prev => prev.filter(pkg => pkg.id !== id))
      
      // Atualizar estatísticas
      setStatistics(prev => ({
        ...prev,
        total: prev.total - 1
      }))
      
      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Buscar pacotes
  const searchPackages = async (query: string) => {
    await fetchPackages({ search: query, page: 1 })
  }

  // Filtrar por status
  const filterByStatus = async (status: 'all' | 'active' | 'inactive') => {
    await fetchPackages({ status, page: 1 })
  }

  // Carregar pacotes na inicialização
  useEffect(() => {
    fetchPackages()
  }, [])

  return {
    packages,
    loading,
    error,
    statistics,
    pagination,
    fetchPackages,
    createPackage,
    updatePackage,
    deletePackage,
    searchPackages,
    filterByStatus
  }
}

// Hook para buscar um pacote específico
export function useServicePackage(id: string) {
  const [packageData, setPackageData] = useState<ServicePackage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPackage = async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/service-packages/${id}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar pacote')
      }

      const data = await response.json()
      setPackageData(data.package)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPackage()
  }, [id])

  return {
    packageData,
    loading,
    error,
    refetch: fetchPackage
  }
}