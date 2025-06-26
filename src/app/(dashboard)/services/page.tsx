'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ServiceList } from '@/components/services/service-list'
import { ServiceStats } from '@/components/services/service-stats'
import { ServiceFilters } from '@/components/services/service-filters'
import { useRouter } from 'next/navigation'
import { ServiceWithPhotos, ServiceFilters as ServiceFiltersType, ServiceStats as ServiceStatsType } from '@/types/services'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

export default function ServicesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  const [services, setServices] = useState<ServiceWithPhotos[]>([])
  const [stats, setStats] = useState<ServiceStatsType>({
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
  const [filters, setFilters] = useState<ServiceFiltersType>({
    search: '',
    category: 'all',
    status: 'all',
    price_range: {
      min: 0,
      max: 1000
    }
  })
  const [isLoading, setIsLoading] = useState(true)

  // Carregar serviços
  const loadServices = async () => {
    if (!user?.company_id) return

    try {
      setIsLoading(true)
      const supabase = createClient()
      
      // Buscar serviços
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', user.company_id)
        .order('created_at', { ascending: false })

      if (servicesError) throw servicesError

      // Buscar fotos dos serviços
      const serviceIds = servicesData?.map(s => s.id) || []
      let photosData: any[] = []
      
      if (serviceIds.length > 0) {
        const { data: photos, error: photosError } = await supabase
          .from('service_photos')
          .select('*')
          .in('service_id', serviceIds)
          .order('is_primary', { ascending: false })

        if (!photosError) {
          photosData = photos || []
        }
      }

      // Combinar serviços com fotos
      const servicesWithPhotos: ServiceWithPhotos[] = (servicesData || []).map(service => {
        const servicePhotos = photosData.filter(photo => photo.service_id === service.id)
        const primaryPhoto = servicePhotos.find(photo => photo.is_primary)
        
        return {
          ...service,
          photos: servicePhotos,
          primary_photo: primaryPhoto
        }
      })

      setServices(servicesWithPhotos)
      calculateStats(servicesWithPhotos)
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calcular estatísticas
  const calculateStats = (servicesData: ServiceWithPhotos[]) => {
    const total = servicesData.length
    const active = servicesData.filter(s => s.is_active).length
    const inactive = total - active
    
    const by_category = servicesData.reduce((acc, service) => {
      acc[service.category as keyof typeof acc] = (acc[service.category as keyof typeof acc] || 0) + 1
      return acc
    }, {
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
    })

    const average_price = total > 0 ? servicesData.reduce((sum, s) => sum + s.price, 0) / total : 0
    const average_duration = total > 0 ? servicesData.reduce((sum, s) => sum + s.duration_minutes, 0) / total : 0

    setStats({
      total,
      active,
      inactive,
      by_category,
      average_price,
      average_duration
    })
  }

  // Filtrar serviços
  const filteredServices = services.filter(service => {
    // Filtro de busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!service.name.toLowerCase().includes(searchLower) &&
          !service.description?.toLowerCase().includes(searchLower)) {
        return false
      }
    }

    // Filtro de categoria
    if (filters.category !== 'all' && service.category !== filters.category) {
      return false
    }

    // Filtro de status
    if (filters.status === 'active' && !service.is_active) return false
    if (filters.status === 'inactive' && service.is_active) return false

    // Filtro de preço
    if (service.price < filters.price_range.min || service.price > filters.price_range.max) {
      return false
    }

    return true
  })

  // Handlers
  const handleEdit = (service: any) => {
    router.push(`/services/${service.id}/edit`)
  }

  const handleDelete = async (service: any) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', service.id)

      if (error) throw error

      await loadServices()
    } catch (error) {
      console.error('Erro ao excluir serviço:', error)
      alert('Erro ao excluir serviço')
    }
  }

  const handleDuplicate = async (service: any) => {
    try {
      const { name, description, category, price, duration_minutes, requires_appointment, max_pets_per_session, available_days, available_hours, color } = service
      
      const { error } = await supabase
        .from('services')
        .insert({
          company_id: user?.company_id,
          name: `${name} (Cópia)`,
          description,
          category,
          price,
          duration_minutes,
          is_active: false, // Criar como inativo
          requires_appointment,
          max_pets_per_session,
          available_days,
          available_hours,
          color
        })

      if (error) throw error

      await loadServices()
    } catch (error) {
      console.error('Erro ao duplicar serviço:', error)
      alert('Erro ao duplicar serviço')
    }
  }

  const handleToggleStatus = async (service: any) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id)

      if (error) throw error

      await loadServices()
    } catch (error) {
      console.error('Erro ao alterar status do serviço:', error)
      alert('Erro ao alterar status do serviço')
    }
  }

  useEffect(() => {
    loadServices()
  }, [user?.company_id])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
          <p className="text-gray-600">Gerencie os serviços do seu pet shop</p>
        </div>
        <Button onClick={() => router.push('/services/new')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      {/* Estatísticas */}
      <ServiceStats stats={stats} />

      {/* Filtros e Lista */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filtros */}
        <div className="lg:col-span-1">
          <ServiceFilters
            filters={filters}
            onFiltersChange={setFilters}
            stats={stats}
          />
        </div>

        {/* Lista de Serviços */}
        <div className="lg:col-span-3">
          <ServiceList
            services={filteredServices}
            filters={filters}
            onFiltersChange={setFilters}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onToggleStatus={handleToggleStatus}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}