export interface Pet {
  id: string
  client_id: string
  company_id: string
  name: string
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'fish' | 'reptile' | 'other'
  breed?: string
  gender: 'male' | 'female'
  birth_date?: string
  weight?: number
  color?: string
  size: 'small' | 'medium' | 'large' | 'extra_large'
  medical_history?: string
  allergies?: string
  medications?: string
  veterinarian_contact?: string
  temperament?: string
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
  photos?: PetPhoto[]
}

export interface PetPhoto {
  id: string
  pet_id: string
  photo_url: string
  file_name: string
  file_size: number
  mime_type: string
  caption?: string
  tags?: string[]
  is_profile_photo: boolean
  created_at: string
  updated_at: string
}

export interface PetFormData {
  name: string
  client_id: string
  species: Pet['species']
  breed?: string
  gender: Pet['gender']
  birth_date?: string
  weight?: number
  color?: string
  size: Pet['size']
  medical_history?: string
  allergies?: string
  medications?: string
  veterinarian_contact?: string
  temperament?: string
}

export interface PetStats {
  total: number
  dogs: number
  cats: number
  others: number
  averageAge: number
  activeThisMonth: number
}

export interface PetFilters {
  status: 'all' | 'active' | 'inactive'
  species: 'all' | Pet['species']
  client_id: 'all' | string
  search: string
}

export const PET_SPECIES_OPTIONS = [
  { value: 'dog', label: 'Cão' },
  { value: 'cat', label: 'Gato' },
  { value: 'bird', label: 'Pássaro' },
  { value: 'rabbit', label: 'Coelho' },
  { value: 'hamster', label: 'Hamster' },
  { value: 'fish', label: 'Peixe' },
  { value: 'reptile', label: 'Réptil' },
  { value: 'other', label: 'Outro' },
] as const

export const PET_SIZE_OPTIONS = [
  { value: 'small', label: 'Pequeno' },
  { value: 'medium', label: 'Médio' },
  { value: 'large', label: 'Grande' },
  { value: 'extra_large', label: 'Extra Grande' },
] as const

export const PET_GENDER_OPTIONS = [
  { value: 'male', label: 'Macho' },
  { value: 'female', label: 'Fêmea' },
] as const