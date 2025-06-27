// Tipos para navegação e sidebar

export interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  feature: string
  premium?: boolean
  badge?: string
  children?: NavigationItem[]
}

export interface SidebarContentProps {
  navigation: NavigationItem[]
  pathname: string
  checkFeature: (feature: string) => boolean
  isPremium: boolean
  company: import('./index').Company | null
}

export interface MobileSidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  navigation: NavigationItem[]
  pathname: string
  checkFeature: (feature: string) => boolean
  isPremium: boolean
  company: import('./index').Company | null
}

export interface DesktopSidebarProps {
  navigation: NavigationItem[]
  pathname: string
  checkFeature: (feature: string) => boolean
  isPremium: boolean
  company: import('./index').Company | null
}