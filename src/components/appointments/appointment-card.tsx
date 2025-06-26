'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import {
  ClockIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  PlayIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clsx } from 'clsx'
import Link from 'next/link'
import { Appointment } from '@/types/appointments'

interface AppointmentCardProps {
  appointment: Appointment
  onStatusChange: (appointmentId: string, status: Appointment['status']) => void
  onDelete: (appointmentId: string) => void
  compact?: boolean
}

const statusConfig = {
  scheduled: {
    label: 'Agendado',
    color: 'bg-blue-100 text-blue-800',
    icon: ClockIcon
  },
  confirmed: {
    label: 'Confirmado',
    color: 'bg-green-100 text-green-800',
    icon: CheckIcon
  },
  in_progress: {
    label: 'Em andamento',
    color: 'bg-yellow-100 text-yellow-800',
    icon: ClockIcon
  },
  completed: {
    label: 'Concluído',
    color: 'bg-green-100 text-green-800',
    icon: CheckIcon
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800',
    icon: XMarkIcon
  },
  no_show: {
    label: 'Não compareceu',
    color: 'bg-gray-100 text-gray-800',
    icon: XMarkIcon
  }
}

export function AppointmentCard({ 
  appointment, 
  onStatusChange, 
  onDelete, 
  compact = false 
}: AppointmentCardProps) {
  const [showActions, setShowActions] = useState(false)
  const status = statusConfig[appointment.status]
  const StatusIcon = status.icon

  const handleStatusChange = (newStatus: Appointment['status']) => {
    onStatusChange(appointment.id, newStatus)
    setShowActions(false)
  }

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      onDelete(appointment.id)
    }
    setShowActions(false)
  }

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <ClockIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">
                {appointment.start_time} - {appointment.end_time}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 mb-1">
              <UserIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 truncate">
                {appointment.client?.name}
              </span>
            </div>
            
            {appointment.pet && (
              <div className="text-xs text-gray-500 truncate">
                {appointment.pet.name} ({appointment.pet.species})
              </div>
            )}
            
            <div className="text-xs text-gray-500 truncate mt-1">
              {appointment.service?.name}
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            <span className={clsx(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
              status.color
            )}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </span>
            
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActions(!showActions)}
                className="h-6 w-6 p-0"
              >
                <EllipsisVerticalIcon className="h-4 w-4" />
              </Button>
              
              {showActions && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    <Link
                      href={`/appointments/${appointment.id}/edit`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <PencilIcon className="h-4 w-4 inline mr-2" />
                      Editar
                    </Link>
                    
                    {appointment.status === 'scheduled' && (
                      <button
                        onClick={() => handleStatusChange('confirmed')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <CheckIcon className="h-4 w-4 inline mr-2" />
                        Confirmar
                      </button>
                    )}
                    
                    {appointment.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusChange('in_progress')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <ClockIcon className="h-4 w-4 inline mr-2" />
                        Iniciar
                      </button>
                    )}
                    
                    {appointment.status === 'in_progress' && (
                      <button
                        onClick={() => handleStatusChange('completed')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <CheckIcon className="h-4 w-4 inline mr-2" />
                        Concluir
                      </button>
                    )}
                    
                    {!['completed', 'cancelled'].includes(appointment.status) && (
                      <button
                        onClick={() => handleStatusChange('cancelled')}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <XMarkIcon className="h-4 w-4 inline mr-2" />
                        Cancelar
                      </button>
                    )}
                    
                    <button
                      onClick={handleDelete}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <TrashIcon className="h-4 w-4 inline mr-2" />
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Versão completa do card
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <Avatar
            src={appointment.client?.avatar_url}
            alt={appointment.client?.name}
            fallback={appointment.client?.name?.charAt(0) || 'C'}
            size="md"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-medium text-gray-900">
                {appointment.client?.name}
              </h3>
              <span className={clsx(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                status.color
              )}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </span>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4" />
                <span>
                  {format(new Date(`2000-01-01T${appointment.start_time}`), 'HH:mm', { locale: ptBR })} - 
                  {format(new Date(`2000-01-01T${appointment.end_time}`), 'HH:mm', { locale: ptBR })}
                </span>
              </div>
              
              {appointment.pet && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Pet:</span>
                  <span>{appointment.pet.name} ({appointment.pet.species})</span>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <span className="font-medium">Serviço:</span>
                <span>{appointment.service?.name}</span>
              </div>
              
              {appointment.total_amount && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Valor:</span>
                  <span className="text-green-600 font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(appointment.total_amount)}
                  </span>
                </div>
              )}
              
              {appointment.notes && (
                <div className="mt-2">
                  <span className="font-medium">Observações:</span>
                  <p className="text-gray-600 mt-1">{appointment.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link href={`/appointments/${appointment.id}/edit`}>
            <Button variant="outline" size="sm">
              <PencilIcon className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </Link>
          
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowActions(!showActions)}
            >
              <EllipsisVerticalIcon className="h-4 w-4" />
            </Button>
            
            {showActions && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  {appointment.status === 'scheduled' && (
                    <button
                      onClick={() => handleStatusChange('confirmed')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <CheckIcon className="h-4 w-4 inline mr-2" />
                      Confirmar
                    </button>
                  )}
                  
                  {appointment.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusChange('in_progress')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ClockIcon className="h-4 w-4 inline mr-2" />
                      Iniciar Atendimento
                    </button>
                  )}
                  
                  {appointment.status === 'in_progress' && (
                    <button
                      onClick={() => handleStatusChange('completed')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <CheckIcon className="h-4 w-4 inline mr-2" />
                      Concluir Atendimento
                    </button>
                  )}
                  
                  {!['completed', 'cancelled'].includes(appointment.status) && (
                    <button
                      onClick={() => handleStatusChange('cancelled')}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <XMarkIcon className="h-4 w-4 inline mr-2" />
                      Cancelar Agendamento
                    </button>
                  )}
                  
                  <hr className="my-1" />
                  
                  <button
                    onClick={handleDelete}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <TrashIcon className="h-4 w-4 inline mr-2" />
                    Excluir Agendamento
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}