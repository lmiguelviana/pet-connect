'use client'

import { ServiceWithPhotos, CATEGORY_LABELS } from '@/types/services'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Image as ImageIcon
} from 'lucide-react'
import Image from 'next/image'

interface ServiceCardProps {
  service: ServiceWithPhotos
  onEdit: (serviceId: string) => void
  onDelete: (serviceId: string) => void
  onDuplicate: (serviceId: string) => void
  onToggleStatus: (serviceId: string) => void
}

export function ServiceCard({ 
  service, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onToggleStatus 
}: ServiceCardProps) {
  const primaryPhoto = service.primary_photo || service.photos?.[0]
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

  const formatAvailableDays = (days: number[]) => {
    const dayLabels: Record<number, string> = {
      1: 'Seg',
      2: 'Ter',
      3: 'Qua',
      4: 'Qui',
      5: 'Sex',
      6: 'Sáb',
      7: 'Dom'
    }
    
    return days.map(day => dayLabels[day] || day).join(', ')
  }



  return (
    <Card className={`p-6 transition-all hover:shadow-md ${
      !service.is_active ? 'opacity-75 bg-gray-50' : ''
    }`}>
      <div className="flex items-start gap-4">
        {/* Foto do Serviço */}
        <div className="flex-shrink-0">
          {primaryPhoto ? (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden">
              <Image
                src={primaryPhoto.url}
                alt={service.name}
                fill
                className="object-cover"
              />
              {service.photos.length > 1 && (
                <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                  +{service.photos.length - 1}
                </div>
              )}
            </div>
          ) : (
            <div 
              className="w-20 h-20 rounded-lg flex items-center justify-center bg-green-600"
            >
              <ImageIcon className="h-8 w-8 text-white" />
            </div>
          )}
        </div>

        {/* Informações do Serviço */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {service.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant="outline" 
                  className="text-xs text-green-600 border-green-600"
                >
                  {CATEGORY_LABELS[service.category as keyof typeof CATEGORY_LABELS] || service.category}
                </Badge>
                <Badge 
                  variant={service.is_active ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {service.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(service.price)}
              </p>
              <p className="text-sm text-gray-600">
                {formatDuration(service.duration_minutes)}
              </p>
            </div>
          </div>

          {/* Descrição */}
          {service.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {service.description}
            </p>
          )}

          {/* Detalhes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Até {service.max_pets_per_session} pets</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{service.requires_appointment ? 'Agendamento obrigatório' : 'Sem agendamento'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {service.available_hours?.start && service.available_hours?.end 
                  ? `${service.available_hours.start} às ${service.available_hours.end}`
                  : 'Horário não definido'
                }
              </span>
            </div>
          </div>

          {/* Dias Disponíveis */}
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              Disponível: {formatAvailableDays(service.available_days)}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex-shrink-0">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleStatus?.(service.id)}
              className="h-8 w-8 p-0"
              title={service.is_active ? 'Desativar serviço' : 'Ativar serviço'}
            >
              {service.is_active ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit?.(service.id)}
              className="h-8 w-8 p-0"
              title="Editar serviço"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDuplicate?.(service.id)}
              className="h-8 w-8 p-0"
              title="Duplicar serviço"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(service.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Excluir serviço"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}