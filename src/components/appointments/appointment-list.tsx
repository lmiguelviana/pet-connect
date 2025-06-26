'use client'

import { AppointmentCard } from './appointment-card'
import { CalendarIcon, ListBulletIcon } from '@heroicons/react/24/outline'
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clsx } from 'clsx'
import { Appointment } from '@/types/appointments'

interface AppointmentListProps {
  appointments: Appointment[]
  loading: boolean
  onStatusChange: (appointmentId: string, status: Appointment['status']) => void
  onDelete: (appointmentId: string) => void
}

export function AppointmentList({
  appointments,
  loading,
  onStatusChange,
  onDelete
}: AppointmentListProps) {
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-12 sm:px-6 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Nenhum agendamento encontrado
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Não há agendamentos para os filtros selecionados.
          </p>
        </div>
      </div>
    )
  }

  // Agrupar agendamentos por data
  const groupedAppointments = appointments.reduce((groups, appointment) => {
    const date = appointment.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(appointment)
    return groups
  }, {} as Record<string, Appointment[]>)

  // Ordenar as datas
  const sortedDates = Object.keys(groupedAppointments).sort()

  const getDateLabel = (dateString: string) => {
    const date = parseISO(dateString)
    
    if (isToday(date)) {
      return 'Hoje'
    } else if (isTomorrow(date)) {
      return 'Amanhã'
    } else if (isYesterday(date)) {
      return 'Ontem'
    } else {
      return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })
    }
  }

  const getDateSubLabel = (dateString: string) => {
    const date = parseISO(dateString)
    return format(date, 'dd/MM/yyyy')
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center">
          <ListBulletIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Lista de Agendamentos
          </h3>
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {appointments.length} {appointments.length === 1 ? 'agendamento' : 'agendamentos'}
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {sortedDates.map((date) => {
          const dayAppointments = groupedAppointments[date]
          const dateObj = parseISO(date)
          
          return (
            <div key={date} className="px-4 py-6 sm:px-6">
              {/* Date Header */}
              <div className="mb-4">
                <div className="flex items-center space-x-3">
                  <div className={clsx(
                    'flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium',
                    isToday(dateObj)
                      ? 'bg-primary-100 text-primary-800'
                      : isTomorrow(dateObj)
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  )}>
                    {format(dateObj, 'd')}
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {getDateLabel(date)}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {getDateSubLabel(date)} • {dayAppointments.length} {dayAppointments.length === 1 ? 'agendamento' : 'agendamentos'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Appointments for this date */}
              <div className="space-y-4">
                {dayAppointments
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onStatusChange={onStatusChange}
                      onDelete={onDelete}
                    />
                  ))
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}