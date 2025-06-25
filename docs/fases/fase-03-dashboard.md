# 📊 Fase 03 - Dashboard Principal

## 📋 Objetivos da Fase

- Criar layout principal do sistema com sidebar e header
- Implementar dashboard com métricas em tempo real
- Criar componentes de navegação
- Implementar sistema de notificações
- Configurar estrutura base para todas as páginas

## ⏱️ Estimativa: 3-4 dias

## 🛠️ Tarefas Detalhadas

### 1. Layout Principal do Sistema

#### 1.1 Layout Base do Dashboard
```typescript
// src/app/(dashboard)/layout.tsx
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { AuthProvider } from '@/contexts/auth-context'
import { Toaster } from 'react-hot-toast'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="lg:pl-64">
          <Header />
          <main className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
        <Toaster position="top-right" />
      </div>
    </AuthProvider>
  )
}
```

#### 1.2 Componente Sidebar
```typescript
// src/components/layout/sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { usePlan } from '@/hooks/use-plan'
import { clsx } from 'clsx'
import {
  HomeIcon,
  UsersIcon,
  HeartIcon,
  CalendarIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CogIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, feature: 'basic_dashboard' },
  { name: 'Clientes', href: '/clients', icon: UsersIcon, feature: 'client_management' },
  { name: 'Pets', href: '/pets', icon: HeartIcon, feature: 'pet_management' },
  { name: 'Agendamentos', href: '/appointments', icon: CalendarIcon, feature: 'basic_appointments' },
  { name: 'Serviços', href: '/services', icon: WrenchScrewdriverIcon, feature: 'service_management' },
  { name: 'Financeiro', href: '/financial', icon: CurrencyDollarIcon, feature: 'financial', premium: true },
  { name: 'Relatórios', href: '/reports', icon: ChartBarIcon, feature: 'reports', premium: true },
  { name: 'Configurações', href: '/settings', icon: CogIcon, feature: 'settings' },
]

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { company } = useAuth()
  const { checkFeature, isPremium } = usePlan()

  return (
    <>
      {/* Mobile sidebar */}
      <div className={clsx(
        'relative z-50 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button
                type="button"
                className="-m-2.5 p-2.5"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent navigation={navigation} pathname={pathname} checkFeature={checkFeature} isPremium={isPremium} company={company} />
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent navigation={navigation} pathname={pathname} checkFeature={checkFeature} isPremium={isPremium} company={company} />
      </div>

      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
          Pet Connect
        </div>
      </div>
    </>
  )
}

function SidebarContent({ navigation, pathname, checkFeature, isPremium, company }: any) {
  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">🐾</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Pet Connect</h1>
            <p className="text-xs text-gray-500 truncate">{company?.name}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item: any) => {
                const isActive = pathname === item.href
                const hasAccess = checkFeature(item.feature)
                const needsUpgrade = item.premium && !isPremium

                return (
                  <li key={item.name}>
                    <Link
                      href={hasAccess ? item.href : '#'}
                      className={clsx(
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : hasAccess
                          ? 'text-gray-700 hover:text-primary-700 hover:bg-primary-50'
                          : 'text-gray-400 cursor-not-allowed',
                        needsUpgrade && 'relative'
                      )}
                      onClick={(e) => {
                        if (!hasAccess) {
                          e.preventDefault()
                        }
                      }}
                    >
                      <item.icon
                        className={clsx(
                          'h-6 w-6 shrink-0',
                          isActive
                            ? 'text-primary-700'
                            : hasAccess
                            ? 'text-gray-400 group-hover:text-primary-700'
                            : 'text-gray-300'
                        )}
                      />
                      {item.name}
                      {needsUpgrade && (
                        <span className="ml-auto">
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                            Pro
                          </span>
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>

          {/* Plan Info */}
          <li className="mt-auto">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  Plano {isPremium ? 'Premium' : 'Gratuito'}
                </span>
                <span className={clsx(
                  'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                  isPremium
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                )}>
                  {isPremium ? 'Ativo' : 'Limitado'}
                </span>
              </div>
              {!isPremium && (
                <>
                  <p className="text-xs text-gray-600 mb-3">
                    Desbloqueie todos os recursos com o plano Premium
                  </p>
                  <Link href="/upgrade">
                    <button className="w-full bg-primary-500 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-primary-600 transition-colors">
                      Fazer Upgrade
                    </button>
                  </Link>
                </>
              )}
            </div>
          </li>
        </ul>
      </nav>
    </div>
  )
}
```

#### 1.3 Componente Header
```typescript
// src/components/layout/header.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import {
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { clsx } from 'clsx'

export function Header() {
  const { appUser, company, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Search */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Buscar
          </label>
          <MagnifyingGlassIcon
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 py-0 pl-8 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
            placeholder="Buscar clientes, pets, agendamentos..."
            type="search"
            name="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* Notifications */}
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 relative"
        >
          <span className="sr-only">Ver notificações</span>
          <BellIcon className="h-6 w-6" aria-hidden="true" />
          {/* Notification badge */}
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-medium">3</span>
          </span>
        </button>

        {/* Separator */}
        <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

        {/* Profile dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button className="-m-1.5 flex items-center p-1.5">
            <span className="sr-only">Abrir menu do usuário</span>
            <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {appUser?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="hidden lg:flex lg:items-center">
              <span className="ml-4 text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                {appUser?.name}
              </span>
            </span>
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2.5 w-56 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{appUser?.name}</p>
                <p className="text-sm text-gray-500">{appUser?.email}</p>
                <p className="text-xs text-gray-400 mt-1">{company?.name}</p>
              </div>
              
              <Menu.Item>
                {({ active }) => (
                  <a
                    href="/profile"
                    className={clsx(
                      active ? 'bg-gray-50' : '',
                      'flex items-center px-4 py-2 text-sm text-gray-700'
                    )}
                  >
                    <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400" />
                    Meu Perfil
                  </a>
                )}
              </Menu.Item>
              
              <Menu.Item>
                {({ active }) => (
                  <a
                    href="/settings"
                    className={clsx(
                      active ? 'bg-gray-50' : '',
                      'flex items-center px-4 py-2 text-sm text-gray-700'
                    )}
                  >
                    <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" />
                    Configurações
                  </a>
                )}
              </Menu.Item>
              
              <div className="border-t border-gray-100 mt-2 pt-2">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleSignOut}
                      className={clsx(
                        active ? 'bg-gray-50' : '',
                        'flex w-full items-center px-4 py-2 text-sm text-gray-700'
                      )}
                    >
                      <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                      Sair
                    </button>
                  )
                )}
              </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  )
}
```

### 2. Dashboard Principal

#### 2.1 Página do Dashboard
```typescript
// src/app/(dashboard)/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { usePlan } from '@/hooks/use-plan'
import { createClient } from '@/lib/supabase'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentAppointments } from '@/components/dashboard/recent-appointments'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { WelcomeMessage } from '@/components/dashboard/welcome-message'
import { UpgradePrompt } from '@/components/dashboard/upgrade-prompt'
import { PerformanceChart } from '@/components/dashboard/performance-chart'
import { useSearchParams } from 'next/navigation'

interface DashboardStats {
  totalClients: number
  totalPets: number
  appointmentsToday: number
  revenueThisMonth: number
  appointmentsThisWeek: number
  newClientsThisMonth: number
}

export default function DashboardPage() {
  const { company, appUser } = useAuth()
  const { isPremium } = usePlan()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const isWelcome = searchParams.get('welcome') === 'true'
  const shouldUpgrade = searchParams.get('upgrade') === 'true'
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadDashboardStats()
    }
  }, [company?.id])

  const loadDashboardStats = async () => {
    try {
      setLoading(true)
      
      // Buscar estatísticas em paralelo
      const [clientsResult, petsResult, appointmentsResult, transactionsResult] = await Promise.all([
        // Total de clientes
        supabase
          .from('clients')
          .select('id', { count: 'exact' })
          .eq('company_id', company!.id)
          .eq('is_active', true),
        
        // Total de pets
        supabase
          .from('pets')
          .select('id', { count: 'exact' })
          .eq('company_id', company!.id)
          .eq('is_active', true),
        
        // Agendamentos de hoje
        supabase
          .from('appointments')
          .select('id', { count: 'exact' })
          .eq('company_id', company!.id)
          .gte('date_time', new Date().toISOString().split('T')[0])
          .lt('date_time', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .not('status', 'in', '(cancelled,no_show)'),
        
        // Receita do mês (apenas Premium)
        isPremium ? supabase
          .from('transactions')
          .select('net_amount')
          .eq('company_id', company!.id)
          .eq('type', 'income')
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .lt('created_at', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString())
        : Promise.resolve({ data: [], error: null })
      ])

      // Calcular receita total
      const revenueThisMonth = transactionsResult.data?.reduce(
        (sum, transaction) => sum + (transaction.net_amount || 0), 
        0
      ) || 0

      setStats({
        totalClients: clientsResult.count || 0,
        totalPets: petsResult.count || 0,
        appointmentsToday: appointmentsResult.count || 0,
        revenueThisMonth,
        appointmentsThisWeek: 0, // Implementar depois
        newClientsThisMonth: 0, // Implementar depois
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      {isWelcome && <WelcomeMessage userName={appUser?.name || ''} />}
      
      {/* Upgrade Prompt */}
      {shouldUpgrade && <UpgradePrompt />}
      
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Visão geral do seu pet shop - {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <QuickActions />
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isPremium={isPremium} />

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Performance Chart (Premium) */}
        {isPremium && (
          <div className="lg:col-span-1">
            <PerformanceChart />
          </div>
        )}
        
        {/* Recent Appointments */}
        <div className={isPremium ? 'lg:col-span-1' : 'lg:col-span-2'}>
          <RecentAppointments />
        </div>
      </div>
    </div>
  )
}
```

#### 2.2 Componente de Cards de Estatísticas
```typescript
// src/components/dashboard/stats-cards.tsx
import { UsersIcon, HeartIcon, CalendarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface StatsCardsProps {
  stats: {
    totalClients: number
    totalPets: number
    appointmentsToday: number
    revenueThisMonth: number
  } | null
  isPremium: boolean
}

export function StatsCards({ stats, isPremium }: StatsCardsProps) {
  const cards = [
    {
      name: 'Total de Clientes',
      value: stats?.totalClients || 0,
      icon: UsersIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: 'Total de Pets',
      value: stats?.totalPets || 0,
      icon: HeartIcon,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      change: '+8%',
      changeType: 'positive',
    },
    {
      name: 'Agendamentos Hoje',
      value: stats?.appointmentsToday || 0,
      icon: CalendarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+3',
      changeType: 'positive',
    },
    {
      name: 'Receita do Mês',
      value: isPremium ? `R$ ${(stats?.revenueThisMonth || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Premium',
      icon: CurrencyDollarIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: isPremium ? '+15%' : '',
      changeType: 'positive',
      premium: !isPremium,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.name}
          className={clsx(
            'relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6',
            card.premium && 'opacity-75'
          )}
        >
          <div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={clsx('rounded-md p-3', card.bgColor)}>
                  <card.icon className={clsx('h-6 w-6', card.color)} aria-hidden="true" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{card.name}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {card.premium ? (
                        <span className="text-sm text-gray-400">Apenas Premium</span>
                      ) : (
                        card.value
                      )}
                    </div>
                    {card.change && !card.premium && (
                      <div className={clsx(
                        'ml-2 flex items-baseline text-sm font-semibold',
                        card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      )}>
                        {card.change}
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          {card.premium && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                Pro
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

#### 2.3 Componente de Ações Rápidas
```typescript
// src/components/dashboard/quick-actions.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

export function QuickActions() {
  const actions = [
    { name: 'Novo Cliente', href: '/clients/new', icon: '👤' },
    { name: 'Novo Pet', href: '/pets/new', icon: '🐕' },
    { name: 'Novo Agendamento', href: '/appointments/new', icon: '📅' },
    { name: 'Novo Serviço', href: '/services/new', icon: '✂️' },
  ]

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button as={Button} className="inline-flex items-center">
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Ações Rápidas
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {actions.map((action) => (
              <Menu.Item key={action.name}>
                {({ active }) => (
                  <Link
                    href={action.href}
                    className={`${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    } flex items-center px-4 py-2 text-sm`}
                  >
                    <span className="mr-3 text-lg">{action.icon}</span>
                    {action.name}
                  </Link>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
```

#### 2.4 Componente de Agendamentos Recentes
```typescript
// src/components/dashboard/recent-appointments.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface Appointment {
  id: string
  date_time: string
  status: string
  notes: string
  client: { name: string }
  pet: { name: string }
  service: { name: string }
}

export function RecentAppointments() {
  const { company } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadRecentAppointments()
    }
  }, [company?.id])

  const loadRecentAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          date_time,
          status,
          notes,
          client:clients(name),
          pet:pets(name),
          service:services(name)
        `)
        .eq('company_id', company!.id)
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(5)

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado'
      case 'confirmed':
        return 'Confirmado'
      case 'in_progress':
        return 'Em andamento'
      case 'completed':
        return 'Concluído'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Próximos Agendamentos
          </h3>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Próximos Agendamentos
          </h3>
          <Link
            href="/appointments"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Ver todos
          </Link>
        </div>
        
        {appointments.length === 0 ? (
          <div className="text-center py-6">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum agendamento</h3>
            <p className="mt-1 text-sm text-gray-500">
              Você não tem agendamentos próximos.
            </p>
            <div className="mt-6">
              <Link href="/appointments/new">
                <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Novo Agendamento
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <li key={appointment.id} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <ClockIcon className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {appointment.client.name} - {appointment.pet.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {appointment.service.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(appointment.date_time), "dd 'de' MMMM 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={clsx(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getStatusColor(appointment.status)
                      )}>
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
```

### 3. Componentes de Boas-vindas e Upgrade

#### 3.1 Mensagem de Boas-vindas
```typescript
// src/components/dashboard/welcome-message.tsx
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

interface WelcomeMessageProps {
  userName: string
}

export function WelcomeMessage({ userName }: WelcomeMessageProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="relative bg-primary-50 border border-primary-200 rounded-lg p-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <div className="text-4xl">🎉</div>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-medium text-primary-800">
            Bem-vindo ao Pet Connect, {userName}!
          </h3>
          <div className="mt-2 text-sm text-primary-700">
            <p>
              Sua conta foi criada com sucesso! Agora você pode começar a gerenciar seu pet shop de forma mais eficiente.
            </p>
            <div className="mt-4">
              <div className="flex space-x-4">
                <a
                  href="/clients/new"
                  className="text-sm font-medium text-primary-800 underline hover:text-primary-600"
                >
                  Cadastrar primeiro cliente
                </a>
                <a
                  href="/services"
                  className="text-sm font-medium text-primary-800 underline hover:text-primary-600"
                >
                  Configurar serviços
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="ml-auto flex-shrink-0">
          <button
            type="button"
            className="bg-primary-50 rounded-md p-2 inline-flex items-center justify-center text-primary-400 hover:text-primary-500 hover:bg-primary-100"
            onClick={() => setIsVisible(false)}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
```

#### 3.2 Prompt de Upgrade
```typescript
// src/components/dashboard/upgrade-prompt.tsx
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import Link from 'next/link'

export function UpgradePrompt() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="relative bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <SparklesIcon className="h-8 w-8 text-yellow-600" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-medium text-yellow-800">
            Funcionalidade Premium Necessária
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Você tentou acessar uma funcionalidade que está disponível apenas no plano Premium.
              Faça upgrade agora e desbloqueie todos os recursos!
            </p>
            <div className="mt-4">
              <Link href="/upgrade">
                <button className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 transition-colors">
                  Fazer Upgrade - R$ 39,90/mês
                </button>
              </Link>
            </div>
          </div>
        </div>
        <div className="ml-auto flex-shrink-0">
          <button
            type="button"
            className="bg-yellow-50 rounded-md p-2 inline-flex items-center justify-center text-yellow-400 hover:text-yellow-500 hover:bg-yellow-100"
            onClick={() => setIsVisible(false)}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
```

## ✅ Critérios de Aceitação

- [ ] Layout principal com sidebar e header funcionando
- [ ] Dashboard com métricas básicas implementado
- [ ] Navegação entre páginas funcionando
- [ ] Controle de acesso por planos no menu
- [ ] Componentes de estatísticas criados
- [ ] Agendamentos recentes sendo exibidos
- [ ] Ações rápidas implementadas
- [ ] Mensagens de boas-vindas e upgrade funcionando
- [ ] Design responsivo implementado

## 🔄 Próximos Passos

Após completar esta fase:
1. **Fase 04**: Implementar gestão de clientes
2. Criar banco de dados no Supabase
3. Implementar busca global

## 📝 Notas Importantes

- Testar responsividade em diferentes dispositivos
- Verificar performance do carregamento de dados
- Implementar skeleton loading states
- Configurar real-time updates para estatísticas
- Otimizar queries do banco de dados

---

**Tempo estimado: 3-4 dias**  
**Complexidade: Média**  
**Dependências: Fase 02 concluída**