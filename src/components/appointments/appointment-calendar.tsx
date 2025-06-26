'use client'

import { useState } from 'react'
import { Appointment } from '@/types/appointments'
import { Button } from '@/components/ui/button'
import { AppointmentCard } from './appointment-card'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addWeeks, 
  subWeeks,
  isSameDay,
  isToday,
  parseISO
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clsx } from 'clsx'

interface AppointmentCalendarProps {
  appointments: Appointment[]
  loading: boolean
  selectedDate: Date
  onSelectedDateChange: (date: Date) => void
  onStatusChange: (appointmentId: string, status: Appointment['status']) => void
  onDelete: (appointmentId: string) => void
  onRefresh: () => void
}

export function AppointmentCalendar({
  appointments,
  loading,
  selectedDate,
  onSelectedDateChange,
  onStatusChange,
  onDelete,
  onRefresh
}: AppointmentCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(selectedDate)

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const goToPreviousWeek = () => {
    const newWeek = subWeeks(currentWeek, 1)
    setCurrentWeek(newWeek)
    onSelectedDateChange(newWeek)
  }

  const goToNextWeek = () => {
    const newWeek = addWeeks(currentWeek, 1)
    setCurrentWeek(newWeek)
    onSelectedDateChange(newWeek)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentWeek(today)
    onSelectedDateChange(today)
  }

  const getAppointmentsForDay = (day: Date) => {
    return appointments
      .filter(appointment => isSameDay(parseISO(appointment.date), day))
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ]

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-7 gap-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="space-y-1">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-16 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {format(weekStart, 'dd MMM', { locale: ptBR })} - {format(weekEnd, 'dd MMM yyyy', { locale: ptBR })}
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Days Header */}
        <div className="grid grid-cols-7 gap-4 mb-4">
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="text-center">
              <div className={clsx(
                'text-sm font-medium py-2 px-3 rounded-lg',
                isToday(day)
                  ? 'bg-primary-100 text-primary-800'
                  : 'text-gray-700'
              )}>
                <div className="text-xs text-gray-500 uppercase">
                  {format(day, 'EEE', { locale: ptBR })}
                </div>
                <div className="text-lg font-semibold">
                  {format(day, 'd')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Body */}
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dayAppointments = getAppointmentsForDay(day)
            
            return (
              <div key={day.toISOString()} className="min-h-[400px]">
                <div className={clsx(
                  'border rounded-lg p-2 h-full',
                  isToday(day)
                    ? 'border-primary-200 bg-primary-50'
                    : 'border-gray-200 bg-gray-50'
                )}>
                  <div className="space-y-1">
                    {dayAppointments.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        Nenhum agendamento
                      </div>
                    ) : (
                      dayAppointments.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          onStatusChange={onStatusChange}
                          onDelete={onDelete}
                          compact
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}