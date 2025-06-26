'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'
import { Card } from '@/components/ui/card'
import {
  UsersIcon,
  HeartIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'

interface Stats {
  totalClients: number
  totalPets: number
  totalAppointments: number
  monthlyRevenue: number
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalPets: 0,
    totalAppointments: 0,
    monthlyRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const { company } = useAuth()

  useEffect(() => {
    if (company?.id) {
      fetchStats()
    }
  }, [company?.id])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const supabase = createClientComponentClient<Database>()

      // Buscar total de clientes
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company?.id)

      // Buscar total de pets
      const { count: petsCount } = await supabase
        .from('pets')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company?.id)

      // Buscar agendamentos do mês atual
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      
      const endOfMonth = new Date()
      endOfMonth.setMonth(endOfMonth.getMonth() + 1)
      endOfMonth.setDate(0)
      endOfMonth.setHours(23, 59, 59, 999)

      const { count: appointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company?.id)
        .gte('date_time', startOfMonth.toISOString())
        .lte('date_time', endOfMonth.toISOString())

      // Buscar receita do mês (simulada por enquanto)
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('price')
        .eq('company_id', company?.id)
        .eq('status', 'completed')
        .gte('date_time', startOfMonth.toISOString())
        .lte('date_time', endOfMonth.toISOString())

      const monthlyRevenue = appointmentsData?.reduce((sum, appointment) => {
        return sum + (appointment.price || 0)
      }, 0) || 0

      setStats({
        totalClients: clientsCount || 0,
        totalPets: petsCount || 0,
        totalAppointments: appointmentsCount || 0,
        monthlyRevenue,
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsData = [
    {
      name: 'Total de Clientes',
      value: stats.totalClients,
      icon: UsersIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Total de Pets',
      value: stats.totalPets,
      icon: HeartIcon,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      name: 'Agendamentos (Mês)',
      value: stats.totalAppointments,
      icon: CalendarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Receita (Mês)',
      value: `R$ ${stats.monthlyRevenue.toFixed(2)}`,
      icon: CurrencyDollarIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => (
        <Card key={stat.name} className="p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600 truncate">
                {stat.name}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stat.value}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}