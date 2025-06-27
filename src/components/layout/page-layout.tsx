import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface PageLayoutProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  backUrl?: string
  actions?: React.ReactNode
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'card' | 'plain'
}

export function PageLayout({
  title,
  subtitle,
  showBackButton = true,
  backUrl,
  actions,
  children,
  maxWidth = 'lg',
  padding = 'md',
  variant = 'card'
}: PageLayoutProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl)
    } else {
      router.back()
    }
  }

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-full'
  }

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const containerContent = (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-2"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {children}
      </div>
    </>
  )

  const containerClasses = `
    min-h-screen bg-gray-50 flex flex-col
    ${paddingClasses[padding]}
  `

  const contentClasses = `
    mx-auto w-full flex-1 flex flex-col
    ${maxWidthClasses[maxWidth]}
  `

  if (variant === 'plain') {
    return (
      <div className={containerClasses}>
        <div className={contentClasses}>
          {containerContent}
        </div>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={containerClasses}>
        <div className={contentClasses}>
          <Card className="flex-1 flex flex-col">
            <div className={paddingClasses[padding] || 'p-6'}>
              {containerContent}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // variant === 'default'
  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        {containerContent}
      </div>
    </div>
  )
}

// Componente específico para páginas de formulário
interface FormPageLayoutProps extends Omit<PageLayoutProps, 'variant'> {
  onSubmit?: (e: React.FormEvent) => void
  submitLabel?: string
  submitDisabled?: boolean
  submitLoading?: boolean
  showCancelButton?: boolean
  onCancel?: () => void
}

export function FormPageLayout({
  onSubmit,
  submitLabel = 'Salvar',
  submitDisabled = false,
  submitLoading = false,
  showCancelButton = true,
  onCancel,
  children,
  ...pageProps
}: FormPageLayoutProps) {
  const router = useRouter()

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.back()
    }
  }

  const formActions = (
    <div className="flex items-center space-x-3">
      {showCancelButton && (
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={submitLoading}
        >
          Cancelar
        </Button>
      )}
      <Button
        type="submit"
        disabled={submitDisabled || submitLoading}
        loading={submitLoading}
      >
        {submitLabel}
      </Button>
    </div>
  )

  return (
    <PageLayout {...pageProps} variant="card" actions={formActions}>
      <form onSubmit={onSubmit} className="flex-1 flex flex-col">
        {children}
      </form>
    </PageLayout>
  )
}

// Componente para páginas de listagem
interface ListPageLayoutProps extends Omit<PageLayoutProps, 'variant'> {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: React.ReactNode
  stats?: React.ReactNode
}

export function ListPageLayout({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters,
  stats,
  children,
  ...pageProps
}: ListPageLayoutProps) {
  return (
    <PageLayout {...pageProps} variant="default">
      {/* Stats */}
      {stats && (
        <div className="mb-6">
          {stats}
        </div>
      )}

      {/* Search and Filters */}
      {(onSearchChange || filters) && (
        <div className="mb-6 space-y-4">
          {onSearchChange && (
            <div className="relative">
              <input
                type="text"
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}
          {filters && (
            <div>
              {filters}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1">
        {children}
      </div>
    </PageLayout>
  )
}