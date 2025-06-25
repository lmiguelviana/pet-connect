# 🛠️ Fase 07 - Módulo de Serviços

## 📋 Objetivos da Fase

- Implementar CRUD completo de serviços
- Criar categorização de serviços
- Implementar sistema de preços e promoções
- Adicionar configuração de duração e recursos
- Criar templates de serviços
- Implementar sistema de pacotes/combos
- Adicionar galeria de fotos dos serviços

## ⏱️ Estimativa: 4-5 dias

## 🛠️ Tarefas Detalhadas

### 1. Estrutura Base do Módulo de Serviços

#### 1.1 Página Principal de Serviços
```typescript
// src/app/(dashboard)/services/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { ServicesList } from '@/components/services/services-list'
import { ServicesFilters } from '@/components/services/services-filters'
import { ServicesStats } from '@/components/services/services-stats'
import { Button } from '@/components/ui/button'
import { PlusIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export interface Service {
  id: string
  name: string
  description: string | null
  category: 'grooming' | 'veterinary' | 'boarding' | 'training' | 'other'
  price: number
  duration: number // em minutos
  color: string
  is_active: boolean
  requires_pet: boolean
  max_pets_per_session: number
  preparation_time: number // tempo de preparação em minutos
  cleanup_time: number // tempo de limpeza em minutos
  resources_needed: string[] // recursos necessários
  created_at: string
  updated_at: string
  company_id: string
  photos: {
    id: string
    url: string
    is_primary: boolean
  }[]
  _count?: {
    appointments: number
  }
}

export default function ServicesPage() {
  const { company } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'duration' | 'created_at'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadServices()
    }
  }, [company?.id, searchQuery, categoryFilter, statusFilter, sortBy, sortOrder])

  const loadServices = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('services')
        .select(`
          *,
          photos:service_photos(
            id,
            url,
            is_primary
          ),
          appointments:appointments(count)
        `)
        .eq('company_id', company!.id)

      // Aplicar filtros
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active')
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter)
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      // Aplicar ordenação
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error } = await query

      if (error) throw error

      // Processar contagens
      const processedServices = data?.map(service => ({
        ...service,
        _count: {
          appointments: service.appointments?.[0]?.count || 0,
        }
      })) || []

      setServices(processedServices)
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
      toast.error('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', serviceId)
        .eq('company_id', company!.id)

      if (error) throw error

      toast.success('Serviço removido com sucesso')
      loadServices()
    } catch (error) {
      console.error('Erro ao remover serviço:', error)
      toast.error('Erro ao remover serviço')
    }
  }

  const handleRestoreService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: true })
        .eq('id', serviceId)
        .eq('company_id', company!.id)

      if (error) throw error

      toast.success('Serviço restaurado com sucesso')
      loadServices()
    } catch (error) {
      console.error('Erro ao restaurar serviço:', error)
      toast.error('Erro ao restaurar serviço')
    }
  }

  const handleDuplicateService = async (service: Service) => {
    try {
      const { id, created_at, updated_at, _count, photos, ...serviceData } = service
      
      const duplicatedService = {
        ...serviceData,
        name: `${service.name} (Cópia)`,
        company_id: company!.id,
      }

      const { error } = await supabase
        .from('services')
        .insert([duplicatedService])

      if (error) throw error

      toast.success('Serviço duplicado com sucesso')
      loadServices()
    } catch (error) {
      console.error('Erro ao duplicar serviço:', error)
      toast.error('Erro ao duplicar serviço')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
            Serviços
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie todos os serviços oferecidos pelo seu pet shop
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link href="/services/new">
            <Button className="inline-flex items-center">
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Novo Serviço
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <ServicesStats services={services} loading={loading} />

      {/* Filters */}
      <ServicesFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      {/* Services List */}
      <ServicesList
        services={services}
        loading={loading}
        onDelete={handleDeleteService}
        onRestore={handleRestoreService}
        onDuplicate={handleDuplicateService}
        onRefresh={loadServices}
      />
    </div>
  )
}
```

#### 1.2 Componente de Estatísticas dos Serviços
```typescript
// src/components/services/services-stats.tsx
import { Service } from '@/app/(dashboard)/services/page'
import { 
  WrenchScrewdriverIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline'

interface ServicesStatsProps {
  services: Service[]
  loading: boolean
}

export function ServicesStats({ services, loading }: ServicesStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const activeServices = services.filter(service => service.is_active)
  const totalServices = activeServices.length
  const averagePrice = activeServices.length > 0 
    ? activeServices.reduce((sum, service) => sum + service.price, 0) / activeServices.length
    : 0
  const averageDuration = activeServices.length > 0
    ? activeServices.reduce((sum, service) => sum + service.duration, 0) / activeServices.length
    : 0
  const totalAppointments = activeServices.reduce((sum, service) => sum + (service._count?.appointments || 0), 0)

  const stats = [
    {
      name: 'Total de Serviços',
      value: totalServices,
      icon: WrenchScrewdriverIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: `${services.filter(s => !s.is_active).length} inativos`,
      changeType: 'neutral',
    },
    {
      name: 'Preço Médio',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(averagePrice),
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '',
      changeType: 'positive',
    },
    {
      name: 'Duração Média',
      value: `${Math.round(averageDuration)} min`,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: '',
      changeType: 'neutral',
    },
    {
      name: 'Agendamentos',
      value: totalAppointments,
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: 'Total histórico',
      changeType: 'positive',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`rounded-md p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                  </dd>
                  {stat.change && (
                    <dd className="text-xs text-gray-600">
                      {stat.change}
                    </dd>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 2. Formulário de Cadastro/Edição de Serviços

#### 2.1 Página de Novo Serviço
```typescript
// src/app/(dashboard)/services/new/page.tsx
'use client'

import { ServiceForm } from '@/components/services/service-form'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function NewServicePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/services"
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Voltar para serviços
        </Link>
      </div>

      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
            Novo Serviço
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Cadastre um novo serviço no sistema
          </p>
        </div>
      </div>

      {/* Form */}
      <ServiceForm />
    </div>
  )
}
```

#### 2.2 Componente do Formulário de Serviço
```typescript
// src/components/services/service-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { MultiImageUpload } from '@/components/ui/multi-image-upload'
import { ColorPicker } from '@/components/ui/color-picker'
import { toast } from 'react-hot-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const serviceSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  category: z.enum(['grooming', 'veterinary', 'boarding', 'training', 'other'], {
    required_error: 'Selecione uma categoria',
  }),
  price: z.number().positive('Preço deve ser positivo'),
  duration: z.number().positive('Duração deve ser positiva'),
  color: z.string().min(1, 'Selecione uma cor'),
  requires_pet: z.boolean().default(true),
  max_pets_per_session: z.number().positive().default(1),
  preparation_time: z.number().min(0).default(0),
  cleanup_time: z.number().min(0).default(0),
  resources_needed: z.array(z.string()).default([]),
})

type ServiceFormData = z.infer<typeof serviceSchema>

interface ServiceFormProps {
  initialData?: Partial<ServiceFormData & { id: string; photos: { id: string; url: string; is_primary: boolean }[] }>
  isEditing?: boolean
}

export function ServiceForm({ initialData, isEditing = false }: ServiceFormProps) {
  const router = useRouter()
  const { company } = useAuth()
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState<{ url: string; is_primary: boolean }[]>(
    initialData?.photos?.map(p => ({ url: p.url, is_primary: p.is_primary })) || []
  )
  const [resources, setResources] = useState<string[]>(initialData?.resources_needed || [])
  const [newResource, setNewResource] = useState('')
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      category: initialData?.category || 'grooming',
      price: initialData?.price || 0,
      duration: initialData?.duration || 60,
      color: initialData?.color || '#3B82F6',
      requires_pet: initialData?.requires_pet ?? true,
      max_pets_per_session: initialData?.max_pets_per_session || 1,
      preparation_time: initialData?.preparation_time || 0,
      cleanup_time: initialData?.cleanup_time || 0,
      resources_needed: initialData?.resources_needed || [],
    },
  })

  const onSubmit = async (data: ServiceFormData) => {
    try {
      setLoading(true)

      const serviceData = {
        ...data,
        description: data.description || null,
        resources_needed: resources,
        company_id: company!.id,
      }

      let serviceId: string

      if (isEditing && initialData?.id) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', initialData.id)
          .eq('company_id', company!.id)

        if (error) throw error
        serviceId = initialData.id
        toast.success('Serviço atualizado com sucesso!')
      } else {
        const { data: newService, error } = await supabase
          .from('services')
          .insert([serviceData])
          .select('id')
          .single()

        if (error) throw error
        serviceId = newService.id
        toast.success('Serviço cadastrado com sucesso!')
      }

      // Salvar fotos
      if (photos.length > 0) {
        // Remover fotos antigas se estiver editando
        if (isEditing) {
          await supabase
            .from('service_photos')
            .delete()
            .eq('service_id', serviceId)
        }

        // Inserir novas fotos
        const photoData = photos.map((photo, index) => ({
          service_id: serviceId,
          url: photo.url,
          is_primary: photo.is_primary || index === 0,
          company_id: company!.id,
        }))

        const { error: photoError } = await supabase
          .from('service_photos')
          .insert(photoData)

        if (photoError) throw photoError
      }

      router.push('/services')
    } catch (error: any) {
      console.error('Erro ao salvar serviço:', error)
      toast.error(error.message || 'Erro ao salvar serviço')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotosChange = (newPhotos: { url: string; is_primary: boolean }[]) => {
    setPhotos(newPhotos)
  }

  const addResource = () => {
    if (newResource.trim() && !resources.includes(newResource.trim())) {
      const updatedResources = [...resources, newResource.trim()]
      setResources(updatedResources)
      setValue('resources_needed', updatedResources)
      setNewResource('')
    }
  }

  const removeResource = (resource: string) => {
    const updatedResources = resources.filter(r => r !== resource)
    setResources(updatedResources)
    setValue('resources_needed', updatedResources)
  }

  const categoryOptions = [
    { value: 'grooming', label: 'Estética e Higiene' },
    { value: 'veterinary', label: 'Veterinário' },
    { value: 'boarding', label: 'Hospedagem' },
    { value: 'training', label: 'Adestramento' },
    { value: 'other', label: 'Outros' },
  ]

  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Photos Upload */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fotos do Serviço
              </label>
              <MultiImageUpload
                images={photos}
                onChange={handlePhotosChange}
                maxImages={5}
                folder={`services/${company!.id}`}
              />
            </div>

            {/* Name */}
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome do Serviço *
              </label>
              <input
                type="text"
                id="name"
                {...register('name')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Ex: Banho e Tosa, Consulta Veterinária"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descrição
              </label>
              <textarea
                id="description"
                rows={3}
                {...register('description')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Descreva o serviço, o que está incluído, etc."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Categoria *
              </label>
              <select
                id="category"
                {...register('category')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor do Serviço *
              </label>
              <ColorPicker
                value={watch('color')}
                onChange={(color) => setValue('color', color)}
                predefinedColors={predefinedColors}
              />
              {errors.color && (
                <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Preço (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                id="price"
                {...register('price', { valueAsNumber: true })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="0,00"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                Duração (minutos) *
              </label>
              <input
                type="number"
                id="duration"
                {...register('duration', { valueAsNumber: true })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="60"
              />
              {errors.duration && (
                <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
              )}
            </div>

            {/* Requires Pet */}
            <div className="sm:col-span-2">
              <div className="flex items-center">
                <input
                  id="requires_pet"
                  type="checkbox"
                  {...register('requires_pet')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="requires_pet" className="ml-2 block text-sm text-gray-900">
                  Este serviço requer um pet específico
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Desmarque se o serviço não for específico para um pet (ex: consulta geral)
              </p>
            </div>

            {/* Max Pets Per Session */}
            <div>
              <label htmlFor="max_pets_per_session" className="block text-sm font-medium text-gray-700">
                Máximo de Pets por Sessão
              </label>
              <input
                type="number"
                min="1"
                id="max_pets_per_session"
                {...register('max_pets_per_session', { valueAsNumber: true })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {errors.max_pets_per_session && (
                <p className="mt-1 text-sm text-red-600">{errors.max_pets_per_session.message}</p>
              )}
            </div>

            {/* Preparation Time */}
            <div>
              <label htmlFor="preparation_time" className="block text-sm font-medium text-gray-700">
                Tempo de Preparação (min)
              </label>
              <input
                type="number"
                min="0"
                id="preparation_time"
                {...register('preparation_time', { valueAsNumber: true })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="0"
              />
              {errors.preparation_time && (
                <p className="mt-1 text-sm text-red-600">{errors.preparation_time.message}</p>
              )}
            </div>

            {/* Cleanup Time */}
            <div>
              <label htmlFor="cleanup_time" className="block text-sm font-medium text-gray-700">
                Tempo de Limpeza (min)
              </label>
              <input
                type="number"
                min="0"
                id="cleanup_time"
                {...register('cleanup_time', { valueAsNumber: true })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="0"
              />
              {errors.cleanup_time && (
                <p className="mt-1 text-sm text-red-600">{errors.cleanup_time.message}</p>
              )}
            </div>

            {/* Resources Needed */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recursos Necessários
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newResource}
                  onChange={(e) => setNewResource(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addResource())}
                  className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Ex: Mesa de tosa, Secador, Produtos específicos"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addResource}
                  disabled={!newResource.trim()}
                >
                  Adicionar
                </Button>
              </div>
              {resources.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {resources.map((resource, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      {resource}
                      <button
                        type="button"
                        onClick={() => removeResource(resource)}
                        className="ml-1 text-primary-600 hover:text-primary-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {isEditing ? 'Atualizar Serviço' : 'Cadastrar Serviço'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
```

### 3. Componentes de Listagem e Filtros

#### 3.1 Lista de Serviços
```typescript
// src/components/services/services-list.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Service } from '@/app/(dashboard)/services/page'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface ServicesListProps {
  services: Service[]
  loading: boolean
  onDelete: (serviceId: string) => void
  onRestore: (serviceId: string) => void
  onDuplicate: (service: Service) => void
  onRefresh: () => void
}

export function ServicesList({ 
  services, 
  loading, 
  onDelete, 
  onRestore, 
  onDuplicate, 
  onRefresh 
}: ServicesListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const handleDeleteClick = (serviceId: string) => {
    setSelectedServiceId(serviceId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedServiceId) {
      onDelete(selectedServiceId)
      setDeleteDialogOpen(false)
      setSelectedServiceId(null)
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'grooming': return 'Estética e Higiene'
      case 'veterinary': return 'Veterinário'
      case 'boarding': return 'Hospedagem'
      case 'training': return 'Adestramento'
      default: return 'Outros'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'grooming': return '✂️'
      case 'veterinary': return '🏥'
      case 'boarding': return '🏠'
      case 'training': return '🎓'
      default: return '🛠️'
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center">
            <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum serviço encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece cadastrando o primeiro serviço.
            </p>
            <div className="mt-6">
              <Link href="/services/new">
                <Button>
                  <WrenchScrewdriverIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Novo Serviço
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        {/* Header com controles */}
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {services.length} serviço{services.length !== 1 ? 's' : ''} encontrado{services.length !== 1 ? 's' : ''}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={onRefresh}
                className="p-2 text-gray-400 hover:text-gray-500"
                title="Atualizar"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={clsx(
                    'px-3 py-2 text-sm font-medium rounded-l-md border',
                    viewMode === 'grid'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  )}
                >
                  Grade
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={clsx(
                    'px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b',
                    viewMode === 'table'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  )}
                >
                  Tabela
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="px-4 py-5 sm:p-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onDelete={() => handleDeleteClick(service.id)}
                  onRestore={() => onRestore(service.id)}
                  onDuplicate={() => onDuplicate(service)}
                  getCategoryLabel={getCategoryLabel}
                  getCategoryIcon={getCategoryIcon}
                />
              ))}
            </div>
          ) : (
            <ServiceTable
              services={services}
              onDelete={handleDeleteClick}
              onRestore={onRestore}
              onDuplicate={onDuplicate}
              getCategoryLabel={getCategoryLabel}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remover Serviço"
        description="Tem certeza que deseja remover este serviço? Esta ação pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  )
}

function ServiceCard({ service, onDelete, onRestore, onDuplicate, getCategoryLabel, getCategoryIcon }: any) {
  const primaryPhoto = service.photos?.find((p: any) => p.is_primary) || service.photos?.[0]

  return (
    <div className={clsx(
      'relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400',
      !service.is_active && 'opacity-60 bg-gray-50'
    )}>
      {/* Status indicator */}
      <div className="absolute top-4 right-4">
        <span className={clsx(
          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
          service.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        )}>
          {service.is_active ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {/* Color indicator */}
      <div 
        className="absolute top-0 left-0 w-full h-2 rounded-t-lg"
        style={{ backgroundColor: service.color }}
      ></div>

      <div className="flex items-center space-x-3 mt-2">
        <div className="flex-shrink-0">
          {primaryPhoto ? (
            <img
              className="h-16 w-16 rounded-lg object-cover"
              src={primaryPhoto.url}
              alt={service.name}
            />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">
                {getCategoryIcon(service.category)}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-medium text-gray-900 truncate">
            {service.name}
          </p>
          <p className="text-sm text-gray-500">
            {getCategoryLabel(service.category)}
          </p>
          {service.description && (
            <p className="text-xs text-gray-400 truncate">
              {service.description}
            </p>
          )}
        </div>
      </div>

      {/* Service Info */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex items-center text-sm text-gray-500">
          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
          <span>{new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(service.price)}</span>
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <ClockIcon className="h-4 w-4 mr-1" />
          <span>{service.duration} min</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 text-center">
        <p className="text-lg font-semibold text-gray-900">
          {service._count?.appointments || 0}
        </p>
        <p className="text-xs text-gray-500">Agendamentos</p>
      </div>

      {/* Actions */}
      <div className="mt-4 flex justify-between">
        <div className="flex space-x-2">
          <Link href={`/services/${service.id}`}>
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <EyeIcon className="h-4 w-4" />
            </button>
          </Link>
          <Link href={`/services/${service.id}/edit`}>
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <PencilIcon className="h-4 w-4" />
            </button>
          </Link>
          <button
            onClick={onDuplicate}
            className="p-2 text-gray-400 hover:text-gray-500"
            title="Duplicar serviço"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </button>
        </div>
        <div>
          {service.is_active ? (
            <button
              onClick={onDelete}
              className="p-2 text-red-400 hover:text-red-500"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onRestore}
              className="p-2 text-green-400 hover:text-green-500"
              title="Restaurar serviço"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        Criado em {format(new Date(service.created_at), 'dd/MM/yyyy', { locale: ptBR })}
      </div>
    </div>
  )
}

function ServiceTable({ services, onDelete, onRestore, onDuplicate, getCategoryLabel }: any) {
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Serviço
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Categoria
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Preço
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Duração
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="relative px-6 py-3">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {services.map((service: Service) => {
            const primaryPhoto = service.photos?.find(p => p.is_primary) || service.photos?.[0]
            
            return (
              <tr key={service.id} className={clsx(!service.is_active && 'opacity-60 bg-gray-50')}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      {primaryPhoto ? (
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={primaryPhoto.url}
                          alt={service.name}
                        />
                      ) : (
                        <div 
                          className="h-12 w-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: service.color + '20' }}
                        >
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: service.color }}
                          ></div>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {service.name}
                      </div>
                      {service.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {service.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getCategoryLabel(service.category)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(service.price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {service.duration} min
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={clsx(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    service.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  )}>
                    {service.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Link href={`/services/${service.id}`}>
                      <button className="text-primary-600 hover:text-primary-900">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </Link>
                    <Link href={`/services/${service.id}/edit`}>
                      <button className="text-primary-600 hover:text-primary-900">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </Link>
                    <button
                      onClick={() => onDuplicate(service)}
                      className="text-primary-600 hover:text-primary-900"
                      title="Duplicar serviço"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    {service.is_active ? (
                      <button
                        onClick={() => onDelete(service.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onRestore(service.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Restaurar serviço"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

## ✅ Critérios de Aceitação

- [ ] CRUD completo de serviços implementado
- [ ] Categorização de serviços funcionando
- [ ] Sistema de cores para identificação
- [ ] Upload múltiplo de fotos implementado
- [ ] Configuração de duração e preços
- [ ] Sistema de recursos necessários
- [ ] Filtros por categoria e status
- [ ] Visualização em grid e tabela
- [ ] Funcionalidade de duplicar serviços
- [ ] Soft delete (inativação) funcionando
- [ ] Responsividade implementada
- [ ] Integração com Supabase funcionando

## 🔄 Próximos Passos

Após completar esta fase:
1. **Fase 08**: Implementar módulo financeiro
2. Criar sistema de pacotes/combos
3. Implementar promoções e descontos
4. Adicionar avaliações de serviços

## 📝 Notas Importantes

- Implementar validação de preços
- Adicionar suporte para serviços sazonais
- Configurar notificações de recursos indisponíveis
- Implementar histórico de alterações de preços
- Otimizar carregamento de fotos
- Adicionar templates de serviços populares
- Implementar sistema de avaliação de qualidade
- Criar relatórios de performance por serviço

---

**Tempo estimado: 4-5 dias**  
**Complexidade: Média**  
**Dependências: Fases anteriores concluídas**