# 📅 Fase 06 - Sistema de Agendamentos

## 📋 Objetivos da Fase

- Implementar CRUD completo de agendamentos
- Criar calendário interativo para visualização
- Implementar sistema de horários disponíveis
- Adicionar notificações automáticas
- Criar diferentes tipos de serviços
- Implementar confirmação e cancelamento
- Adicionar sistema de recorrência

## ⏱️ Estimativa: 6-7 dias

## 🛠️ Tarefas Detalhadas

### 1. Estrutura Base do Módulo de Agendamentos

#### 1.1 Página Principal de Agendamentos
```typescript
// src/app/(dashboard)/appointments/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { AppointmentCalendar } from '@/components/appointments/appointment-calendar'
import { AppointmentsList } from '@/components/appointments/appointments-list'
import { AppointmentFilters } from '@/components/appointments/appointment-filters'
import { AppointmentStats } from '@/components/appointments/appointment-stats'
import { Button } from '@/components/ui/button'
import { PlusIcon, CalendarIcon, ListBulletIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { format, startOfDay, endOfDay, addDays, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clsx } from 'clsx'

export interface Appointment {
  id: string
  date: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes: string | null
  total_amount: number | null
  created_at: string
  updated_at: string
  client_id: string
  pet_id: string | null
  service_id: string
  company_id: string
  client: {
    id: string
    name: string
    phone: string
    email: string | null
  }
  pet: {
    id: string
    name: string
    species: string
    breed: string
  } | null
  service: {
    id: string
    name: string
    duration: number
    price: number
    color: string
  }
  notifications_sent: {
    id: string
    type: string
    sent_at: string
  }[]
}

export default function AppointmentsPage() {
  const { company } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week')
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadAppointments()
    }
  }, [company?.id, selectedDate, statusFilter, serviceFilter, dateRange])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      
      // Calcular range de datas baseado no filtro
      let startDate: Date
      let endDate: Date
      
      switch (dateRange) {
        case 'today':
          startDate = startOfDay(selectedDate)
          endDate = endOfDay(selectedDate)
          break
        case 'week':
          startDate = startOfDay(subDays(selectedDate, 3))
          endDate = endOfDay(addDays(selectedDate, 3))
          break
        case 'month':
          startDate = startOfDay(subDays(selectedDate, 15))
          endDate = endOfDay(addDays(selectedDate, 15))
          break
      }

      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:clients!inner(
            id,
            name,
            phone,
            email
          ),
          pet:pets(
            id,
            name,
            species,
            breed
          ),
          service:services!inner(
            id,
            name,
            duration,
            price,
            color
          ),
          notifications:notifications(
            id,
            type,
            sent_at
          )
        `)
        .eq('company_id', company!.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))

      // Aplicar filtros
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (serviceFilter !== 'all') {
        query = query.eq('service_id', serviceFilter)
      }

      // Ordenar por data e hora
      query = query.order('date', { ascending: true })
                   .order('start_time', { ascending: true })

      const { data, error } = await query

      if (error) throw error

      setAppointments(data || [])
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
      toast.error('Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId)
        .eq('company_id', company!.id)

      if (error) throw error

      toast.success('Status atualizado com sucesso')
      loadAppointments()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)
        .eq('company_id', company!.id)

      if (error) throw error

      toast.success('Agendamento removido com sucesso')
      loadAppointments()
    } catch (error) {
      console.error('Erro ao remover agendamento:', error)
      toast.error('Erro ao remover agendamento')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
            Agendamentos
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie todos os agendamentos e consultas
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          {/* View Mode Toggle */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('calendar')}
              className={clsx(
                'px-3 py-2 text-sm font-medium rounded-l-md border',
                viewMode === 'calendar'
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              )}
            >
              <CalendarIcon className="h-4 w-4 mr-1 inline" />
              Calendário
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b',
                viewMode === 'list'
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              )}
            >
              <ListBulletIcon className="h-4 w-4 mr-1 inline" />
              Lista
            </button>
          </div>
          
          <Link href="/appointments/new">
            <Button className="inline-flex items-center">
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Novo Agendamento
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <AppointmentStats appointments={appointments} loading={loading} />

      {/* Filters */}
      <AppointmentFilters
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        serviceFilter={serviceFilter}
        onServiceFilterChange={setServiceFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
      />

      {/* Content */}
      {viewMode === 'calendar' ? (
        <AppointmentCalendar
          appointments={appointments}
          loading={loading}
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteAppointment}
          onRefresh={loadAppointments}
        />
      ) : (
        <AppointmentsList
          appointments={appointments}
          loading={loading}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteAppointment}
          onRefresh={loadAppointments}
        />
      )}
    </div>
  )
}
```

#### 1.2 Componente de Estatísticas dos Agendamentos
```typescript
// src/components/appointments/appointment-stats.tsx
import { Appointment } from '@/app/(dashboard)/appointments/page'
import { 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { format, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AppointmentStatsProps {
  appointments: Appointment[]
  loading: boolean
}

export function AppointmentStats({ appointments, loading }: AppointmentStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const today = new Date()
  const todayAppointments = appointments.filter(apt => isToday(new Date(apt.date)))
  const tomorrowAppointments = appointments.filter(apt => isTomorrow(new Date(apt.date)))
  const completedAppointments = appointments.filter(apt => apt.status === 'completed')
  const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled')
  const totalRevenue = completedAppointments.reduce((sum, apt) => sum + (apt.total_amount || 0), 0)

  const stats = [
    {
      name: 'Hoje',
      value: todayAppointments.length,
      icon: CalendarIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: `${todayAppointments.filter(apt => apt.status === 'completed').length} concluídos`,
      changeType: 'positive',
    },
    {
      name: 'Amanhã',
      value: tomorrowAppointments.length,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: `${tomorrowAppointments.filter(apt => apt.status === 'confirmed').length} confirmados`,
      changeType: 'neutral',
    },
    {
      name: 'Concluídos',
      value: completedAppointments.length,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: `${Math.round((completedAppointments.length / appointments.length) * 100) || 0}%`,
      changeType: 'positive',
    },
    {
      name: 'Cancelados',
      value: cancelledAppointments.length,
      icon: XCircleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: `${Math.round((cancelledAppointments.length / appointments.length) * 100) || 0}%`,
      changeType: 'negative',
    },
    {
      name: 'Receita',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(totalRevenue),
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: `${completedAppointments.length} serviços`,
      changeType: 'positive',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`rounded-md p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                  </dd>
                  {stat.change && (
                    <dd className="text-xs text-gray-600">
                      {stat.change}
                    </dd>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 2. Calendário de Agendamentos

#### 2.1 Componente do Calendário
```typescript
// src/components/appointments/appointment-calendar.tsx
'use client'

import { useState } from 'react'
import { Appointment } from '@/app/(dashboard)/appointments/page'
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
```

### 3. Formulário de Novo Agendamento

#### 3.1 Página de Novo Agendamento
```typescript
// src/app/(dashboard)/appointments/new/page.tsx
'use client'

import { AppointmentForm } from '@/components/appointments/appointment-form'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function NewAppointmentPage() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client_id')
  const petId = searchParams.get('pet_id')
  const serviceId = searchParams.get('service_id')
  const date = searchParams.get('date')
  const time = searchParams.get('time')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/appointments"
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Voltar para agendamentos
        </Link>
      </div>

      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
            Novo Agendamento
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Agende um novo serviço para um cliente
          </p>
        </div>
      </div>

      {/* Form */}
      <AppointmentForm
        preSelectedClientId={clientId}
        preSelectedPetId={petId}
        preSelectedServiceId={serviceId}
        preSelectedDate={date}
        preSelectedTime={time}
      />
    </div>
  )
}
```

#### 3.2 Componente do Formulário de Agendamento
```typescript
// src/components/appointments/appointment-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ClientSelector } from '@/components/ui/client-selector'
import { PetSelector } from '@/components/ui/pet-selector'
import { ServiceSelector } from '@/components/ui/service-selector'
import { TimeSlotPicker } from '@/components/ui/time-slot-picker'
import { toast } from 'react-hot-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, addMinutes, parseISO } from 'date-fns'

const appointmentSchema = z.object({
  client_id: z.string().min(1, 'Selecione um cliente'),
  pet_id: z.string().optional(),
  service_id: z.string().min(1, 'Selecione um serviço'),
  date: z.string().min(1, 'Selecione uma data'),
  start_time: z.string().min(1, 'Selecione um horário'),
  notes: z.string().optional(),
  send_notification: z.boolean().default(true),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface AppointmentFormProps {
  initialData?: Partial<AppointmentFormData & { id: string }>
  isEditing?: boolean
  preSelectedClientId?: string | null
  preSelectedPetId?: string | null
  preSelectedServiceId?: string | null
  preSelectedDate?: string | null
  preSelectedTime?: string | null
}

export function AppointmentForm({
  initialData,
  isEditing = false,
  preSelectedClientId,
  preSelectedPetId,
  preSelectedServiceId,
  preSelectedDate,
  preSelectedTime
}: AppointmentFormProps) {
  const router = useRouter()
  const { company } = useAuth()
  const [loading, setLoading] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      client_id: preSelectedClientId || initialData?.client_id || '',
      pet_id: preSelectedPetId || initialData?.pet_id || '',
      service_id: preSelectedServiceId || initialData?.service_id || '',
      date: preSelectedDate || initialData?.date || '',
      start_time: preSelectedTime || initialData?.start_time || '',
      notes: initialData?.notes || '',
      send_notification: true,
    },
  })

  const watchedDate = watch('date')
  const watchedServiceId = watch('service_id')

  // Load service details when service changes
  useEffect(() => {
    if (watchedServiceId) {
      loadServiceDetails(watchedServiceId)
    }
  }, [watchedServiceId])

  // Load available time slots when date or service changes
  useEffect(() => {
    if (watchedDate && selectedService) {
      loadAvailableSlots(watchedDate, selectedService.duration)
    }
  }, [watchedDate, selectedService])

  const loadServiceDetails = async (serviceId: string) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('company_id', company!.id)
        .single()

      if (error) throw error
      setSelectedService(data)
    } catch (error) {
      console.error('Erro ao carregar serviço:', error)
    }
  }

  const loadAvailableSlots = async (date: string, serviceDuration: number) => {
    try {
      // Buscar agendamentos existentes para a data
      const { data: existingAppointments, error } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('date', date)
        .eq('company_id', company!.id)
        .neq('status', 'cancelled')

      if (error) throw error

      // Gerar slots disponíveis (8:00 às 18:00, intervalos de 30 min)
      const allSlots: string[] = []
      for (let hour = 8; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          allSlots.push(time)
        }
      }

      // Filtrar slots ocupados
      const availableSlots = allSlots.filter(slot => {
        const slotStart = slot
        const slotEnd = format(addMinutes(parseISO(`2000-01-01T${slot}:00`), serviceDuration), 'HH:mm')

        // Verificar se o slot conflita com algum agendamento existente
        return !existingAppointments?.some(appointment => {
          const appointmentStart = appointment.start_time
          const appointmentEnd = appointment.end_time

          // Verificar sobreposição
          return (
            (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
            (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
            (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
          )
        })
      })

      setAvailableSlots(availableSlots)
    } catch (error) {
      console.error('Erro ao carregar horários disponíveis:', error)
      setAvailableSlots([])
    }
  }

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      setLoading(true)

      if (!selectedService) {
        toast.error('Selecione um serviço válido')
        return
      }

      // Calcular horário de término
      const startTime = parseISO(`2000-01-01T${data.start_time}:00`)
      const endTime = addMinutes(startTime, selectedService.duration)
      const endTimeString = format(endTime, 'HH:mm')

      const appointmentData = {
        client_id: data.client_id,
        pet_id: data.pet_id || null,
        service_id: data.service_id,
        date: data.date,
        start_time: data.start_time,
        end_time: endTimeString,
        status: 'scheduled' as const,
        notes: data.notes || null,
        total_amount: selectedService.price,
        company_id: company!.id,
      }

      let appointmentId: string

      if (isEditing && initialData?.id) {
        const { error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', initialData.id)
          .eq('company_id', company!.id)

        if (error) throw error
        appointmentId = initialData.id
        toast.success('Agendamento atualizado com sucesso!')
      } else {
        const { data: newAppointment, error } = await supabase
          .from('appointments')
          .insert([appointmentData])
          .select('id')
          .single()

        if (error) throw error
        appointmentId = newAppointment.id
        toast.success('Agendamento criado com sucesso!')
      }

      // Enviar notificação se solicitado
      if (data.send_notification && !isEditing) {
        try {
          await supabase.functions.invoke('send-appointment-notification', {
            body: {
              appointmentId,
              type: 'confirmation'
            }
          })
        } catch (notificationError) {
          console.error('Erro ao enviar notificação:', notificationError)
          // Não falhar o agendamento por causa da notificação
        }
      }

      router.push('/appointments')
    } catch (error: any) {
      console.error('Erro ao salvar agendamento:', error)
      toast.error(error.message || 'Erro ao salvar agendamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Client Selection */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <ClientSelector
                value={watch('client_id')}
                onChange={(clientId) => setValue('client_id', clientId)}
                disabled={!!preSelectedClientId}
              />
              {errors.client_id && (
                <p className="mt-1 text-sm text-red-600">{errors.client_id.message}</p>
              )}
            </div>

            {/* Pet Selection */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pet (Opcional)
              </label>
              <PetSelector
                clientId={watch('client_id')}
                value={watch('pet_id')}
                onChange={(petId) => setValue('pet_id', petId)}
                disabled={!watch('client_id')}
              />
              {errors.pet_id && (
                <p className="mt-1 text-sm text-red-600">{errors.pet_id.message}</p>
              )}
            </div>

            {/* Service Selection */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serviço *
              </label>
              <ServiceSelector
                value={watch('service_id')}
                onChange={(serviceId) => setValue('service_id', serviceId)}
              />
              {errors.service_id && (
                <p className="mt-1 text-sm text-red-600">{errors.service_id.message}</p>
              )}
              {selectedService && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <div className="flex justify-between text-sm">
                    <span>Duração: {selectedService.duration} minutos</span>
                    <span>Preço: {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(selectedService.price)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Data *
              </label>
              <input
                type="date"
                id="date"
                {...register('date')}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Time Selection */}
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                Horário *
              </label>
              <TimeSlotPicker
                availableSlots={availableSlots}
                selectedSlot={watch('start_time')}
                onSlotSelect={(slot) => setValue('start_time', slot)}
                disabled={!watchedDate || !selectedService}
              />
              {errors.start_time && (
                <p className="mt-1 text-sm text-red-600">{errors.start_time.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Observações
              </label>
              <textarea
                id="notes"
                rows={3}
                {...register('notes')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Informações adicionais sobre o agendamento..."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>

            {/* Send Notification */}
            {!isEditing && (
              <div className="sm:col-span-2">
                <div className="flex items-center">
                  <input
                    id="send_notification"
                    type="checkbox"
                    {...register('send_notification')}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="send_notification" className="ml-2 block text-sm text-gray-900">
                    Enviar notificação de confirmação para o cliente
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {isEditing ? 'Atualizar Agendamento' : 'Criar Agendamento'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
```

## ✅ Critérios de Aceitação

- [ ] CRUD completo de agendamentos implementado
- [ ] Calendário semanal funcionando
- [ ] Sistema de horários disponíveis implementado
- [ ] Formulário de agendamento com validações
- [ ] Diferentes status de agendamento
- [ ] Integração com clientes, pets e serviços
- [ ] Cálculo automático de horário de término
- [ ] Prevenção de conflitos de horário
- [ ] Notificações automáticas (opcional)
- [ ] Filtros por status, serviço e data
- [ ] Visualização em calendário e lista
- [ ] Responsividade implementada
- [ ] Integração com Supabase funcionando

## 🔄 Próximos Passos

Após completar esta fase:
1. **Fase 07**: Implementar módulo de serviços
2. Adicionar sistema de recorrência
3. Implementar lembretes automáticos
4. Criar relatórios de agendamentos

## 📝 Notas Importantes

- Implementar validação de horário comercial
- Adicionar suporte para feriados
- Configurar timezone adequado
- Implementar sistema de lista de espera
- Otimizar carregamento do calendário
- Adicionar exportação para Google Calendar
- Implementar confirmação por WhatsApp/SMS
- Criar templates de notificação personalizáveis

---

**Tempo estimado: 6-7 dias**  
**Complexidade: Alta**  
**Dependências: Fases 04 e 05 concluídas**