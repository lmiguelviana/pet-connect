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
              Novo Agendamento
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Preencha as informações abaixo para criar um novo agendamento.
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
    </div>
  )
}