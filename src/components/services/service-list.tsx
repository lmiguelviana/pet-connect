'use client'

import { ServiceWithPhotos, ServiceFilters, ServiceListProps } from '@/types/services'
import { ServiceCard } from './service-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ServiceList({
  services,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  isLoading
}: ServiceListProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (services.length === 0) {
    const hasFilters = filters.search || filters.category !== 'all' || filters.status !== 'all' || 
      filters.price_range.min > 0 || filters.price_range.max < 1000

    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          {hasFilters ? (
            <>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum serviço encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Não encontramos serviços que correspondam aos filtros aplicados.
                </p>
                <Button
                  variant="outline"
                  onClick={() => onFiltersChange({
                    search: '',
                    category: 'all',
                    status: 'all',
                    price_range: { min: 0, max: 1000 }
                  })}
                >
                  Limpar Filtros
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Plus className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum serviço cadastrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Comece cadastrando o primeiro serviço do seu pet shop.
                </p>
                <Button onClick={() => router.push('/services/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Serviço
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header da Lista */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {services.length} {services.length === 1 ? 'serviço encontrado' : 'serviços encontrados'}
          </h2>
          {(filters.search || filters.category !== 'all' || filters.status !== 'all') && (
            <p className="text-sm text-gray-600">
              Resultados filtrados
            </p>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => router.push('/services/new')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      {/* Lista de Serviços */}
      <div className="grid grid-cols-1 gap-4">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onToggleStatus={onToggleStatus}
          />
        ))}
      </div>

      {/* Paginação (para implementação futura) */}
      {services.length >= 20 && (
        <Card className="p-4">
          <div className="flex items-center justify-center">
            <p className="text-sm text-gray-600">
              Mostrando {services.length} serviços
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}