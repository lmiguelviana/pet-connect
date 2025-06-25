# 🐕 Fase 05 - Gestão de Pets

## 📋 Objetivos da Fase

- Implementar CRUD completo de pets
- Criar formulários de cadastro e edição com sistema de fotos por plano
- **Todos os Planos**: Apenas 1 foto por pet no cadastro
- Implementar listagem com filtros avançados
- Adicionar sistema de fichas médicas
- Criar histórico de serviços do pet
- Implementar alertas de vacinação e medicamentos

## ⏱️ Estimativa: 5-6 dias

## 🛠️ Tarefas Detalhadas

### 1. Estrutura Base do Módulo de Pets

#### 1.1 Página Principal de Pets
```typescript
// src/app/(dashboard)/pets/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { PetsList } from '@/components/pets/pets-list'
import { PetsFilters } from '@/components/pets/pets-filters'
import { PetsStats } from '@/components/pets/pets-stats'
import { Button } from '@/components/ui/button'
import { PlusIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export interface Pet {
  id: string
  name: string
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'
  breed: string
  gender: 'male' | 'female'
  birth_date: string | null
  weight: number | null
  color: string
  microchip: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  client_id: string
  company_id: string
  client: {
    id: string
    name: string
    phone: string
  }
  photos: {
    id: string
    url: string
    is_primary: boolean
  }[]
  _count?: {
    appointments: number
    medical_records: number
  }
}

export default function PetsPage() {
  const { company } = useAuth()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [speciesFilter, setSpeciesFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'birth_date'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadPets()
    }
  }, [company?.id, searchQuery, speciesFilter, clientFilter, statusFilter, sortBy, sortOrder])

  const loadPets = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('pets')
        .select(`
          *,
          client:clients!inner(
            id,
            name,
            phone
          ),
          photos:pet_photos(
            id,
            url,
            is_primary
          ),
          appointments:appointments(count),
          medical_records:medical_records(count)
        `)
        .eq('company_id', company!.id)

      // Aplicar filtros
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active')
      }

      if (speciesFilter !== 'all') {
        query = query.eq('species', speciesFilter)
      }

      if (clientFilter !== 'all') {
        query = query.eq('client_id', clientFilter)
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,breed.ilike.%${searchQuery}%,microchip.ilike.%${searchQuery}%`)
      }

      // Aplicar ordenação
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error } = await query

      if (error) throw error

      // Processar contagens
      const processedPets = data?.map(pet => ({
        ...pet,
        _count: {
          appointments: pet.appointments?.[0]?.count || 0,
          medical_records: pet.medical_records?.[0]?.count || 0,
        }
      })) || []

      setPets(processedPets)
    } catch (error) {
      console.error('Erro ao carregar pets:', error)
      toast.error('Erro ao carregar pets')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePet = async (petId: string) => {
    try {
      const { error } = await supabase
        .from('pets')
        .update({ is_active: false })
        .eq('id', petId)
        .eq('company_id', company!.id)

      if (error) throw error

      toast.success('Pet removido com sucesso')
      loadPets()
    } catch (error) {
      console.error('Erro ao remover pet:', error)
      toast.error('Erro ao remover pet')
    }
  }

  const handleRestorePet = async (petId: string) => {
    try {
      const { error } = await supabase
        .from('pets')
        .update({ is_active: true })
        .eq('id', petId)
        .eq('company_id', company!.id)

      if (error) throw error

      toast.success('Pet restaurado com sucesso')
      loadPets()
    } catch (error) {
      console.error('Erro ao restaurar pet:', error)
      toast.error('Erro ao restaurar pet')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
            Pets
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie todos os pets cadastrados no sistema
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link href="/pets/new">
            <Button className="inline-flex items-center">
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Novo Pet
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <PetsStats pets={pets} loading={loading} />

      {/* Filters */}
      <PetsFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        speciesFilter={speciesFilter}
        onSpeciesFilterChange={setSpeciesFilter}
        clientFilter={clientFilter}
        onClientFilterChange={setClientFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      {/* Pets List */}
      <PetsList
        pets={pets}
        loading={loading}
        onDelete={handleDeletePet}
        onRestore={handleRestorePet}
        onRefresh={loadPets}
      />
    </div>
  )
}
```

#### 1.2 Componente de Estatísticas dos Pets
```typescript
// src/components/pets/pets-stats.tsx
import { Pet } from '@/app/(dashboard)/pets/page'
import { HeartIcon, CakeIcon, ScaleIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

interface PetsStatsProps {
  pets: Pet[]
  loading: boolean
}

export function PetsStats({ pets, loading }: PetsStatsProps) {
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

  const totalPets = pets.filter(pet => pet.is_active).length
  const totalDogs = pets.filter(pet => pet.species === 'dog' && pet.is_active).length
  const totalCats = pets.filter(pet => pet.species === 'cat' && pet.is_active).length
  const averageAge = pets.filter(pet => pet.birth_date && pet.is_active).length > 0 
    ? Math.round(
        pets
          .filter(pet => pet.birth_date && pet.is_active)
          .reduce((sum, pet) => {
            const age = new Date().getFullYear() - new Date(pet.birth_date!).getFullYear()
            return sum + age
          }, 0) / pets.filter(pet => pet.birth_date && pet.is_active).length
      )
    : 0

  const stats = [
    {
      name: 'Total de Pets',
      value: totalPets,
      icon: HeartIcon,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: 'Cães',
      value: totalDogs,
      icon: HeartIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: `${Math.round((totalDogs / totalPets) * 100) || 0}%`,
      changeType: 'neutral',
    },
    {
      name: 'Gatos',
      value: totalCats,
      icon: HeartIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: `${Math.round((totalCats / totalPets) * 100) || 0}%`,
      changeType: 'neutral',
    },
    {
      name: 'Idade Média',
      value: `${averageAge} anos`,
      icon: CakeIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '',
      changeType: 'neutral',
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
                    {stat.change && (
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-gray-600">
                        {stat.change}
                      </div>
                    )}
                  </dd>
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

### 2. Formulário de Cadastro/Edição de Pets

#### 2.1 Página de Novo Pet
```typescript
// src/app/(dashboard)/pets/new/page.tsx
'use client'

import { PetForm } from '@/components/pets/pet-form'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function NewPetPage() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client_id')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/pets"
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Voltar para pets
        </Link>
      </div>

      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
            Novo Pet
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Cadastre um novo pet no sistema
          </p>
        </div>
      </div>

      {/* Form */}
      <PetForm preSelectedClientId={clientId} />
    </div>
  )
}
```

#### 2.2 Componente do Formulário de Pet
```typescript
// src/components/pets/pet-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { MultiImageUpload } from '@/components/ui/multi-image-upload'
import { ClientSelector } from '@/components/ui/client-selector'
import { toast } from 'react-hot-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const petSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other'], {
    required_error: 'Selecione uma espécie',
  }),
  breed: z.string().min(2, 'Raça deve ter pelo menos 2 caracteres'),
  gender: z.enum(['male', 'female'], {
    required_error: 'Selecione o sexo',
  }),
  birth_date: z.string().optional(),
  weight: z.number().positive('Peso deve ser positivo').optional(),
  color: z.string().min(2, 'Cor deve ter pelo menos 2 caracteres'),
  microchip: z.string().optional(),
  notes: z.string().optional(),
  client_id: z.string().min(1, 'Selecione um cliente'),
})

type PetFormData = z.infer<typeof petSchema>

interface PetFormProps {
  initialData?: Partial<PetFormData & { id: string; photos: { id: string; url: string; is_primary: boolean }[] }>
  isEditing?: boolean
  preSelectedClientId?: string | null
}

export function PetForm({ initialData, isEditing = false, preSelectedClientId }: PetFormProps) {
  const router = useRouter()
  const { company } = useAuth()
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState<{ url: string; is_primary: boolean }[]>(
    initialData?.photos?.map(p => ({ url: p.url, is_primary: p.is_primary })) || []
  )
  
  // Verificar limitações do plano
  const maxPhotos = 1 // Apenas 1 foto por pet em todos os planos
  const canAddMorePhotos = photos.length < maxPhotos
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: initialData?.name || '',
      species: initialData?.species || 'dog',
      breed: initialData?.breed || '',
      gender: initialData?.gender || 'male',
      birth_date: initialData?.birth_date || '',
      weight: initialData?.weight || undefined,
      color: initialData?.color || '',
      microchip: initialData?.microchip || '',
      notes: initialData?.notes || '',
      client_id: preSelectedClientId || initialData?.client_id || '',
    },
  })

  // Set pre-selected client
  useEffect(() => {
    if (preSelectedClientId) {
      setValue('client_id', preSelectedClientId)
    }
  }, [preSelectedClientId, setValue])

  const onSubmit = async (data: PetFormData) => {
    try {
      setLoading(true)

      const petData = {
        ...data,
        weight: data.weight || null,
        birth_date: data.birth_date || null,
        microchip: data.microchip || null,
        notes: data.notes || null,
        company_id: company!.id,
      }

      let petId: string

      if (isEditing && initialData?.id) {
        const { error } = await supabase
          .from('pets')
          .update(petData)
          .eq('id', initialData.id)
          .eq('company_id', company!.id)

        if (error) throw error
        petId = initialData.id
        toast.success('Pet atualizado com sucesso!')
      } else {
        const { data: newPet, error } = await supabase
          .from('pets')
          .insert([petData])
          .select('id')
          .single()

        if (error) throw error
        petId = newPet.id
        toast.success('Pet cadastrado com sucesso!')
      }

      // Salvar fotos
      if (photos.length > 0) {
        // Remover fotos antigas se estiver editando
        if (isEditing) {
          await supabase
            .from('pet_photos')
            .delete()
            .eq('pet_id', petId)
        }

        // Inserir novas fotos
        const photoData = photos.map((photo, index) => ({
          pet_id: petId,
          url: photo.url,
          is_primary: photo.is_primary || index === 0,
          company_id: company!.id,
        }))

        const { error: photoError } = await supabase
          .from('pet_photos')
          .insert(photoData)

        if (photoError) throw photoError
      }

      router.push('/pets')
    } catch (error: any) {
      console.error('Erro ao salvar pet:', error)
      toast.error(error.message || 'Erro ao salvar pet')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotosChange = (newPhotos: { url: string; is_primary: boolean }[]) => {
    setPhotos(newPhotos)
  }

  const speciesOptions = [
    { value: 'dog', label: 'Cão' },
    { value: 'cat', label: 'Gato' },
    { value: 'bird', label: 'Ave' },
    { value: 'rabbit', label: 'Coelho' },
    { value: 'other', label: 'Outro' },
  ]

  const genderOptions = [
    { value: 'male', label: 'Macho' },
    { value: 'female', label: 'Fêmea' },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Client Selection */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <ClientSelector
                value={watch('client_id')}
                onChange={(clientId) => setValue('client_id', clientId)}
                disabled={!!preSelectedClientId}
              />
              {errors.client_id && (
                <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>
              )}
            </div>

            {/* Photos Upload */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fotos do Pet
              </label>
              <MultiImageUpload
                images={photos}
                onChange={handlePhotosChange}
                maxImages={5}
                folder={`pets/${company!.id}`}
              />
            </div>

            {/* Name */}
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome do Pet *
              </label>
              <input
                type="text"
                id="name"
                {...register('name')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Digite o nome do pet"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Species */}
            <div>
              <label htmlFor="species" className="block text-sm font-medium text-gray-700">
                Espécie *
              </label>
              <select
                id="species"
                {...register('species')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                {speciesOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.species && (
                <p className="mt-1 text-sm text-red-600">{errors.species.message}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                Sexo *
              </label>
              <select
                id="gender"
                {...register('gender')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>

            {/* Breed */}
            <div>
              <label htmlFor="breed" className="block text-sm font-medium text-gray-700">
                Raça *
              </label>
              <input
                type="text"
                id="breed"
                {...register('breed')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Ex: Labrador, Persa, etc."
              />
              {errors.breed && (
                <p className="mt-1 text-sm text-red-600">{errors.breed.message}</p>
              )}
            </div>

            {/* Color */}
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                Cor *
              </label>
              <input
                type="text"
                id="color"
                {...register('color')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Ex: Marrom, Preto e branco, etc."
              />
              {errors.color && (
                <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>
              )}
            </div>

            {/* Birth Date */}
            <div>
              <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
                Data de Nascimento
              </label>
              <input
                type="date"
                id="birth_date"
                {...register('birth_date')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {errors.birth_date && (
                <p className="mt-1 text-sm text-red-600">{errors.birth_date.message}</p>
              )}
            </div>

            {/* Weight */}
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.1"
                id="weight"
                {...register('weight', { valueAsNumber: true })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Ex: 5.5"
              />
              {errors.weight && (
                <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
              )}
            </div>

            {/* Microchip */}
            <div className="sm:col-span-2">
              <label htmlFor="microchip" className="block text-sm font-medium text-gray-700">
                Microchip
              </label>
              <input
                type="text"
                id="microchip"
                {...register('microchip')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Número do microchip"
              />
              {errors.microchip && (
                <p className="mt-1 text-sm text-red-600">{errors.microchip.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Observações
              </label>
              <textarea
                id="notes"
                rows={3}
                {...register('notes')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Informações adicionais sobre o pet, temperamento, cuidados especiais, etc."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
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
              {isEditing ? 'Atualizar Pet' : 'Cadastrar Pet'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
```

### 3. Componentes de Listagem e Filtros

#### 3.1 Lista de Pets
```typescript
// src/components/pets/pets-list.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Pet } from '@/app/(dashboard)/pets/page'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  PhoneIcon,
  UserIcon,
  HeartIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface PetsListProps {
  pets: Pet[]
  loading: boolean
  onDelete: (petId: string) => void
  onRestore: (petId: string) => void
  onRefresh: () => void
}

export function PetsList({ pets, loading, onDelete, onRestore, onRefresh }: PetsListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const handleDeleteClick = (petId: string) => {
    setSelectedPetId(petId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedPetId) {
      onDelete(selectedPetId)
      setDeleteDialogOpen(false)
      setSelectedPetId(null)
    }
  }

  const getSpeciesEmoji = (species: string) => {
    switch (species) {
      case 'dog': return '🐕'
      case 'cat': return '🐱'
      case 'bird': return '🐦'
      case 'rabbit': return '🐰'
      default: return '🐾'
    }
  }

  const getSpeciesLabel = (species: string) => {
    switch (species) {
      case 'dog': return 'Cão'
      case 'cat': return 'Gato'
      case 'bird': return 'Ave'
      case 'rabbit': return 'Coelho'
      default: return 'Outro'
    }
  }

  const getGenderLabel = (gender: string) => {
    return gender === 'male' ? 'Macho' : 'Fêmea'
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
    
    if (ageInMonths < 12) {
      return `${ageInMonths} meses`
    } else {
      const years = Math.floor(ageInMonths / 12)
      const months = ageInMonths % 12
      return months > 0 ? `${years}a ${months}m` : `${years} anos`
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

  if (pets.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center">
            <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum pet encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece cadastrando o primeiro pet.
            </p>
            <div className="mt-6">
              <Link href="/pets/new">
                <Button>
                  <HeartIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Novo Pet
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
              {pets.length} pet{pets.length !== 1 ? 's' : ''} encontrado{pets.length !== 1 ? 's' : ''}
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
              {pets.map((pet) => (
                <PetCard
                  key={pet.id}
                  pet={pet}
                  onDelete={() => handleDeleteClick(pet.id)}
                  onRestore={() => onRestore(pet.id)}
                  getSpeciesEmoji={getSpeciesEmoji}
                  getSpeciesLabel={getSpeciesLabel}
                  getGenderLabel={getGenderLabel}
                  calculateAge={calculateAge}
                />
              ))}
            </div>
          ) : (
            <PetTable
              pets={pets}
              onDelete={handleDeleteClick}
              onRestore={onRestore}
              getSpeciesLabel={getSpeciesLabel}
              getGenderLabel={getGenderLabel}
              calculateAge={calculateAge}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remover Pet"
        description="Tem certeza que deseja remover este pet? Esta ação pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  )
}

function PetCard({ pet, onDelete, onRestore, getSpeciesEmoji, getSpeciesLabel, getGenderLabel, calculateAge }: any) {
  const primaryPhoto = pet.photos?.find((p: any) => p.is_primary) || pet.photos?.[0]

  return (
    <div className={clsx(
      'relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400',
      !pet.is_active && 'opacity-60 bg-gray-50'
    )}>
      {/* Status indicator */}
      <div className="absolute top-4 right-4">
        <span className={clsx(
          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
          pet.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        )}>
          {pet.is_active ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {primaryPhoto ? (
            <img
              className="h-16 w-16 rounded-lg object-cover"
              src={primaryPhoto.url}
              alt={pet.name}
            />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-primary-100 flex items-center justify-center">
              <span className="text-2xl">
                {getSpeciesEmoji(pet.species)}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-medium text-gray-900 truncate">
            {pet.name}
          </p>
          <p className="text-sm text-gray-500">
            {getSpeciesLabel(pet.species)} • {getGenderLabel(pet.gender)}
          </p>
          <p className="text-sm text-gray-500">
            {pet.breed} • {pet.color}
          </p>
          {pet.birth_date && (
            <p className="text-xs text-gray-400">
              {calculateAge(pet.birth_date)}
            </p>
          )}
        </div>
      </div>

      {/* Client Info */}
      <div className="mt-4 flex items-center text-sm text-gray-500">
        <UserIcon className="h-4 w-4 mr-1" />
        <span className="truncate">{pet.client.name}</span>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">
            {pet._count?.appointments || 0}
          </p>
          <p className="text-xs text-gray-500">Agendamentos</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">
            {pet.weight ? `${pet.weight}kg` : '-'}
          </p>
          <p className="text-xs text-gray-500">Peso</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex justify-between">
        <div className="flex space-x-2">
          <Link href={`/pets/${pet.id}`}>
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <EyeIcon className="h-4 w-4" />
            </button>
          </Link>
          <Link href={`/pets/${pet.id}/edit`}>
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <PencilIcon className="h-4 w-4" />
            </button>
          </Link>
        </div>
        <div>
          {pet.is_active ? (
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
              title="Restaurar pet"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        Cadastrado em {format(new Date(pet.created_at), 'dd/MM/yyyy', { locale: ptBR })}
      </div>
    </div>
  )
}

function PetTable({ pets, onDelete, onRestore, getSpeciesLabel, getGenderLabel, calculateAge }: any) {
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pet
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Espécie/Raça
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Idade
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
          {pets.map((pet: Pet) => {
            const primaryPhoto = pet.photos?.find(p => p.is_primary) || pet.photos?.[0]
            
            return (
              <tr key={pet.id} className={clsx(!pet.is_active && 'opacity-60 bg-gray-50')}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      {primaryPhoto ? (
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={primaryPhoto.url}
                          alt={pet.name}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
                          <span className="text-lg">
                            {pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐱' : '🐾'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {pet.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getGenderLabel(pet.gender)} • {pet.color}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{pet.client.name}</div>
                  <div className="text-sm text-gray-500">{pet.client.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{getSpeciesLabel(pet.species)}</div>
                  <div className="text-sm text-gray-500">{pet.breed}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {pet.birth_date ? calculateAge(pet.birth_date) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={clsx(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    pet.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  )}>
                    {pet.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Link href={`/pets/${pet.id}`}>
                      <button className="text-primary-600 hover:text-primary-900">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </Link>
                    <Link href={`/pets/${pet.id}/edit`}>
                      <button className="text-primary-600 hover:text-primary-900">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </Link>
                    {pet.is_active ? (
                      <button
                        onClick={() => onDelete(pet.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onRestore(pet.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Restaurar pet"
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

- [ ] CRUD completo de pets implementado
- [ ] Listagem com filtros avançados funcionando
- [ ] Formulário de cadastro/edição com validações
- [ ] Upload múltiplo de fotos implementado
- [ ] Associação com clientes funcionando
- [ ] Cálculo automático de idade
- [ ] Filtros por espécie, cliente e status
- [ ] Visualização em grid e tabela
- [ ] Soft delete (inativação) funcionando
- [ ] Responsividade implementada
- [ ] Integração com Supabase funcionando

## 🔄 Próximos Passos

Após completar esta fase:
1. **Fase 06**: Implementar sistema de agendamentos
2. Criar página de detalhes do pet
3. Implementar ficha médica
4. Adicionar alertas de vacinação

## 📸 Sistema de Fotos

### Upload Simplificado

```typescript
// src/components/pets/photo-upload.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface PhotoUploadProps {
  photos: { url: string; is_primary: boolean }[]
  onPhotosChange: (photos: { url: string; is_primary: boolean }[]) => void
  maxPhotos?: number
}

export function PhotoUpload({ photos, onPhotosChange, maxPhotos }: PhotoUploadProps) {
  const { company } = useAuth()
  const [uploading, setUploading] = useState(false)
  
  // Limite fixo de 1 foto por pet
  const photoLimit = 1
  const canAddMore = photos.length < photoLimit
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    
    if (!canAddMore) {
      toast.error('Limite de 1 foto por pet atingido!')
      return
    }
    
    try {
      setUploading(true)
      
      const newPhotos = [...photos]
      
      for (let i = 0; i < files.length && newPhotos.length < photoLimit; i++) {
        const file = files[i]
        
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
          toast.error('Apenas imagens são permitidas')
          continue
        }
        
        // Validar tamanho (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Imagem muito grande. Máximo 5MB')
          continue
        }
        
        // Upload para Supabase Storage
        const fileName = `${Date.now()}-${file.name}`
        const { data, error } = await supabase.storage
          .from('pet-photos')
          .upload(fileName, file)
          
        if (error) throw error
        
        const { data: { publicUrl } } = supabase.storage
          .from('pet-photos')
          .getPublicUrl(fileName)
          
        newPhotos.push({
          url: publicUrl,
          is_primary: newPhotos.length === 0
        })
      }
      
      onPhotosChange(newPhotos)
      toast.success('Fotos enviadas com sucesso!')
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao enviar fotos')
    } finally {
      setUploading(false)
    }
  }
  
  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    // Se removeu a foto principal, definir a primeira como principal
    if (newPhotos.length > 0 && photos[index].is_primary) {
      newPhotos[0].is_primary = true
    }
    onPhotosChange(newPhotos)
  }
  
  const setPrimaryPhoto = (index: number) => {
    const newPhotos = photos.map((photo, i) => ({
      ...photo,
      is_primary: i === index
    }))
    onPhotosChange(newPhotos)
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Fotos do Pet
        </label>
        <div className="text-xs text-gray-500">
          {photos.length}/{photoLimit} fotos
          {company?.plan_type === 'free' && (
            <span className="ml-2 text-amber-600">
              (Upgrade para Premium para mais fotos)
            </span>
          )}
        </div>
      </div>
      
      {/* Grid de fotos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="relative group">
            <img
              src={photo.url}
              alt={`Foto ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
            />
            
            {/* Badge de foto principal */}
            {photo.is_primary && (
              <div className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                Principal
              </div>
            )}
            
            {/* Botões de ação */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => removePhoto(index)}
                className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            
            {/* Botão para definir como principal */}
            {!photo.is_primary && (
              <button
                onClick={() => setPrimaryPhoto(index)}
                className="absolute bottom-2 left-2 bg-gray-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Definir como principal
              </button>
            )}
          </div>
        ))}
        
        {/* Botão de adicionar foto */}
        {canAddMore && (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <PhotoIcon className="h-8 w-8 text-gray-400" />
              <p className="text-xs text-gray-500 mt-1">
                {uploading ? 'Enviando...' : 'Adicionar foto'}
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple={company?.plan_type === 'premium'}
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>
      
      {/* Aviso sobre limitações do plano */}
      {!canAddMore && company?.plan_type === 'free' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                Limite do Plano Gratuito Atingido
              </h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  O plano gratuito permite apenas 1 foto por pet. 
                  Faça upgrade para o plano Premium e tenha:
                </p>
                <ul className="list-disc list-inside mt-1">
                  <li>Até 10 fotos por pet</li>
                  <li>Galeria completa de fotos</li>
                  <li>Compartilhamento automático via WhatsApp</li>
                </ul>
              </div>
              <div className="mt-3">
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                  Fazer Upgrade
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### Galeria Premium

```typescript
// src/components/pets/pet-photo-gallery.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface PetPhotoGalleryProps {
  photos: { id: string; url: string; caption?: string; created_at: string }[]
  petName: string
}

export function PetPhotoGallery({ photos, petName }: PetPhotoGalleryProps) {
  const { company } = useAuth()
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  
  // Como todos os planos têm apenas 1 foto, mostrar todas as fotos disponíveis
  const displayPhotos = photos
  
  const openLightbox = (index: number) => {
    setSelectedPhoto(index)
    setIsOpen(true)
  }
  
  const nextPhoto = () => {
    if (selectedPhoto !== null && selectedPhoto < displayPhotos.length - 1) {
      setSelectedPhoto(selectedPhoto + 1)
    }
  }
  
  const prevPhoto = () => {
    if (selectedPhoto !== null && selectedPhoto > 0) {
      setSelectedPhoto(selectedPhoto - 1)
    }
  }
  
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative cursor-pointer group"
            onClick={() => openLightbox(index)}
          >
            <img
              src={photo.url}
              alt={`${petName} - Foto ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg" />
          </div>
        ))}
        
        {/* Como todos os planos têm apenas 1 foto, não há necessidade de indicador premium */}
      </div>
      
      {/* Lightbox Modal */}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black bg-opacity-75" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="relative max-w-4xl max-h-full">
            {selectedPhoto !== null && (
              <>
                <img
                  src={displayPhotos[selectedPhoto].url}
                  alt={`${petName} - Foto ${selectedPhoto + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* Botão fechar */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 text-white hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
                
                {/* Navegação */}
                {displayPhotos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      disabled={selectedPhoto === 0}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-50"
                    >
                      <ChevronLeftIcon className="h-8 w-8" />
                    </button>
                    
                    <button
                      onClick={nextPhoto}
                      disabled={selectedPhoto === displayPhotos.length - 1}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-50"
                    >
                      <ChevronRightIcon className="h-8 w-8" />
                    </button>
                  </>
                )}
                
                {/* Contador */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                  {selectedPhoto + 1} de {displayPhotos.length}
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  )
}
```

## 📝 Notas Importantes

- **Todos os Planos**: Limitado a 1 foto por pet no cadastro
- Implementar validação de peso e idade
- Adicionar suporte para mais espécies
- Configurar compressão automática de imagens
- Implementar busca por microchip
- Otimizar carregamento de fotos
- Adicionar histórico médico básico
- Implementar QR Code para identificação
- Sistema de compartilhamento de fotos via WhatsApp (Premium)
- Backup automático de fotos no Supabase Storage

---

**Tempo estimado: 5-6 dias**  
**Complexidade: Média-Alta**  
**Dependências: Fase 04 concluída**