// Types para o módulo de Serviços

export interface AvailableHours {
  [day: string]: {
    start: string // "09:00"
    end: string   // "18:00"
    breaks?: Array<{
      start: string
      end: string
    }>
  }
}

export interface PackageServiceRaw {
  id: string
  service_id: string
  quantity: number
  service: Service
}

export interface Service {
  id: string
  company_id: string
  name: string
  description?: string
  category: string
  price: number
  duration_minutes: number
  is_active: boolean
  requires_appointment: boolean
  max_pets_per_session: number
  available_days: number[] // [1,2,3,4,5,6,7] - 1=Monday, 7=Sunday
  available_hours: AvailableHours // JSONB field from database
  created_at: string
  updated_at: string
}

export interface ServicePhoto {
  id: string
  service_id: string
  company_id: string
  url: string
  is_primary: boolean
  caption?: string
  created_at: string
  updated_at: string
}

export interface ServiceWithPhotos extends Service {
  photos: ServicePhoto[]
  primary_photo?: ServicePhoto
}

export interface ServicePackage {
  id?: string
  company_id: string
  name: string
  description: string
  services: PackageService[]
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  total_price: number
  final_price: number
  is_active: boolean
  valid_until?: string
  created_at?: string
  updated_at?: string
}

export interface PackageService {
  service_id: string
  service: Service
  quantity: number
  unit_price: number
  total_price: number
}

export interface ServiceWithPhotos extends Service {
  photos: ServicePhoto[]
  primary_photo?: ServicePhoto
}

// Categorias de serviços predefinidas
export const SERVICE_CATEGORIES = [
  'banho',
  'tosa',
  'banho-e-tosa',
  'veterinario',
  'consulta',
  'vacina',
  'cirurgia',
  'estetica',
  'spa',
  'hotel',
  'daycare',
  'adestramento',
  'outros'
] as const

export type ServiceCategory = typeof SERVICE_CATEGORIES[number]

// Cores predefinidas para serviços
export const SERVICE_COLORS = [
  '#10B981', // Verde principal
  '#3B82F6', // Azul
  '#8B5CF6', // Roxo
  '#F59E0B', // Amarelo
  '#EF4444', // Vermelho
  '#EC4899', // Rosa
  '#06B6D4', // Ciano
  '#84CC16', // Lima
  '#F97316', // Laranja
  '#6B7280'  // Cinza
] as const

export type ServiceColor = typeof SERVICE_COLORS[number]

// Dias da semana
export const WEEKDAYS = [
  'monday',
  'tuesday', 
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const

export type Weekday = typeof WEEKDAYS[number]

// Labels para os dias da semana
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

// Labels para as categorias
export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  'banho': 'Banho',
  'tosa': 'Tosa',
  'banho-e-tosa': 'Banho e Tosa',
  'veterinario': 'Veterinário',
  'consulta': 'Consulta',
  'vacina': 'Vacina',
  'cirurgia': 'Cirurgia',
  'estetica': 'Estética',
  'spa': 'SPA',
  'hotel': 'Hotel',
  'daycare': 'Day Care',
  'adestramento': 'Adestramento',
  'outros': 'Outros'
}

// Filtros para a listagem de serviços
export interface ServiceFilters {
  search: string
  category: ServiceCategory | 'all'
  status: 'all' | 'active' | 'inactive'
  price_range: {
    min: number
    max: number
  }
}

// Estatísticas dos serviços
export interface ServiceStats {
  total: number
  active: number
  inactive: number
  by_category: Record<ServiceCategory, number>
  average_price: number
  average_duration: number
}

// Form data para criação/edição de serviços
export interface ServiceFormData {
  name: string
  description?: string
  category: ServiceCategory
  price: number
  duration_minutes: number
  is_active: boolean
  requires_appointment: boolean
  max_pets_per_session: number
  available_days: Weekday[]
  available_hours: {
    start: string
    end: string
  }
  color?: ServiceColor
  photos?: File[]
}

// Props para componentes


export interface ServiceFormProps {
  service?: Service
  onSubmit: (data: ServiceFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export interface ServiceFiltersProps {
  filters: ServiceFilters
  onFiltersChange: (filters: ServiceFilters) => void
  stats: ServiceStats
}

export interface ServiceStatsProps {
  stats: ServiceStats
}

export interface ServiceListProps {
  services: ServiceWithPhotos[]
  filters: ServiceFilters
  onFiltersChange: (filters: ServiceFilters) => void
  onEdit: (service: Service) => void
  onDelete: (service: Service) => void
  onDuplicate: (service: Service) => void
  onToggleStatus: (service: Service) => void
  isLoading?: boolean
}