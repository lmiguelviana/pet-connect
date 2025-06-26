'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PlusIcon, HeartIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { toast } from 'sonner'
import { Database } from '@/types/database'

type Pet = Database['public']['Tables']['pets']['Row'] & {
  client: {
    id: string
    name: string
    phone: string
  }
  photos: {
    id: string
    photo_url: string
    is_profile_photo: boolean
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
            photo_url,
            is_profile_photo
          )
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
        query = query.or(`name.ilike.%${searchQuery}%,breed.ilike.%${searchQuery}%`)
      }

      // Aplicar ordenação
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error } = await query

      if (error) throw error

      setPets(data || [])
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

  const getSpeciesIcon = (species: string) => {
    switch (species) {
      case 'dog':
        return '🐕'
      case 'cat':
        return '🐱'
      case 'bird':
        return '🐦'
      case 'rabbit':
        return '🐰'
      default:
        return '🐾'
    }
  }

  const getSpeciesLabel = (species: string) => {
    switch (species) {
      case 'dog':
        return 'Cão'
      case 'cat':
        return 'Gato'
      case 'bird':
        return 'Ave'
      case 'rabbit':
        return 'Coelho'
      default:
        return 'Outro'
    }
  }

  const getAgeFromBirthDate = (birthDate: string | null) => {
    if (!birthDate) return 'Idade não informada'
    
    const birth = new Date(birthDate)
    const today = new Date()
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
    
    if (ageInMonths < 12) {
      return `${ageInMonths} ${ageInMonths === 1 ? 'mês' : 'meses'}`
    } else {
      const years = Math.floor(ageInMonths / 12)
      const months = ageInMonths % 12
      if (months === 0) {
        return `${years} ${years === 1 ? 'ano' : 'anos'}`
      } else {
        return `${years}a ${months}m`
      }
    }
  }

  // Estatísticas
  const totalPets = pets.filter(pet => pet.is_active).length
  const totalDogs = pets.filter(pet => pet.species === 'dog' && pet.is_active).length
  const totalCats = pets.filter(pet => pet.species === 'cat' && pet.is_active).length
  const totalOthers = pets.filter(pet => !['dog', 'cat'].includes(pet.species) && pet.is_active).length

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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HeartIcon className="h-8 w-8 text-pink-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total de Pets
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {loading ? '...' : totalPets}
                </dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🐕</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Cães
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {loading ? '...' : totalDogs}
                </dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🐱</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Gatos
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {loading ? '...' : totalCats}
                </dd>
              </dl>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">🐾</span>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Outros
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {loading ? '...' : totalOthers}
                </dd>
              </dl>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Buscar
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nome, raça..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </div>

          {/* Species Filter */}
          <div>
            <label htmlFor="species" className="block text-sm font-medium text-gray-700">
              Espécie
            </label>
            <select
              id="species"
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            >
              <option value="all">Todas</option>
              <option value="dog">Cães</option>
              <option value="cat">Gatos</option>
              <option value="bird">Aves</option>
              <option value="rabbit">Coelhos</option>
              <option value="other">Outros</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            >
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="all">Todos</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700">
              Ordenar por
            </label>
            <select
              id="sort"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field as 'name' | 'created_at' | 'birth_date')
                setSortOrder(order as 'asc' | 'desc')
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            >
              <option value="name-asc">Nome (A-Z)</option>
              <option value="name-desc">Nome (Z-A)</option>
              <option value="created_at-desc">Mais recentes</option>
              <option value="created_at-asc">Mais antigos</option>
              <option value="birth_date-desc">Mais novos</option>
              <option value="birth_date-asc">Mais velhos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Pets List */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Loading skeleton
          [...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </Card>
          ))
        ) : pets.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12 text-center">
              <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhum pet encontrado
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || speciesFilter !== 'all' || statusFilter !== 'active'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece cadastrando o primeiro pet.'}
              </p>
              {!searchQuery && speciesFilter === 'all' && statusFilter === 'active' && (
                <div className="mt-6">
                  <Link href="/pets/new">
                    <Button>
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      Cadastrar Pet
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>
        ) : (
          pets.map((pet) => {
            const profilePhoto = pet.photos?.find(p => p.is_profile_photo) || pet.photos?.[0]
            
            return (
              <Card key={pet.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  {/* Pet Photo */}
                  <div className="flex-shrink-0">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto.photo_url}
                        alt={pet.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-2xl">{getSpeciesIcon(pet.species)}</span>
                      </div>
                    )}
                  </div>

                  {/* Pet Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {pet.name}
                      </h3>
                      {!pet.is_active && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inativo
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">{getSpeciesLabel(pet.species)}</span>
                        {pet.breed && ` • ${pet.breed}`}
                        {pet.gender && ` • ${pet.gender === 'male' ? 'Macho' : pet.gender === 'female' ? 'Fêmea' : 'Não informado'}`}
                      </p>
                      
                      <p className="text-sm text-gray-500">
                        {getAgeFromBirthDate(pet.birth_date)}
                        {pet.weight && ` • ${pet.weight}kg`}
                      </p>
                      
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Tutor:</span> {pet.client.name}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex space-x-2">
                      <Link href={`/pets/${pet.id}`}>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </Link>
                      
                      <Link href={`/pets/${pet.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                      
                      {pet.is_active ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePet(pet.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remover
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestorePet(pet.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          Restaurar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}