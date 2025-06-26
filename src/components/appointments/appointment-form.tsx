'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ClientSelector } from '@/components/ui/client-selector'
import { PetSelector } from '@/components/ui/pet-selector'
import { ServiceSelector } from '@/components/ui/service-selector'
import { TimeSlotPicker } from '@/components/ui/time-slot-picker'
import { toast } from 'react-hot-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, addMinutes, parseISO } from 'date-fns'
import { AppointmentFormData } from '@/types/appointments'

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