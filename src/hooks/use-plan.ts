import { useAuth } from '@/contexts/auth-context'

export function usePlan() {
  const { company } = useAuth()
  
  const isPremium = company?.plan_type === 'premium'
  const isFree = company?.plan_type === 'free'
  
  const checkFeature = (feature: string) => {
    if (isPremium) return true
    
    // Funcionalidades do plano gratuito
    const freeFeatures = [
      'basic_dashboard',
      'client_management',
      'pet_management',
      'basic_appointments',
      'service_management'
    ]
    
    return freeFeatures.includes(feature)
  }
  
  const getLimits = () => {
    if (isPremium) {
      return {
        clients: Infinity,
        pets: Infinity,
        users: Infinity,
        appointments: Infinity,
        photos: Infinity
      }
    }
    
    return {
      clients: 20,
      pets: 30,
      users: 1,
      appointments: 10,
      photos: 0
    }
  }
  
  return {
    isPremium,
    isFree,
    checkFeature,
    getLimits,
    planType: company?.plan_type || 'free'
  }
}