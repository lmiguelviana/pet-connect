import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { useMemo } from 'react'
import { Company, User } from '@/types'

interface UseCompanyDataReturn {
  company: Company | null
  user: User | null
  companyId: string | null
  userId: string | null
  supabase: ReturnType<typeof createClient>
  isAuthenticated: boolean
  isPremium: boolean
  isOwner: boolean
  canAccess: (feature: string) => boolean
  limits: {
    clients: number
    pets: number
    users: number
    photos: number
  }
}

// Definição dos limites por plano
const PLAN_LIMITS = {
  free: {
    clients: 20,
    pets: 30,
    users: 1,
    photos: 10
  },
  premium: {
    clients: Infinity,
    pets: Infinity,
    users: 10,
    photos: Infinity
  }
} as const

// Funcionalidades premium
const PREMIUM_FEATURES = [
  'unlimited_photos',
  'whatsapp_integration',
  'advanced_reports',
  'client_portal',
  'bulk_operations',
  'custom_fields',
  'api_access'
] as const

type PremiumFeature = typeof PREMIUM_FEATURES[number]

export function useCompanyData(): UseCompanyDataReturn {
  const { user, company } = useAuth()
  const supabase = createClient()

  const companyId = company?.id || null
  const userId = user?.id || null
  const isAuthenticated = !!user && !!company
  
  // Determinar se é plano premium
  const isPremium = useMemo(() => {
    if (!company) return false
    return company.plan_type === 'premium' && company.subscription_status === 'active'
  }, [company])

  // Determinar se é proprietário da empresa
  const isOwner = useMemo(() => {
    if (!user || !company) return false
    return user.role === 'owner' || user.id === company.owner_id
  }, [user, company])

  // Obter limites baseados no plano
  const limits = useMemo(() => {
    const planType = isPremium ? 'premium' : 'free'
    return PLAN_LIMITS[planType]
  }, [isPremium])

  // Função para verificar acesso a funcionalidades
  const canAccess = useMemo(() => {
    return (feature: string): boolean => {
      // Funcionalidades básicas sempre disponíveis
      const basicFeatures = [
        'clients_management',
        'pets_management',
        'appointments',
        'basic_reports'
      ]

      if (basicFeatures.includes(feature)) {
        return isAuthenticated
      }

      // Funcionalidades premium
      if (PREMIUM_FEATURES.includes(feature as PremiumFeature)) {
        return isPremium
      }

      // Funcionalidades de administração
      const adminFeatures = [
        'user_management',
        'company_settings',
        'billing_management',
        'plan_upgrade'
      ]

      if (adminFeatures.includes(feature)) {
        return isOwner
      }

      return false
    }
  }, [isAuthenticated, isPremium, isOwner])

  return {
    company,
    user,
    companyId,
    userId,
    supabase,
    isAuthenticated,
    isPremium,
    isOwner,
    canAccess,
    limits
  }
}

// Hook específico para verificar limites
export function usePlanLimits() {
  const { limits, companyId, supabase } = useCompanyData()

  const checkLimit = async (type: keyof typeof limits): Promise<{ 
    current: number
    limit: number
    canAdd: boolean
    remaining: number
  }> => {
    if (!companyId) {
      return { current: 0, limit: 0, canAdd: false, remaining: 0 }
    }

    let current = 0
    const limit = limits[type]

    try {
      switch (type) {
        case 'clients':
          const { count: clientsCount } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
          current = clientsCount || 0
          break

        case 'pets':
          const { count: petsCount } = await supabase
            .from('pets')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
          current = petsCount || 0
          break

        case 'users':
          const { count: usersCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
          current = usersCount || 0
          break

        case 'photos':
          const { count: photosCount } = await supabase
            .from('pet_photos')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
          current = photosCount || 0
          break
      }
    } catch (error) {
      console.error(`Erro ao verificar limite de ${type}:`, error)
    }

    const canAdd = limit === Infinity || current < limit
    const remaining = limit === Infinity ? Infinity : Math.max(0, limit - current)

    return { current, limit, canAdd, remaining }
  }

  return { checkLimit, limits }
}

// Hook para verificar funcionalidades premium
export function usePremiumFeatures() {
  const { isPremium, canAccess } = useCompanyData()

  const requiresPremium = (feature: PremiumFeature): boolean => {
    return PREMIUM_FEATURES.includes(feature)
  }

  const showUpgradePrompt = (feature: PremiumFeature): boolean => {
    return requiresPremium(feature) && !isPremium
  }

  return {
    isPremium,
    canAccess,
    requiresPremium,
    showUpgradePrompt,
    premiumFeatures: PREMIUM_FEATURES
  }
}

// Utilitário para criar queries com company_id automático
export function useCompanyQuery() {
  const { companyId, supabase } = useCompanyData()

  const createQuery = (tableName: string) => {
    if (!companyId) {
      throw new Error('Company ID não encontrado')
    }
    return supabase.from(tableName).select('*').eq('company_id', companyId)
  }

  return { createQuery, companyId, supabase }
}