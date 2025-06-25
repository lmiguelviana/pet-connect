'use client'

import { useAuth } from '@/contexts/auth-context'
import { usePlan } from '@/hooks/use-plan'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  PlusIcon,
  UsersIcon,
  HeartIcon,
  CalendarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

export default function DashboardPage() {
  const { user, company } = useAuth()
  const { isPremium, checkFeature } = usePlan()

  const quickActions = [
    {
      name: 'Novo Cliente',
      description: 'Cadastrar um novo tutor',
      href: '/clients/new',
      icon: UsersIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
      feature: 'client_management',
    },
    {
      name: 'Novo Pet',
      description: 'Cadastrar um novo pet',
      href: '/pets/new',
      icon: HeartIcon,
      color: 'bg-pink-500 hover:bg-pink-600',
      feature: 'pet_management',
    },
    {
      name: 'Novo Agendamento',
      description: 'Agendar um serviço',
      href: '/appointments/new',
      icon: CalendarIcon,
      color: 'bg-green-500 hover:bg-green-600',
      feature: 'basic_appointments',
    },
  ]

  const premiumFeatures = [
    {
      name: 'Galeria de Fotos',
      description: 'Armazene e compartilhe fotos dos pets',
      icon: '📸',
    },
    {
      name: 'WhatsApp Automático',
      description: 'Envie lembretes e fotos automaticamente',
      icon: '💬',
    },
    {
      name: 'Relatórios Avançados',
      description: 'Análises detalhadas do seu negócio',
      icon: '📊',
    },
    {
      name: 'Clientes Ilimitados',
      description: 'Sem limite de cadastros',
      icon: '∞',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Olá, {user?.user_metadata?.name || 'Usuário'}! 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Bem-vindo ao painel do {company?.name || 'Pet Connect'}
          </p>
        </div>
        {!isPremium && (
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <Link href="/upgrade">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <SparklesIcon className="mr-2 h-4 w-4" />
                Upgrade para Premium
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Upgrade Banner for Free Users */}
      {!isPremium && (
        <Card className="border-l-4 border-l-yellow-400 bg-yellow-50 p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <SparklesIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Desbloqueie todo o potencial do Pet Connect
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Upgrade para Premium e tenha acesso a fotos ilimitadas, WhatsApp automático, relatórios avançados e muito mais!
              </p>
              <div className="mt-4">
                <Link href="/upgrade">
                  <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                    Ver Planos Premium
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <StatsCards />

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const hasAccess = checkFeature(action.feature)
            return (
              <Card key={action.name} className="p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-lg ${action.color} ${!hasAccess ? 'opacity-50' : ''}`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {action.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {action.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  {hasAccess ? (
                    <Link href={action.href}>
                      <Button size="sm" variant="outline" className="w-full">
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Criar
                      </Button>
                    </Link>
                  ) : (
                    <Button size="sm" variant="outline" className="w-full" disabled>
                      Requer Premium
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Premium Features (for free users) */}
      {!isPremium && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recursos Premium</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {premiumFeatures.map((feature) => (
              <Card key={feature.name} className="p-6 text-center">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  {feature.name}
                </h3>
                <p className="text-xs text-gray-500">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/upgrade">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <SparklesIcon className="mr-2 h-4 w-4" />
                Fazer Upgrade Agora - R$ 39,90/mês
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Recent Activity (placeholder) */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Atividade Recente</h2>
        <Card className="p-6">
          <div className="text-center py-8">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma atividade recente</h3>
            <p className="mt-1 text-sm text-gray-500">
              Quando você começar a usar o sistema, as atividades aparecerão aqui.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}