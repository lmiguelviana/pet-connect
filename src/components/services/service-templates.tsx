'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ServiceFormData, SERVICE_CATEGORIES, CATEGORY_LABELS } from '@/types/services'
import { 
  Search, 
  Plus, 
  Star, 
  Clock, 
  DollarSign,
  Scissors,
  Heart,
  Droplets,
  Brush,
  Stethoscope,
  Camera,
  Home
} from 'lucide-react'

interface ServiceTemplate {
  id: string
  name: string
  category: string
  description: string
  price: number
  duration_minutes: number
  icon: React.ReactNode
  popular?: boolean
  data: Partial<ServiceFormData>
}

interface ServiceTemplatesProps {
  onSelectTemplate: (template: ServiceTemplate) => void
  onClose?: () => void
}

// Templates predefinidos para pet shops
const SERVICE_TEMPLATES: ServiceTemplate[] = [
  // Banho e Tosa
  {
    id: 'banho-simples',
    name: 'Banho Simples',
    category: 'grooming',
    description: 'Banho básico com shampoo neutro, secagem e escovação',
    price: 35.00,
    duration_minutes: 60,
    icon: <Droplets className="h-5 w-5" />,
    popular: true,
    data: {
      category: 'grooming',
      requires_appointment: true,
      max_pets_per_session: 1,
      available_days: [1, 2, 3, 4, 5, 6],
      available_hours: { start: '08:00', end: '17:00' },
      preparation_time: 15,
      cleanup_time: 15
    }
  },
  {
    id: 'banho-tosa',
    name: 'Banho e Tosa Completa',
    category: 'grooming',
    description: 'Banho, tosa higiênica, corte de unhas e limpeza de ouvidos',
    price: 65.00,
    duration_minutes: 120,
    icon: <Scissors className="h-5 w-5" />,
    popular: true,
    data: {
      category: 'grooming',
      requires_appointment: true,
      max_pets_per_session: 1,
      available_days: [1, 2, 3, 4, 5, 6],
      available_hours: { start: '08:00', end: '16:00' },
      preparation_time: 20,
      cleanup_time: 20
    }
  },
  {
    id: 'tosa-bebe',
    name: 'Tosa Bebê',
    category: 'grooming',
    description: 'Tosa especial para filhotes, com cuidado extra e carinho',
    price: 45.00,
    duration_minutes: 90,
    icon: <Heart className="h-5 w-5" />,
    data: {
      category: 'grooming',
      requires_appointment: true,
      max_pets_per_session: 1,
      available_days: [1, 2, 3, 4, 5],
      available_hours: { start: '09:00', end: '16:00' },
      preparation_time: 20,
      cleanup_time: 15
    }
  },

  // Veterinário
  {
    id: 'consulta-veterinaria',
    name: 'Consulta Veterinária',
    category: 'veterinary',
    description: 'Consulta clínica geral com exame físico completo',
    price: 80.00,
    duration_minutes: 45,
    icon: <Stethoscope className="h-5 w-5" />,
    popular: true,
    data: {
      category: 'veterinary',
      requires_appointment: true,
      max_pets_per_session: 1,
      available_days: [1, 2, 3, 4, 5],
      available_hours: { start: '08:00', end: '18:00' },
      preparation_time: 10,
      cleanup_time: 10
    }
  },
  {
    id: 'vacinacao',
    name: 'Vacinação',
    category: 'veterinary',
    description: 'Aplicação de vacinas com carteirinha atualizada',
    price: 50.00,
    duration_minutes: 30,
    icon: <Stethoscope className="h-5 w-5" />,
    data: {
      category: 'veterinary',
      requires_appointment: true,
      max_pets_per_session: 3,
      available_days: [1, 2, 3, 4, 5],
      available_hours: { start: '08:00', end: '17:00' },
      preparation_time: 5,
      cleanup_time: 5
    }
  },

  // Hospedagem
  {
    id: 'hospedagem-diaria',
    name: 'Hospedagem Diária',
    category: 'boarding',
    description: 'Hospedagem com alimentação, passeios e cuidados especiais',
    price: 60.00,
    duration_minutes: 1440, // 24 horas
    icon: <Home className="h-5 w-5" />,
    data: {
      category: 'boarding',
      requires_appointment: true,
      max_pets_per_session: 1,
      available_days: [1, 2, 3, 4, 5, 6, 7],
      available_hours: { start: '07:00', end: '19:00' },
      preparation_time: 30,
      cleanup_time: 30
    }
  },
  {
    id: 'day-care',
    name: 'Day Care',
    category: 'boarding',
    description: 'Cuidados durante o dia com socialização e atividades',
    price: 40.00,
    duration_minutes: 480, // 8 horas
    icon: <Heart className="h-5 w-5" />,
    popular: true,
    data: {
      category: 'boarding',
      requires_appointment: true,
      max_pets_per_session: 5,
      available_days: [1, 2, 3, 4, 5],
      available_hours: { start: '07:00', end: '18:00' },
      preparation_time: 15,
      cleanup_time: 15
    }
  },

  // Outros
  {
    id: 'transporte',
    name: 'Transporte Pet',
    category: 'other',
    description: 'Busca e entrega do seu pet com segurança',
    price: 25.00,
    duration_minutes: 60,
    icon: <Camera className="h-5 w-5" />,
    data: {
      category: 'other',
      requires_appointment: true,
      max_pets_per_session: 2,
      available_days: [1, 2, 3, 4, 5, 6],
      available_hours: { start: '08:00', end: '18:00' },
      preparation_time: 10,
      cleanup_time: 5
    }
  },
  {
    id: 'sessao-fotos',
    name: 'Sessão de Fotos',
    category: 'other',
    description: 'Ensaio fotográfico profissional do seu pet',
    price: 120.00,
    duration_minutes: 90,
    icon: <Camera className="h-5 w-5" />,
    data: {
      category: 'other',
      requires_appointment: true,
      max_pets_per_session: 1,
      available_days: [1, 2, 3, 4, 5, 6],
      available_hours: { start: '09:00', end: '17:00' },
      preparation_time: 30,
      cleanup_time: 15
    }
  }
]

export function ServiceTemplates({ onSelectTemplate, onClose }: ServiceTemplatesProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Filtrar templates
  const filteredTemplates = SERVICE_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Agrupar por categoria
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = []
    }
    acc[template.category].push(template)
    return acc
  }, {} as Record<string, ServiceTemplate[]>)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDuration = (minutes: number) => {
    if (minutes >= 1440) {
      const days = Math.floor(minutes / 1440)
      return `${days} dia${days > 1 ? 's' : ''}`
    }
    
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`
    }
    return `${mins}min`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Templates de Serviços</h2>
          <p className="text-gray-600">Escolha um template para começar rapidamente</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Criar do Zero
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Todas as categorias</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates por categoria */}
      <div className="space-y-8">
        {Object.entries(groupedTemplates).map(([category, templates]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}
              <Badge variant="outline">{templates.length}</Badge>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className="p-6 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="space-y-4">
                    {/* Header do template */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                          {template.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                            {template.name}
                          </h4>
                          {template.popular && (
                            <Badge className="mt-1 bg-yellow-100 text-yellow-800 border-yellow-200">
                              <Star className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Descrição */}
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {template.description}
                    </p>

                    {/* Detalhes */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(template.duration_minutes)}</span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-green-600">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatCurrency(template.price)}</span>
                      </div>
                    </div>

                    {/* Botão de ação */}
                    <Button 
                      className="w-full group-hover:bg-green-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectTemplate(template)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Usar Template
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Estado vazio */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum template encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            Tente ajustar os filtros ou criar um serviço do zero
          </p>
          {onClose && (
            <Button onClick={onClose}>
              Criar Serviço Personalizado
            </Button>
          )}
        </div>
      )}
    </div>
  )
}