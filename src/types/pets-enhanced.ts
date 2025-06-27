// Tipos aprimorados para pets com maior especificidade

export type PetTemperament = 
  | 'calm'
  | 'energetic'
  | 'aggressive'
  | 'friendly'
  | 'shy'
  | 'playful'
  | 'anxious'
  | 'protective'
  | 'independent'
  | 'social'

export type PetSize = 'small' | 'medium' | 'large' | 'extra_large'

export type PetSpeciesDetailed = {
  dog: {
    breeds: string[]
    commonSizes: PetSize[]
    lifespan: { min: number; max: number }
  }
  cat: {
    breeds: string[]
    commonSizes: PetSize[]
    lifespan: { min: number; max: number }
  }
  bird: {
    breeds: string[]
    commonSizes: PetSize[]
    lifespan: { min: number; max: number }
  }
  rabbit: {
    breeds: string[]
    commonSizes: PetSize[]
    lifespan: { min: number; max: number }
  }
  hamster: {
    breeds: string[]
    commonSizes: PetSize[]
    lifespan: { min: number; max: number }
  }
  fish: {
    breeds: string[]
    commonSizes: PetSize[]
    lifespan: { min: number; max: number }
  }
  reptile: {
    breeds: string[]
    commonSizes: PetSize[]
    lifespan: { min: number; max: number }
  }
  other: {
    breeds: string[]
    commonSizes: PetSize[]
    lifespan: { min: number; max: number }
  }
}

export interface PetMedicalRecord {
  id: string
  pet_id: string
  date: string
  type: 'vaccination' | 'checkup' | 'surgery' | 'medication' | 'injury' | 'illness' | 'other'
  title: string
  description: string
  veterinarian: string
  cost?: number
  next_appointment?: string
  attachments?: string[]
  created_at: string
  updated_at: string
}

export interface PetVaccination {
  id: string
  pet_id: string
  vaccine_name: string
  date_administered: string
  next_due_date?: string
  veterinarian: string
  batch_number?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface PetAllergy {
  id: string
  pet_id: string
  allergen: string
  severity: 'mild' | 'moderate' | 'severe'
  symptoms: string[]
  treatment?: string
  discovered_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface PetMedication {
  id: string
  pet_id: string
  medication_name: string
  dosage: string
  frequency: string
  start_date: string
  end_date?: string
  prescribed_by: string
  reason: string
  side_effects?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PetEnhanced {
  id: string
  client_id: string
  company_id: string
  name: string
  species: keyof PetSpeciesDetailed
  breed?: string
  gender: 'male' | 'female'
  birth_date?: string
  weight?: number
  color?: string
  size: PetSize
  temperament?: PetTemperament[]
  medical_history?: string
  allergies?: PetAllergy[]
  medications?: PetMedication[]
  vaccinations?: PetVaccination[]
  medical_records?: PetMedicalRecord[]
  veterinarian_contact?: {
    name: string
    phone: string
    email?: string
    clinic: string
  }
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Relacionamentos
  client?: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  photos?: import('./pets').PetPhoto[]
}

export interface PetFormDataEnhanced {
  name: string
  client_id: string
  species: keyof PetSpeciesDetailed
  breed?: string
  gender: 'male' | 'female'
  birth_date?: string
  weight?: number
  color?: string
  size: PetSize
  temperament?: PetTemperament[]
  medical_history?: string
  veterinarian_contact?: {
    name: string
    phone: string
    email?: string
    clinic: string
  }
  avatar_url?: string
}