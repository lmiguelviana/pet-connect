'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { 
  HeartIcon, 
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

type Pet = {
  id: string
  name: string
  species: string
  breed?: string
  age?: number
  weight?: number
  avatar_url?: string
  is_active: boolean
  created_at: string
  client_id: string
  company_id: string
}

interface PetStats {
  total: number
  dogs: number
  cats: number
  others: number
  averageAge: number
  activeThisMonth: number
}

export default function PetsStats() {
  const { company } = useAuth()
  const [stats, setStats] = useState<PetStats>({
    total: 0,
    dogs: 0,
    cats: 0,
    others: 0,
    averageAge: 0,
    activeThisMonth: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadStats()
    }
  }, [company?.id])

  const loadStats = async () => {
    try {
      setLoading(true)

      // Buscar todos os pets ativos
      const { data: pets, error } = await supabase
        .from('pets')
        .select('*')
        .eq('company_id', company!.id)
        .eq('is_active', true)

      if (error) throw error

      const petsData = pets || []
      
      // Calcular estatísticas
      const total = petsData.length
      const dogs = petsData.filter(pet => pet.species === 'dog').length
      const cats = petsData.filter(pet => pet.species === 'cat').length
      const others = petsData.filter(pet => !['dog', 'cat'].includes(pet.species || '')).length
      
      // Calcular idade média
      const petsWithBirthDate = petsData.filter(pet => pet.birth_date)
      let averageAge = 0
      
      if (petsWithBirthDate.length > 0) {
        const totalAge = petsWithBirthDate.reduce((sum, pet) => {
          const birthDate = new Date(pet.birth_date!)
          const today = new Date()
          const ageInYears = (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
          return sum + ageInYears
        }, 0)
        averageAge = totalAge / petsWithBirthDate.length
      }

      // Pets ativos este mês (criados ou atualizados)
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      
      const activeThisMonth = petsData.filter(pet => {
        const createdAt = new Date(pet.created_at)
        const updatedAt = new Date(pet.updated_at || pet.created_at)
        return createdAt >= startOfMonth || updatedAt >= startOfMonth
      }).length

      setStats({
        total,
        dogs,
        cats,
        others,
        averageAge: Math.round(averageAge * 10) / 10, // Arredondar para 1 casa decimal
        activeThisMonth
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total de Pets',
      value: stats.total,
      icon: HeartIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Pets cadastrados'
    },
    {
      title: 'Cães',
      value: stats.dogs,
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: `${stats.total > 0 ? Math.round((stats.dogs / stats.total) * 100) : 0}% do total`
    },
    {
      title: 'Gatos',
      value: stats.cats,
      icon: HeartIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: `${stats.total > 0 ? Math.round((stats.cats / stats.total) * 100) : 0}% do total`
    },
    {
      title: 'Idade Média',
      value: stats.averageAge > 0 ? `${stats.averageAge} anos` : 'N/A',
      icon: CalendarIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Idade média dos pets'
    },
    {
      title: 'Ativos Este Mês',
      value: stats.activeThisMonth,
      icon: ChartBarIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Novos ou atualizados'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-5">
            <div className="animate-pulse">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.title}
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {stat.value}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    {stat.description}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}