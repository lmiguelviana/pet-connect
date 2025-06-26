'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { ChevronDownIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline'
import { Badge } from './badge'
import { Service } from '@/types/appointments'

interface ServiceSelectorProps {
  value: string
  onChange: (serviceId: string) => void
  disabled?: boolean
}

export function ServiceSelector({ value, onChange, disabled = false }: ServiceSelectorProps) {
  const { company } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  const selectedService = services.find(service => service.id === value)

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('id, name, description, category, price, duration, is_active')
        .eq('company_id', company!.id)
        .eq('is_active', true)
        .order('category')
        .order('name')

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Group services by category
  const groupedServices = filteredServices.reduce((groups, service) => {
    const category = service.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(service)
    return groups
  }, {} as Record<string, Service[]>)

  const handleSelect = (serviceId: string) => {
    onChange(serviceId)
    setIsOpen(false)
    setSearchTerm('')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDuration = (duration: number) => {
    if (duration < 60) {
      return `${duration}min`
    }
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded-md"></div>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm
          ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {selectedService ? (
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedService.name}
              </p>
              <div className="flex items-center space-x-3 mt-1">
                <Badge variant="secondary" size="sm">
                  {selectedService.category}
                </Badge>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <ClockIcon className="h-3 w-3" />
                  <span>{formatDuration(selectedService.duration)}</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <CurrencyDollarIcon className="h-3 w-3" />
                  <span>{formatPrice(selectedService.price)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-500">
            {services.length === 0 ? 'Nenhum serviço cadastrado' : 'Selecione um serviço'}
          </span>
        )}
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-80 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {/* Search Input */}
          <div className="sticky top-0 z-10 bg-white px-3 py-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Buscar serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
          </div>

          {/* Service List */}
          {Object.keys(groupedServices).length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchTerm ? 'Nenhum serviço encontrado' : 'Nenhum serviço cadastrado'}
            </div>
          ) : (
            Object.entries(groupedServices).map(([category, categoryServices]) => (
              <div key={category}>
                {/* Category Header */}
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                  {category}
                </div>
                
                {/* Services in Category */}
                {categoryServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleSelect(service.id)}
                    className={`
                      w-full text-left px-3 py-3 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-50 last:border-b-0
                      ${value === service.id ? 'bg-primary-50 text-primary-900' : 'text-gray-900'}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {service.name}
                        </p>
                        {service.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-3 mt-2">
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <ClockIcon className="h-3 w-3" />
                            <span>{formatDuration(service.duration)}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs font-medium text-primary-600">
                            <CurrencyDollarIcon className="h-3 w-3" />
                            <span>{formatPrice(service.price)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}