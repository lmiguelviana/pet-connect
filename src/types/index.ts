// Tipos de Planos
export type PlanType = 'free' | 'premium'

export type SubscriptionStatus = 'active' | 'inactive' | 'trial' | 'cancelled'

// Tipos de Usuário
export type UserRole = 'owner' | 'admin' | 'employee'

// Tipos de Pet
export type PetGender = 'male' | 'female' | 'unknown'

export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'reptile' | 'other'

// Interfaces principais
export interface Company {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  plan_type: PlanType
  subscription_status: SubscriptionStatus
  trial_ends_at?: string
  subscription_ends_at?: string
  created_at: string
  updated_at: string
  settings?: CompanySettings
  logo_url?: string
}

export interface CompanySettings {
  business_hours?: {
    monday?: { open: string; close: string; closed?: boolean }
    tuesday?: { open: string; close: string; closed?: boolean }
    wednesday?: { open: string; close: string; closed?: boolean }
    thursday?: { open: string; close: string; closed?: boolean }
    friday?: { open: string; close: string; closed?: boolean }
    saturday?: { open: string; close: string; closed?: boolean }
    sunday?: { open: string; close: string; closed?: boolean }
  }
  notifications?: {
    email_enabled?: boolean
    whatsapp_enabled?: boolean
    reminder_hours?: number
  }
  branding?: {
    primary_color?: string
    secondary_color?: string
    logo_url?: string
  }
}

export interface User {
  id: string
  company_id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  phone?: string
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  company_id: string
  name: string
  email?: string
  phone: string
  address?: string
  avatar_url?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  pets?: Pet[]
}

export interface Pet {
  id: string
  client_id: string
  company_id: string
  name: string
  species: string
  breed?: string
  age?: number
  weight?: number
  color?: string
  gender: PetGender
  avatar_url?: string
  medical_history?: MedicalRecord[]
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  client?: Client
}

export interface MedicalRecord {
  id: string
  date: string
  type: 'vaccination' | 'medication' | 'surgery' | 'checkup' | 'treatment' | 'other'
  description: string
  veterinarian?: string
  notes?: string
  attachments?: string[]
}

// Tipos para formulários
export interface CreateCompanyData {
  name: string
  email: string
  phone?: string
  address?: string
}

export interface CreateUserData {
  email: string
  name: string
  role?: UserRole
  phone?: string
}

export interface CreateClientData {
  name: string
  email?: string
  phone: string
  address?: string
  notes?: string
}

export interface CreatePetData {
  client_id: string
  name: string
  species: string
  breed?: string
  age?: number
  weight?: number
  color?: string
  gender: PetGender
  notes?: string
}

// Tipos para limitações de plano
export interface PlanLimits {
  max_clients: number
  max_pets: number
  max_users: number
  max_photos_per_pet: number
  features: {
    photo_gallery: boolean
    whatsapp_integration: boolean
    advanced_reports: boolean
    custom_branding: boolean
    api_access: boolean
  }
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    max_clients: 20,
    max_pets: 30,
    max_users: 1,
    max_photos_per_pet: 3,
    features: {
      photo_gallery: false,
      whatsapp_integration: false,
      advanced_reports: false,
      custom_branding: false,
      api_access: false,
    },
  },
  premium: {
    max_clients: -1, // Ilimitado
    max_pets: -1, // Ilimitado
    max_users: -1, // Ilimitado
    max_photos_per_pet: -1, // Ilimitado
    features: {
      photo_gallery: true,
      whatsapp_integration: true,
      advanced_reports: true,
      custom_branding: true,
      api_access: true,
    },
  },
}

// Tipos para API responses
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Tipos para filtros e busca
export interface ClientFilters {
  search?: string
  is_active?: boolean
  created_after?: string
  created_before?: string
}

export interface PetFilters {
  search?: string
  species?: string
  client_id?: string
  is_active?: boolean
  created_after?: string
  created_before?: string
}