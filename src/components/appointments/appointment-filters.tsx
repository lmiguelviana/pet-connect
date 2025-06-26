'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { CalendarIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AppointmentFilters as Filters, Service } from '@/types/appointments'

interface AppointmentFiltersProps {
  filters: {
    status: string
    service: string
    period: 'today' | 'week' | 'month'
    date: Date
  }
  onFiltersChange: (filters: {
    status: string
    service: string
    period: 'today' | 'week' | 'month'
    date?: Date
  }) => void
  onClearFilters: () => void
}

export function AppointmentFilters({
  filters,
  onFiltersChange,
  onClearFilters
}: AppointmentFiltersProps) {
  const { company } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadServices()
    }
  }, [company?.id])

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name')
        .eq('company_id', company!.id)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
    }
  }

  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'scheduled', label: 'Agendado' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'in_progress', label: 'Em andamento' },
    { value: 'completed', label: 'Concluído' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'no_show', label: 'Não compareceu' },
  ]

  const dateRangeOptions = [
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mês' },
  ]

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              {showFilters ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <Input
              type="date"
              value={format(filters.date, 'yyyy-MM-dd')}
              onChange={(e) => onFiltersChange({ ...filters, date: new Date(e.target.value) })}
              className="w-auto"
            />
          </div>
        </div>
      </div>

      <div className={`px-4 py-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              value={filters.status}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Service Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Serviço
            </label>
            <Select
              value={filters.service}
              onValueChange={(value) => onFiltersChange({ ...filters, service: value })}
            >
              <option value="all">Todos os serviços</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período
            </label>
            <Select
              value={filters.period}
              onValueChange={(value) => onFiltersChange({ ...filters, period: value as 'today' | 'week' | 'month' })}
            >
              {dateRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="w-full"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}