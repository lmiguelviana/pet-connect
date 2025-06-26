'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { AppointmentForm } from '@/components/appointments/appointment-form'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { Appointment } from '@/types/appointments'

export default function EditAppointmentPage() {
  const params = useParams()
  const router = useRouter()
  const { company } = useAuth()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const appointmentId = params.id as string

  useEffect(() => {
    if (appointmentId) {
      loadAppointment()
    }
  }, [appointmentId])

  const loadAppointment = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .eq('company_id', company!.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          toast.error('Agendamento não encontrado')
          router.push('/appointments')
          return
        }
        throw error
      }

      setAppointment(data)
    } catch (error: any) {
      console.error('Erro ao carregar agendamento:', error)
      toast.error('Erro ao carregar agendamento')
      router.push('/appointments')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 space-y-6">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Agendamento não encontrado
            </h1>
            <Link
              href="/appointments"
              className="inline-flex items-center text-primary-600 hover:text-primary-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Voltar para agendamentos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/appointments"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Voltar para agendamentos
            </Link>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Editar Agendamento
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Atualize as informações do agendamento abaixo.
            </p>
          </div>
        </div>

        {/* Form */}
        <AppointmentForm
          initialData={{
            id: appointment.id,
            client_id: appointment.client_id,
            pet_id: appointment.pet_id || '',
            service_id: appointment.service_id,
            date: new Date(appointment.date_time).toISOString().split('T')[0],
            start_time: new Date(appointment.date_time).toTimeString().slice(0, 5),
            notes: appointment.notes || '',
          }}
          isEditing={true}
        />
      </div>
    </div>
  )
}