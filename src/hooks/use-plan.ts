import { useAuth } from '@/contexts/auth-context'

export type PlanType = 'free' | 'premium'

interface PlanLimits {
  maxClients: number
  maxPets: number
  maxUsers: number
  hasPhotos: boolean
  hasWhatsApp: boolean
  hasReports: boolean
  hasAdvancedFeatures: boolean
}

interface PlanFeatures {
  canUploadPhotos: boolean
  canSendWhatsApp: boolean
  canGenerateReports: boolean
  canAddUsers: boolean
  hasAdvancedDashboard: boolean
  hasPrioritySupport: boolean
}

const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxClients: 20,
    maxPets: 30,
    maxUsers: 1,
    hasPhotos: false,
    hasWhatsApp: false,
    hasReports: false,
    hasAdvancedFeatures: false
  },
  premium: {
    maxClients: -1, // Ilimitado
    maxPets: -1, // Ilimitado
    maxUsers: -1, // Ilimitado
    hasPhotos: true,
    hasWhatsApp: true,
    hasReports: true,
    hasAdvancedFeatures: true
  }
}

export const usePlan = () => {
  const { company } = useAuth()
  
  const currentPlan: PlanType = company?.plan_type || 'free'
  const limits = PLAN_LIMITS[currentPlan]
  
  const features: PlanFeatures = {
    canUploadPhotos: limits.hasPhotos,
    canSendWhatsApp: limits.hasWhatsApp,
    canGenerateReports: limits.hasReports,
    canAddUsers: currentPlan === 'premium',
    hasAdvancedDashboard: limits.hasAdvancedFeatures,
    hasPrioritySupport: currentPlan === 'premium'
  }
  
  const checkLimit = (type: 'clients' | 'pets' | 'users', currentCount: number): boolean => {
    switch (type) {
      case 'clients':
        return limits.maxClients === -1 || currentCount < limits.maxClients
      case 'pets':
        return limits.maxPets === -1 || currentCount < limits.maxPets
      case 'users':
        return limits.maxUsers === -1 || currentCount < limits.maxUsers
      default:
        return false
    }
  }
  
  const getRemainingLimit = (type: 'clients' | 'pets' | 'users', currentCount: number): number => {
    switch (type) {
      case 'clients':
        return limits.maxClients === -1 ? -1 : Math.max(0, limits.maxClients - currentCount)
      case 'pets':
        return limits.maxPets === -1 ? -1 : Math.max(0, limits.maxPets - currentCount)
      case 'users':
        return limits.maxUsers === -1 ? -1 : Math.max(0, limits.maxUsers - currentCount)
      default:
        return 0
    }
  }
  
  const isPremium = currentPlan === 'premium'
  const isFree = currentPlan === 'free'
  
  return {
    currentPlan,
    limits,
    features,
    checkLimit,
    getRemainingLimit,
    isPremium,
    isFree
  }
}
