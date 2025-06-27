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
import { NavigationItem, SidebarContentProps } from '@/types/navigation'

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

function SidebarContent({ navigation, pathname, checkFeature, isPremium, company }: SidebarContentProps) {
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
              {navigation.map((item: NavigationItem) => {
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