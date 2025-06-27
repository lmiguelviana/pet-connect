'use client'

import { useState } from 'react'
import { ServiceFilters as ServiceFiltersType, ServiceStats, SERVICE_CATEGORIES, CATEGORY_LABELS } from '@/types/services'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  X,
  DollarSign,
  Tag,
  Activity
} from 'lucide-react'

interface ServiceFiltersProps {
  filters: ServiceFilters
  onFiltersChange: (filters: ServiceFilters) => void
  stats: ServiceStats
}

export function ServiceFilters({ filters, onFiltersChange, stats }: ServiceFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localPriceRange, setLocalPriceRange] = useState({
    min: filters.price_range.min.toString(),
    max: filters.price_range.max.toString()
  })

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value
    })
  }

  const handleCategoryChange = (category: typeof filters.category) => {
    onFiltersChange({
      ...filters,
      category
    })
  }

  const handleStatusChange = (status: typeof filters.status) => {
    onFiltersChange({
      ...filters,
      status
    })
  }

  const handlePriceRangeChange = () => {
    const min = parseFloat(localPriceRange.min) || 0
    const max = parseFloat(localPriceRange.max) || 1000
    
    onFiltersChange({
      ...filters,
      price_range: { min, max }
    })
  }

  const clearFilters = () => {
    setLocalPriceRange({ min: '0', max: '1000' })
    onFiltersChange({
      search: '',
      category: 'all',
      status: 'all',
      price_range: { min: 0, max: 1000 }
    })
  }

  const hasActiveFilters = filters.search || filters.category !== 'all' || filters.status !== 'all' || 
    filters.price_range.min > 0 || filters.price_range.max < 1000

  const categoriesWithCount = SERVICE_CATEGORIES.map(category => ({
    value: category,
    label: CATEGORY_LABELS[category],
    count: 0 // TODO: Implementar contagem de estatísticas
  }))

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filtros</h3>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Busca */}
        <div className="space-y-2">
          <Label htmlFor="search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Nome ou descrição..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Status
          </Label>
          <div className="space-y-2">
            <button
              onClick={() => handleStatusChange('all')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                filters.status === 'all'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>Todos</span>
                <Badge variant="outline" className="text-xs">
                  {stats.total}
                </Badge>
              </div>
            </button>
            <button
              onClick={() => handleStatusChange('active')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                filters.status === 'active'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>Ativos</span>
                <Badge variant="outline" className="text-xs">
                  {stats.active}
                </Badge>
              </div>
            </button>
            <button
              onClick={() => handleStatusChange('inactive')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                filters.status === 'inactive'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>Inativos</span>
                <Badge variant="outline" className="text-xs">
                  {stats.inactive}
                </Badge>
              </div>
            </button>
          </div>
        </div>

        {/* Categorias */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categoria
          </Label>
          <div className="space-y-2">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                filters.category === 'all'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>Todas</span>
                <Badge variant="outline" className="text-xs">
                  {stats.total}
                </Badge>
              </div>
            </button>
            {categoriesWithCount.map((category) => (
              <button
                key={category.value}
                onClick={() => handleCategoryChange(category.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  filters.category === category.value
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{category.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {category.count}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Faixa de Preço */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Faixa de Preço
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="min-price" className="text-xs text-gray-600">Mínimo</Label>
              <Input
                id="min-price"
                type="number"
                placeholder="0"
                value={localPriceRange.min}
                onChange={(e) => setLocalPriceRange(prev => ({ ...prev, min: e.target.value }))}
                onBlur={handlePriceRangeChange}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="max-price" className="text-xs text-gray-600">Máximo</Label>
              <Input
                id="max-price"
                type="number"
                placeholder="1000"
                value={localPriceRange.max}
                onChange={(e) => setLocalPriceRange(prev => ({ ...prev, max: e.target.value }))}
                onBlur={handlePriceRangeChange}
                className="text-sm"
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePriceRangeChange}
            className="w-full text-xs"
          >
            Aplicar Filtro
          </Button>
        </div>

        {/* Resumo dos Filtros Ativos */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-200">
            <Label className="text-xs text-gray-600 mb-2 block">Filtros Ativos:</Label>
            <div className="space-y-1">
              {filters.search && (
                <Badge variant="secondary" className="text-xs">
                  Busca: {filters.search}
                </Badge>
              )}
              {filters.category !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {CATEGORY_LABELS[filters.category]}
                </Badge>
              )}
              {filters.status !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {filters.status === 'active' ? 'Ativos' : 'Inativos'}
                </Badge>
              )}
              {(filters.price_range.min > 0 || filters.price_range.max < 1000) && (
                <Badge variant="secondary" className="text-xs">
                  R$ {filters.price_range.min} - R$ {filters.price_range.max}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}