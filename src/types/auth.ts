// Tipos para autenticação e cadastro

import { PlanType } from './index'

export interface CompanySignUpData {
  name: string
  email: string
  phone?: string
  address?: string
  plan_type?: PlanType
  settings?: {
    business_hours?: {
      [key: string]: {
        open: string
        close: string
        closed?: boolean
      }
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
}

export interface SignInCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  companyData: CompanySignUpData
}

export interface AuthResponse {
  error?: string
  user?: any // Supabase User type
  session?: any // Supabase Session type
}

export interface ResetPasswordData {
  email: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url?: string
  phone?: string
  role: 'owner' | 'admin' | 'employee'
  company_id: string
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}