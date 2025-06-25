'use client'

import { useAuth } from '@/contexts/auth-context'
import { usePlan } from '@/hooks/use-plan'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Heart, 
  Calendar, 
  Camera, 
  Crown,
  LogOut,
  Settings
} from 'lucide-react'

export default function DashboardPage() {
  const { user, appUser, company, signOut } = useAuth()
  const { isPremium, isFree, getPlanLimits } = usePlan()
  const limits = getPlanLimits()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  Pet Connect
                </h1>
                {company && (
                  <span className="ml-4 text-gray-500">- {company.name}</span>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge variant={isPremium ? "default" : "secondary"}>
                  {isPremium ? (
                    <>
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </>
                  ) : (
                    'Gratuito'
                  )}
                </Badge>
                
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
                
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bem-vindo, {appUser?.name || user?.email}!
            </h2>
            <p className="text-gray-600">
              Gerencie seu pet shop de forma simples e eficiente
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Limite: {limits.clients === -1 ? 'Ilimitado' : limits.clients}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pets</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Limite: {limits.pets === -1 ? 'Ilimitado' : limits.pets}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Hoje
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fotos</CardTitle>
                <Camera className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  {isPremium ? 'Ilimitadas' : 'Limitadas'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Clientes</CardTitle>
                <CardDescription>
                  Cadastre e gerencie os tutores dos pets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Gerenciar Clientes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gestão de Pets</CardTitle>
                <CardDescription>
                  Cadastre pets e mantenha histórico completo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Gerenciar Pets
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agendamentos</CardTitle>
                <CardDescription>
                  Organize a agenda do seu pet shop
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Ver Agenda
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Premium Features */}
          {isFree && (
            <Card className="mt-8 border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-yellow-600" />
                  Desbloqueie recursos Premium
                </CardTitle>
                <CardDescription>
                  Tenha acesso a funcionalidades avançadas para seu pet shop
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center">
                    <Camera className="w-4 h-4 mr-2 text-yellow-600" />
                    <span className="text-sm">Fotos ilimitadas</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-yellow-600" />
                    <span className="text-sm">Clientes ilimitados</span>
                  </div>
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 mr-2 text-yellow-600" />
                    <span className="text-sm">Pets ilimitados</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-yellow-600" />
                    <span className="text-sm">WhatsApp automático</span>
                  </div>
                </div>
                <Button className="w-full">
                  Fazer upgrade por R$ 39,90/mês
                </Button>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}