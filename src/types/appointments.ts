export interface Appointment {
  id: string
  date_time: string
  duration_minutes: number
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes: string | null
  service_price: number | null
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
    avatar_url?: string
  }
  pet: {
    id: string
    name: string
    species: string
    breed: string
    avatar_url?: string
  } | null
  service: {
    id: string
    name: string
    duration_minutes: number
    price: number
    category?: string
  }
  notifications?: {
    id: string
    type: string
    sent_at: string
  }[]
}

export interface AppointmentFilters {
  status: string
  service: string
  period: string
  date?: Date
}

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  avatar_url?: string
}

export interface Pet {
  id: string
  name: string
  species: string
  breed?: string
  age?: number
  weight?: number
  avatar_url?: string
  client_id: string
}

export interface Service {
  id: string
  name: string
  description?: string
  category: string
  price: number
  duration_minutes: number
}

export interface AppointmentFormData {
  id?: string
  client_id: string
  pet_id?: string
  service_id: string
  date: string
  start_time: string
  notes?: string
  send_notification: boolean
}

// Interface para dados do formulário com date_time unificado
export interface AppointmentFormDataUnified {
  id?: string
  client_id: string
  pet_id?: string
  service_id: string
  date_time: string
  duration_minutes: number
  notes?: string
  send_notification: boolean
}