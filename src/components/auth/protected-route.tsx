'use client'

import { useAuth } from '@/contexts/auth-context'
import { usePlan } from '@/hooks/use-plan'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Crown, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiresPremium?: boolean
  feature?: string
}

export function ProtectedRoute({ 
  children, 
  requiresPremium = false, 
  feature 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const { isPremium, checkFeature } = usePlan()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você precisa estar logado para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  if (requiresPremium && !isPremium) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Recurso Premium</h2>
            <p className="text-gray-600 mb-6">
              Esta funcionalidade está disponível apenas no plano Premium.
            </p>
            <div className="space-y-3">
              <Link href="/dashboard/upgrade">
                <Button className="w-full">
                  Fazer upgrade para Premium
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Voltar ao Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  if (feature && !checkFeature(feature)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar este recurso.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  return <>{children}</>
}