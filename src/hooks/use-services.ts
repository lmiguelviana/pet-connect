import { useState, useCallback, useEffect } from 'react'
import { ServiceWithPhotos, ServiceFilters, ServiceStats, ServiceFormData } from '@/types/services'
import { toast } from 'sonner'

interface UseServicesOptions {
  autoLoad?: boolean
  filters?: ServiceFilters
  pagination?: {
    page: number
    limit: number
  }
}

interface ServicesResponse {
  services: ServiceWithPhotos[]
  stats: ServiceStats
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useServices(options: UseServicesOptions = {}) {
  const { autoLoad = true, filters, pagination } = options
  
  const [services, setServices] = useState<ServiceWithPhotos[]>([])
  const [stats, setStats] = useState<ServiceStats>({
    total: 0,
    active: 0,
    inactive: 0,
    by_category: {
      banho: 0,
      tosa: 0,
      'banho-e-tosa': 0,
      veterinario: 0,
      consulta: 0,
      vacina: 0,
      cirurgia: 0,
      estetica: 0,
      spa: 0,
      hotel: 0,
      daycare: 0,
      adestramento: 0,
      outros: 0
    },
    average_price: 0,
    average_duration: 0
  })
  const [paginationInfo, setPaginationInfo] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Construir query string para filtros
  const buildQueryString = useCallback((customFilters?: ServiceFilters, customPagination?: { page: number; limit: number }) => {
    const params = new URLSearchParams()
    
    const activeFilters = customFilters || filters
    const activePagination = customPagination || pagination

    if (activeFilters?.search) {
      params.append('search', activeFilters.search)
    }
    if (activeFilters?.category && activeFilters.category !== 'all') {
      params.append('category', activeFilters.category)
    }
    if (activeFilters?.status && activeFilters.status !== 'all') {
      params.append('status', activeFilters.status)
    }
    if (activePagination?.page) {
      params.append('page', activePagination.page.toString())
    }
    if (activePagination?.limit) {
      params.append('limit', activePagination.limit.toString())
    }

    return params.toString()
  }, [filters, pagination])

  // Carregar serviços
  const loadServices = useCallback(async (customFilters?: ServiceFilters, customPagination?: { page: number; limit: number }) => {
    try {
      setIsLoading(true)
      setError(null)

      const queryString = buildQueryString(customFilters, customPagination)
      const response = await fetch(`/api/services?${queryString}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao carregar serviços')
      }

      const data: ServicesResponse = await response.json()
      
      setServices(data.services)
      setStats(data.stats)
      setPaginationInfo(data.pagination)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [buildQueryString])

  // Criar serviço
  const createService = useCallback(async (data: ServiceFormData): Promise<ServiceWithPhotos | null> => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar serviço')
      }

      const result = await response.json()
      toast.success('Serviço criado com sucesso!')
      
      // Recarregar lista
      await loadServices()
      
      return result.service

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [loadServices])

  // Atualizar serviço
  const updateService = useCallback(async (id: string, data: Partial<ServiceFormData>): Promise<ServiceWithPhotos | null> => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar serviço')
      }

      const result = await response.json()
      toast.success('Serviço atualizado com sucesso!')
      
      // Atualizar lista local
      setServices(prev => prev.map(service => 
        service.id === id ? result.service : service
      ))
      
      return result.service

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Excluir serviço
  const deleteService = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/services/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir serviço')
      }

      toast.success('Serviço excluído com sucesso!')
      
      // Remover da lista local
      setServices(prev => prev.filter(service => service.id !== id))
      
      // Atualizar estatísticas
      await loadServices()
      
      return true

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [loadServices])

  // Buscar serviço específico
  const getService = useCallback(async (id: string): Promise<ServiceWithPhotos | null> => {
    try {
      const response = await fetch(`/api/services/${id}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar serviço')
      }

      const result = await response.json()
      return result.service

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(errorMessage)
      return null
    }
  }, [])

  // Upload de foto
  const uploadPhoto = useCallback(async (serviceId: string, file: File, metadata?: { is_primary?: boolean; caption?: string }): Promise<boolean> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata))
      }

      const response = await fetch(`/api/services/${serviceId}/photos`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao fazer upload da foto')
      }

      toast.success('Foto enviada com sucesso!')
      
      // Recarregar serviço para atualizar fotos
      const updatedService = await getService(serviceId)
      if (updatedService) {
        setServices(prev => prev.map(service => 
          service.id === serviceId ? updatedService : service
        ))
      }
      
      return true

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(errorMessage)
      return false
    }
  }, [getService])

  // Excluir foto
  const deletePhoto = useCallback(async (serviceId: string, photoId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/services/${serviceId}/photos?photoId=${photoId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir foto')
      }

      toast.success('Foto excluída com sucesso!')
      
      // Recarregar serviço para atualizar fotos
      const updatedService = await getService(serviceId)
      if (updatedService) {
        setServices(prev => prev.map(service => 
          service.id === serviceId ? updatedService : service
        ))
      }
      
      return true

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(errorMessage)
      return false
    }
  }, [getService])

  // Definir foto como principal
  const setPrimaryPhoto = useCallback(async (serviceId: string, photoId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/services/${serviceId}/photos?photoId=${photoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_primary: true })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao definir foto principal')
      }

      toast.success('Foto principal definida com sucesso!')
      
      // Recarregar serviço para atualizar fotos
      const updatedService = await getService(serviceId)
      if (updatedService) {
        setServices(prev => prev.map(service => 
          service.id === serviceId ? updatedService : service
        ))
      }
      
      return true

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(errorMessage)
      return false
    }
  }, [getService])

  // Carregar automaticamente na inicialização
  useEffect(() => {
    if (autoLoad) {
      loadServices()
    }
  }, [autoLoad, loadServices])

  return {
    // Estado
    services,
    stats,
    pagination: paginationInfo,
    isLoading,
    error,
    
    // Ações
    loadServices,
    createService,
    updateService,
    deleteService,
    getService,
    uploadPhoto,
    deletePhoto,
    setPrimaryPhoto,
    
    // Utilitários
    refresh: () => loadServices()
  }
}

// Hook específico para um serviço
export function useService(id: string) {
  const [service, setService] = useState<ServiceWithPhotos | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadService = useCallback(async () => {
    if (!id) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/services/${id}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao carregar serviço')
      }

      const result = await response.json()
      setService(result.service)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadService()
  }, [loadService])

  return {
    service,
    isLoading,
    error,
    refresh: loadService
  }
}