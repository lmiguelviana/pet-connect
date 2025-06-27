'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Service } from '@/types/services'
import { 
  Plus, 
  Minus, 
  Package, 
  DollarSign, 
  Clock,
  Percent,
  X,
  Save,
  Edit3
} from 'lucide-react'
import { toast } from 'sonner'

interface ServicePackage {
  id?: string
  name: string
  description: string
  services: PackageService[]
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  total_price: number
  final_price: number
  is_active: boolean
  valid_until?: string
}

interface PackageService {
  service_id: string
  service: Service
  quantity: number
  unit_price: number
  total_price: number
}

interface ServicePackagesProps {
  services: Service[]
  packages?: ServicePackage[]
  onSavePackage?: (packageData: ServicePackage) => void
  onDeletePackage?: (packageId: string) => void
}

export function ServicePackages({ 
  services, 
  packages = [], 
  onSavePackage,
  onDeletePackage 
}: ServicePackagesProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null)
  const [packageForm, setPackageForm] = useState<Partial<ServicePackage>>({
    name: '',
    description: '',
    services: [],
    discount_type: 'percentage',
    discount_value: 0,
    is_active: true
  })

  // Calcular preços do pacote
  const calculatePackagePrices = (packageServices: PackageService[], discountType: 'percentage' | 'fixed', discountValue: number) => {
    const totalPrice = packageServices.reduce((sum, item) => sum + item.total_price, 0)
    
    let finalPrice = totalPrice
    if (discountType === 'percentage') {
      finalPrice = totalPrice * (1 - discountValue / 100)
    } else {
      finalPrice = Math.max(0, totalPrice - discountValue)
    }
    
    return { totalPrice, finalPrice }
  }

  // Adicionar serviço ao pacote
  const addServiceToPackage = (service: Service) => {
    const existingService = packageForm.services?.find(s => s.service_id === service.id)
    
    if (existingService) {
      // Incrementar quantidade
      const updatedServices = packageForm.services!.map(s => 
        s.service_id === service.id 
          ? { ...s, quantity: s.quantity + 1, total_price: s.unit_price * (s.quantity + 1) }
          : s
      )
      setPackageForm(prev => ({ ...prev, services: updatedServices }))
    } else {
      // Adicionar novo serviço
      const newService: PackageService = {
        service_id: service.id,
        service,
        quantity: 1,
        unit_price: service.price,
        total_price: service.price
      }
      setPackageForm(prev => ({ 
        ...prev, 
        services: [...(prev.services || []), newService] 
      }))
    }
  }

  // Remover serviço do pacote
  const removeServiceFromPackage = (serviceId: string) => {
    setPackageForm(prev => ({
      ...prev,
      services: prev.services?.filter(s => s.service_id !== serviceId) || []
    }))
  }

  // Atualizar quantidade do serviço
  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeServiceFromPackage(serviceId)
      return
    }

    const updatedServices = packageForm.services!.map(s => 
      s.service_id === serviceId 
        ? { ...s, quantity, total_price: s.unit_price * quantity }
        : s
    )
    setPackageForm(prev => ({ ...prev, services: updatedServices }))
  }

  // Salvar pacote
  const handleSavePackage = () => {
    if (!packageForm.name?.trim()) {
      toast.error('Nome do pacote é obrigatório')
      return
    }

    if (!packageForm.services?.length) {
      toast.error('Adicione pelo menos um serviço ao pacote')
      return
    }

    const { totalPrice, finalPrice } = calculatePackagePrices(
      packageForm.services,
      packageForm.discount_type!,
      packageForm.discount_value!
    )

    const packageData: ServicePackage = {
      ...packageForm as ServicePackage,
      total_price: totalPrice,
      final_price: finalPrice
    }

    onSavePackage?.(packageData)
    setIsCreating(false)
    setEditingPackage(null)
    setPackageForm({
      name: '',
      description: '',
      services: [],
      discount_type: 'percentage',
      discount_value: 0,
      is_active: true
    })
  }

  // Editar pacote
  const handleEditPackage = (pkg: ServicePackage) => {
    setEditingPackage(pkg)
    setPackageForm(pkg)
    setIsCreating(true)
  }

  // Cancelar edição
  const handleCancelEdit = () => {
    setIsCreating(false)
    setEditingPackage(null)
    setPackageForm({
      name: '',
      description: '',
      services: [],
      discount_type: 'percentage',
      discount_value: 0,
      is_active: true
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const currentPrices = packageForm.services?.length 
    ? calculatePackagePrices(
        packageForm.services,
        packageForm.discount_type!,
        packageForm.discount_value!
      )
    : { totalPrice: 0, finalPrice: 0 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pacotes de Serviços</h2>
          <p className="text-gray-600">Crie combos e ofertas especiais</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Pacote
          </Button>
        )}
      </div>

      {/* Formulário de criação/edição */}
      {isCreating && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editingPackage ? 'Editar Pacote' : 'Novo Pacote'}
              </h3>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Informações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="package-name">Nome do Pacote</Label>
                <Input
                  id="package-name"
                  value={packageForm.name || ''}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Pacote Completo de Beleza"
                />
              </div>
              <div>
                <Label htmlFor="package-status">Status</Label>
                <select
                  id="package-status"
                  value={packageForm.is_active ? 'active' : 'inactive'}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, is_active: e.target.value === 'active' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="package-description">Descrição</Label>
              <Textarea
                id="package-description"
                value={packageForm.description || ''}
                onChange={(e) => setPackageForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o que está incluído no pacote..."
                rows={3}
              />
            </div>

            {/* Seleção de serviços */}
            <div>
              <Label>Serviços Disponíveis</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                {services.filter(s => s.is_active).map((service) => (
                  <Card 
                    key={service.id} 
                    className="p-3 cursor-pointer hover:bg-green-50 transition-colors"
                    onClick={() => addServiceToPackage(service)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{service.name}</p>
                        <p className="text-xs text-gray-600">{formatCurrency(service.price)}</p>
                      </div>
                      <Plus className="h-4 w-4 text-green-600" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Serviços selecionados */}
            {packageForm.services && packageForm.services.length > 0 && (
              <div>
                <Label>Serviços no Pacote</Label>
                <div className="space-y-2 mt-2">
                  {packageForm.services.map((item) => (
                    <div key={item.service_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.service.name}</p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(item.unit_price)} × {item.quantity} = {formatCurrency(item.total_price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateServiceQuantity(item.service_id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateServiceQuantity(item.service_id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeServiceFromPackage(item.service_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Desconto */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="discount-type">Tipo de Desconto</Label>
                <select
                  id="discount-type"
                  value={packageForm.discount_type}
                  onChange={(e) => setPackageForm(prev => ({ 
                    ...prev, 
                    discount_type: e.target.value as 'percentage' | 'fixed' 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="percentage">Porcentagem (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="discount-value">Valor do Desconto</Label>
                <Input
                  id="discount-value"
                  type="number"
                  min="0"
                  max={packageForm.discount_type === 'percentage' ? 100 : undefined}
                  value={packageForm.discount_value || 0}
                  onChange={(e) => setPackageForm(prev => ({ 
                    ...prev, 
                    discount_value: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder={packageForm.discount_type === 'percentage' ? '10' : '50.00'}
                />
              </div>
              <div>
                <Label>Resumo de Preços</Label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(currentPrices.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto:</span>
                    <span>
                      -{packageForm.discount_type === 'percentage' 
                        ? `${packageForm.discount_value}%` 
                        : formatCurrency(packageForm.discount_value || 0)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(currentPrices.finalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
              <Button onClick={handleSavePackage}>
                <Save className="h-4 w-4 mr-2" />
                {editingPackage ? 'Atualizar' : 'Salvar'} Pacote
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de pacotes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="p-6">
            <div className="space-y-4">
              {/* Header do pacote */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                    <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                      {pkg.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditPackage(pkg)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeletePackage?.(pkg.id!)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Descrição */}
              {pkg.description && (
                <p className="text-sm text-gray-600">{pkg.description}</p>
              )}

              {/* Serviços inclusos */}
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Serviços inclusos:</p>
                <div className="space-y-1">
                  {pkg.services.map((item) => (
                    <div key={item.service_id} className="flex justify-between text-sm">
                      <span>{item.service.name} × {item.quantity}</span>
                      <span className="text-gray-600">{formatCurrency(item.total_price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preços */}
              <div className="border-t pt-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span className="line-through">{formatCurrency(pkg.total_price)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto:</span>
                  <span>
                    -{pkg.discount_type === 'percentage' 
                      ? `${pkg.discount_value}%` 
                      : formatCurrency(pkg.discount_value)
                    }
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-green-600">{formatCurrency(pkg.final_price)}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Estado vazio */}
      {packages.length === 0 && !isCreating && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Package className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum pacote criado
          </h3>
          <p className="text-gray-600 mb-4">
            Crie pacotes de serviços para oferecer descontos e combos especiais
          </p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Pacote
          </Button>
        </div>
      )}
    </div>
  )
}