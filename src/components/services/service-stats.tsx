'use client'

import { ServiceStats as ServiceStatsType } from '@/types/services'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  DollarSign, 
  Clock, 
  BarChart3,
  TrendingUp,
  Users
} from 'lucide-react'

interface ServiceStatsProps {
  stats: ServiceStatsType
}

export function ServiceStats({ stats }: ServiceStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`
    }
    return `${mins}min`
  }

  const getTopCategories = () => {
    const categories = Object.entries(stats.by_category)
      .filter(([_, count]) => count > 0)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3)
    
    return categories
  }

  const topCategories = getTopCategories()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total de Serviços */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total de Serviços</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Badge variant={stats.active > stats.inactive ? 'default' : 'secondary'} className="text-xs">
            {stats.active} ativos
          </Badge>
          {stats.inactive > 0 && (
            <Badge variant="outline" className="text-xs">
              {stats.inactive} inativos
            </Badge>
          )}
        </div>
      </Card>

      {/* Serviços Ativos */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Serviços Ativos</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Activity className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <TrendingUp className="h-4 w-4" />
            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% do total
          </div>
        </div>
      </Card>

      {/* Preço Médio */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Preço Médio</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.average_price)}
            </p>
          </div>
          <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Baseado em {stats.total} serviços
          </p>
        </div>
      </Card>

      {/* Duração Média */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Duração Média</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatDuration(stats.average_duration)}
            </p>
          </div>
          <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Clock className="h-6 w-6 text-purple-600" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Tempo médio por serviço
          </p>
        </div>
      </Card>

      {/* Categorias Populares */}
      {topCategories.length > 0 && (
        <Card className="p-6 md:col-span-2 lg:col-span-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Categorias Mais Populares</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topCategories.map(([category, count], index) => {
              const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
              const colors = ['bg-green-100 text-green-800', 'bg-blue-100 text-blue-800', 'bg-purple-100 text-purple-800']
              
              return (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {category.replace('-', ' ')}
                    </p>
                    <p className="text-sm text-gray-600">{count} serviços</p>
                  </div>
                  <Badge className={colors[index] || 'bg-gray-100 text-gray-800'}>
                    {percentage}%
                  </Badge>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}