// Tipos aprimorados para agendamentos com maior especificidade

export type AppointmentStatus = 
  | 'scheduled'
  | 'confirmed' 
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled'

export type AppointmentPriority = 'low' | 'normal' | 'high' | 'urgent'

export type NotificationType = 
  | 'email_reminder'
  | 'sms_reminder'
  | 'whatsapp_reminder'
  | 'confirmation'
  | 'cancellation'
  | 'rescheduling'

export interface AppointmentStatusTransition {
  from: AppointmentStatus
  to: AppointmentStatus[]
  requiresReason?: boolean
  allowedRoles?: ('owner' | 'admin' | 'employee')[]
}

export const APPOINTMENT_TRANSITIONS: AppointmentStatusTransition[] = [
  {
    from: 'scheduled',
    to: ['confirmed', 'cancelled', 'rescheduled'],
    allowedRoles: ['owner', 'admin', 'employee']
  },
  {
    from: 'confirmed',
    to: ['in_progress', 'cancelled', 'no_show', 'rescheduled'],
    allowedRoles: ['owner', 'admin', 'employee']
  },
  {
    from: 'in_progress',
    to: ['completed', 'cancelled'],
    allowedRoles: ['owner', 'admin', 'employee']
  },
  {
    from: 'completed',
    to: [], // Status final
    allowedRoles: []
  },
  {
    from: 'cancelled',
    to: ['scheduled'], // Pode reagendar
    requiresReason: true,
    allowedRoles: ['owner', 'admin']
  },
  {
    from: 'no_show',
    to: ['scheduled'], // Pode reagendar
    requiresReason: true,
    allowedRoles: ['owner', 'admin']
  },
  {
    from: 'rescheduled',
    to: ['scheduled'],
    allowedRoles: ['owner', 'admin', 'employee']
  }
]

export interface AppointmentNotification {
  id: string
  appointment_id: string
  type: NotificationType
  recipient: string // email, phone, etc
  message: string
  scheduled_for: string
  sent_at?: string
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  error_message?: string
  retry_count: number
  created_at: string
  updated_at: string
}

export interface AppointmentRecurrence {
  id: string
  appointment_id: string
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number // every X days/weeks/months/years
  days_of_week?: number[] // for weekly: [1,2,3,4,5] = Mon-Fri
  day_of_month?: number // for monthly: 15 = 15th of each month
  end_date?: string
  max_occurrences?: number
  created_at: string
  updated_at: string
}

export interface AppointmentEnhanced {
  id: string
  date_time: string
  duration_minutes: number
  status: AppointmentStatus
  priority: AppointmentPriority
  notes: string | null
  internal_notes?: string // Only visible to staff
  service_price: number | null
  total_amount: number | null
  discount_amount?: number
  discount_reason?: string
  payment_status?: 'pending' | 'paid' | 'partial' | 'refunded'
  cancellation_reason?: string
  cancelled_by?: string
  cancelled_at?: string
  created_at: string
  updated_at: string
  
  // Foreign Keys
  client_id: string
  pet_id: string | null
  service_id: string
  company_id: string
  assigned_to?: string // user_id of assigned employee
  
  // Relacionamentos
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
  assigned_user?: {
    id: string
    name: string
    avatar_url?: string
  }
  notifications?: AppointmentNotification[]
  recurrence?: AppointmentRecurrence
}

export interface AppointmentFiltersEnhanced {
  status?: AppointmentStatus[]
  service_ids?: string[]
  client_ids?: string[]
  pet_ids?: string[]
  assigned_to?: string[]
  priority?: AppointmentPriority[]
  date_from?: string
  date_to?: string
  payment_status?: ('pending' | 'paid' | 'partial' | 'refunded')[]
  search?: string // Search in client name, pet name, notes
}

export interface AppointmentFormDataEnhanced {
  client_id: string
  pet_id?: string
  service_id: string
  date_time: string
  duration_minutes?: number
  priority: AppointmentPriority
  notes?: string
  internal_notes?: string
  service_price?: number
  discount_amount?: number
  discount_reason?: string
  assigned_to?: string
  recurrence?: Omit<AppointmentRecurrence, 'id' | 'appointment_id' | 'created_at' | 'updated_at'>
}

export interface AppointmentStats {
  total: number
  by_status: Record<AppointmentStatus, number>
  by_priority: Record<AppointmentPriority, number>
  revenue: {
    total: number
    pending: number
    paid: number
  }
  average_duration: number
  most_popular_services: Array<{
    service_id: string
    service_name: string
    count: number
  }>
  busiest_hours: Array<{
    hour: number
    count: number
  }>
  no_show_rate: number
  cancellation_rate: number
}