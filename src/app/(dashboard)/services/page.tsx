'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ServiceList } from '@/components/services/service-list'
import { ServiceStats } from '@/components/services/service-stats'
import { ServiceFilters } from '@/components/services/service-filters'
import { ServicePackages } from '@/components/services/service-packages'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Package, Wrench, File } from 'lucide-react'
import { ServiceFilters as ServiceFiltersType } from '@/types/services'
import { useServices } from '@/hooks/use-services'
import { useServicePackages } from '@/hooks/use-service-packages'

type TabType = 'services' | 'packages'

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('services')
  const [filters, setFilters] = useState<ServiceFiltersType>({
    search: '',
    category: 'all',
    status: 'all',
    price_range: { min: 0, max: 1000 }
  })
  const router = useRouter()
  const { services, stats } = useServices()
  const { createPackage, updatePackage, deletePackage } = useServicePackages()

  const handleCreateNewItem = () => {
    if (activeTab === 'services') {
      router.push('/services/new')
    } else {
      // Para pacotes, o formulário está integrado no componente
      // Não precisamos navegar para uma nova página
    }
  }

  const getButtonText = () => {
    return activeTab === 'services' ? 'Novo Serviço' : 'Novo Pacote'
  }

  const getButtonIcon = () => {
    return activeTab === 'services' ? <Plus className="h-4 w-4" /> : <Package className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
          <p className="text-gray-600">Gerencie os serviços e pacotes do seu pet shop</p>
        </div>
        {activeTab === 'services' && (
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => router.push('/services/templates')}
              className="flex items-center gap-2"
            >
              <File className="h-4 w-4" />
              Templates
            </Button>
            <Button onClick={handleCreateNewItem} className="flex items-center gap-2">
              {getButtonIcon()}
              {getButtonText()}
            </Button>
          </div>
        )}
      </div>

      {/* Abas */}
      <Card className="p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'services'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Wrench className="h-4 w-4" />
            Serviços Individuais
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'packages'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Package className="h-4 w-4" />
            Pacotes e Combos
          </button>
        </div>
      </Card>

      {/* Conteúdo das Abas */}
      {activeTab === 'services' ? (
        <>
          {/* Estatísticas */}
          <ServiceStats />

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
                filters={filters}
              />
            </div>
          </div>
        </>
      ) : (
        /* Pacotes de Serviços */
        <ServicePackages
          services={services.filter(s => s.is_active)}
          onSavePackage={createPackage}
          onDeletePackage={deletePackage}
        />
      )}
    </div>
  )
}