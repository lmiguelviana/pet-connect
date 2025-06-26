'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { AppointmentCalendar } from '@/components/appointments/appointment-calendar'
import { AppointmentList } from '@/components/appointments/appointment-list'
import { AppointmentFilters } from '@/components/appointments/appointment-filters'
import { AppointmentStats } from '@/components/appointments/appointment-stats'
import { Button } from '@/components/ui/button'
import { PlusIcon, CalendarIcon, ListBulletIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { clsx } from 'clsx'
import { Appointment, AppointmentFilters as Filters } from '@/types/appointments'

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
        filters={{
          status: statusFilter,
          service: serviceFilter,
          period: dateRange,
          date: selectedDate
        }}
        onFiltersChange={(newFilters) => {
          setStatusFilter(newFilters.status)
          setServiceFilter(newFilters.service)
          setDateRange(newFilters.period as 'today' | 'week' | 'month')
          if (newFilters.date) setSelectedDate(newFilters.date)
        }}
        onClearFilters={() => {
          setStatusFilter('all')
          setServiceFilter('all')
          setDateRange('week')
        }}
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
        <AppointmentList
          appointments={appointments}
          loading={loading}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteAppointment}
        />
      )}
    </div>
  )
}