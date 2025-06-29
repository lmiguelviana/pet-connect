'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { ClientSelector } from '@/components/ui/client-selector';
import { PetSelector } from '@/components/ui/pet-selector';
import { ServiceSelector } from '@/components/ui/service-selector';
import { Client, Pet, Service, AppointmentFormData } from '@/types/appointments';
import { formatCurrency } from '@/lib/utils';

interface AppointmentFormProps {
  appointment?: AppointmentFormData;
  onSubmit: (data: AppointmentFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const appointmentSchema = z.object({
  client_id: z.string().min(1, 'Cliente é obrigatório'),
  pet_id: z.string().min(1, 'Pet é obrigatório'),
  service_id: z.string().min(1, 'Serviço é obrigatório'),
  appointment_date: z.string().min(1, 'Data é obrigatória'),
  appointment_time: z.string().min(1, 'Horário é obrigatório'),
  notes: z.string().optional(),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled']).default('scheduled')
});

export function AppointmentForm({ appointment, onSubmit, onCancel, loading = false }: AppointmentFormProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    appointment_date: '',
    appointment_time: '',
    notes: '',
    status: 'scheduled' as const
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const supabase = createClientComponentClient();

  // Carregar dados do agendamento para edição
  useEffect(() => {
    if (appointment) {
      loadAppointmentData();
    }
  }, [appointment]);

  // Carregar horários disponíveis quando serviço e data forem selecionados
  useEffect(() => {
    if (selectedService && formData.appointment_date) {
      loadAvailableSlots(formData.appointment_date, selectedService.duration_minutes);
    }
  }, [selectedService, formData.appointment_date]);

  const loadAppointmentData = async () => {
    if (!appointment) return;

    try {
      // Carregar dados completos do agendamento
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (*),
          pets (*),
          services (*)
        `)
        .eq('id', appointment.id)
        .single();

      if (error) throw error;

      if (data) {
        setSelectedClient(data.clients);
        setSelectedPet(data.pets);
        setSelectedService(data.services);
        setFormData({
          appointment_date: data.appointment_date,
          appointment_time: data.appointment_time,
          notes: data.notes || '',
          status: data.status
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do agendamento:', error);
    }
  };

  const loadServiceDetails = async (serviceId: string) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao carregar detalhes do serviço:', error);
      return null;
    }
  };

  const loadAvailableSlots = async (date: string, duration: number) => {
    setLoadingSlots(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!userData?.company_id) return;

      // Buscar agendamentos existentes para a data
      const { data: existingAppointments, error } = await supabase
        .from('appointments')
        .select('appointment_time, services(duration_minutes)')
        .eq('company_id', userData.company_id)
        .eq('appointment_date', date)
        .neq('status', 'cancelled');

      if (error) throw error;

      // Gerar horários disponíveis (8h às 18h, intervalos de 30min)
      const slots = [];
      for (let hour = 8; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push(time);
        }
      }

      // Filtrar horários ocupados
      const occupiedSlots = new Set();
      existingAppointments?.forEach(apt => {
        if (apt.appointment_time && apt.services?.duration_minutes) {
          const [hours, minutes] = apt.appointment_time.split(':').map(Number);
          const startTime = hours * 60 + minutes;
          const endTime = startTime + apt.services.duration_minutes;
          
          // Marcar todos os slots ocupados durante a duração do serviço
          for (let time = startTime; time < endTime; time += 30) {
            const h = Math.floor(time / 60);
            const m = time % 60;
            const slot = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            occupiedSlots.add(slot);
          }
        }
      });

      // Filtrar slots que não têm tempo suficiente para o serviço
      const availableSlots = slots.filter(slot => {
        const [hours, minutes] = slot.split(':').map(Number);
        const slotTime = hours * 60 + minutes;
        const endTime = slotTime + duration;
        
        // Verificar se o serviço cabe no horário de funcionamento
        if (endTime > 18 * 60) return false;
        
        // Verificar se algum slot necessário está ocupado
        for (let time = slotTime; time < endTime; time += 30) {
          const h = Math.floor(time / 60);
          const m = time % 60;
          const checkSlot = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          if (occupiedSlots.has(checkSlot)) return false;
        }
        
        return true;
      });

      setAvailableSlots(availableSlots);
    } catch (error) {
      console.error('Erro ao carregar horários disponíveis:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !selectedPet || !selectedService) {
      setErrors({
        general: 'Por favor, selecione cliente, pet e serviço'
      });
      return;
    }

    const appointmentData = {
      client_id: selectedClient.id,
      pet_id: selectedPet.id,
      service_id: selectedService.id,
      appointment_date: formData.appointment_date,
      appointment_time: formData.appointment_time,
      notes: formData.notes,
      status: formData.status,
      duration_minutes: selectedService.duration_minutes,
      price: selectedService.price
    };

    try {
      const validatedData = appointmentSchema.parse(appointmentData);
      await onSubmit(validatedData as AppointmentFormData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: 'Erro ao salvar agendamento' });
      }
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.general}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ClientSelector
          selectedClient={selectedClient}
          onClientSelect={setSelectedClient}
        />

        <PetSelector
          selectedPet={selectedPet}
          onPetSelect={setSelectedPet}
          clientId={selectedClient?.id}
        />
      </div>

      <ServiceSelector
        selectedService={selectedService}
        onServiceSelect={setSelectedService}
      />

      {selectedService && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Detalhes do Serviço</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Duração:</span>
              <span className="ml-2 font-medium">{selectedService.duration_minutes} minutos</span>
            </div>
            <div>
              <span className="text-gray-600">Preço:</span>
              <span className="ml-2 font-medium">{formatCurrency(selectedService.price)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data do Agendamento *
          </label>
          <input
            type="date"
            value={formData.appointment_date}
            onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
            min={today}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          {errors.appointment_date && (
            <p className="mt-1 text-sm text-red-600">{errors.appointment_date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horário *
          </label>
          {loadingSlots ? (
            <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
          ) : (
            <select
              value={formData.appointment_time}
              onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={!selectedService || !formData.appointment_date}
            >
              <option value="">Selecione um horário</option>
              {availableSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          )}
          {errors.appointment_time && (
            <p className="mt-1 text-sm text-red-600">{errors.appointment_time}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Observações
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Observações adicionais sobre o agendamento..."
        />
      </div>

      {appointment && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="scheduled">Agendado</option>
            <option value="confirmed">Confirmado</option>
            <option value="in_progress">Em Andamento</option>
            <option value="completed">Concluído</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
          disabled={loading || !selectedClient || !selectedPet || !selectedService}
        >
          {loading ? 'Salvando...' : appointment ? 'Atualizar' : 'Criar'} Agendamento
        </button>
      </div>
    </form>
  );
}