export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          plan_type: 'free' | 'premium'
          subscription_status: 'active' | 'inactive' | 'trial' | 'cancelled'
          trial_ends_at: string | null
          subscription_ends_at: string | null
          created_at: string
          updated_at: string
          settings: Json | null
          logo_url: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          plan_type?: 'free' | 'premium'
          subscription_status?: 'active' | 'inactive' | 'trial' | 'cancelled'
          trial_ends_at?: string | null
          subscription_ends_at?: string | null
          created_at?: string
          updated_at?: string
          settings?: Json | null
          logo_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          plan_type?: 'free' | 'premium'
          subscription_status?: 'active' | 'inactive' | 'trial' | 'cancelled'
          trial_ends_at?: string | null
          subscription_ends_at?: string | null
          created_at?: string
          updated_at?: string
          settings?: Json | null
          logo_url?: string | null
        }
      }
      users: {
        Row: {
          id: string
          company_id: string
          email: string
          name: string
          role: 'owner' | 'admin' | 'employee'
          avatar_url: string | null
          phone: string | null
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_id: string
          email: string
          name: string
          role?: 'owner' | 'admin' | 'employee'
          avatar_url?: string | null
          phone?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          email?: string
          name?: string
          role?: 'owner' | 'admin' | 'employee'
          avatar_url?: string | null
          phone?: string | null
          is_active?: boolean
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          company_id: string
          name: string
          email: string | null
          phone: string
          address: string | null
          avatar_url: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          email?: string | null
          phone: string
          address?: string | null
          avatar_url?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          email?: string | null
          phone?: string
          address?: string | null
          avatar_url?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      pets: {
        Row: {
          id: string
          client_id: string
          company_id: string
          name: string
          species: string
          breed: string | null
          age: number | null
          weight: number | null
          color: string | null
          gender: 'male' | 'female' | 'unknown'
          avatar_url: string | null
          medical_history: Json | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          company_id: string
          name: string
          species: string
          breed?: string | null
          age?: number | null
          weight?: number | null
          color?: string | null
          gender?: 'male' | 'female' | 'unknown'
          avatar_url?: string | null
          medical_history?: Json | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          company_id?: string
          name?: string
          species?: string
          breed?: string | null
          age?: number | null
          weight?: number | null
          color?: string | null
          gender?: 'male' | 'female' | 'unknown'
          avatar_url?: string | null
          medical_history?: Json | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}