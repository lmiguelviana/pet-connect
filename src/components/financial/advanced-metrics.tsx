'use client'

import { Card } from '@/components/ui/card'
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

type AdvancedMetrics = {
  averageDailyIncome: number
  averageDailyExpenses: number
  growthRate: number
  projectedMonthlyIncome: number
  projectedMonthlyExpenses: number
  cashFlowTrend: 'positive' | 'negative' | 'stable'
  topExpenseCategory: string
  topIncomeSource: string
}

type AdvancedMetricsProps = {
  metrics: AdvancedMetrics | null
  loading?: boolean
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatPercentage = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

const MetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description,
  loading 
}: {
  title: string
  value: string
  icon: any
  trend?: 'up' | 'down' | 'neutral'
  description?: string
  loading?: boolean
}) => {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <Icon className={clsx(
          "h-6 w-6",
          trend === 'up' && "text-green-600",
          trend === 'down' && "text-red-600",
          trend === 'neutral' && "text-gray-600"
        )} />
      </div>
      <div className="flex items-baseline justify-between">
        <p className={clsx(
          "text-2xl font-semibold",
          trend === 'up' && "text-green-600",
          trend === 'down' && "text-red-600",
          trend === 'neutral' && "text-gray-900"
        )}>
          {value}
        </p>
        {trend && (
          <div className={clsx(
            "flex items-center text-sm",
            trend === 'up' && "text-green-600",
            trend === 'down' && "text-red-600"
          )}>
            {trend === 'up' && <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />}
        {trend === 'down' && <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />}
          </div>
        )}
      </div>
      {description && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
    </Card>
  )
}

export function AdvancedMetrics({ metrics, loading }: AdvancedMetricsProps) {
  if (!metrics && !loading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Dados insuficientes</h3>
          <p className="mt-1 text-sm text-gray-500">
            Adicione mais transações para ver métricas avançadas.
          </p>
        </div>
      </Card>
    )
  }

  const getTrendDirection = (value: number): 'up' | 'down' | 'neutral' => {
    if (value > 5) return 'up'
    if (value < -5) return 'down'
    return 'neutral'
  }

  const getCashFlowIcon = (trend: string) => {
    switch (trend) {
      case 'positive': return ArrowTrendingUpIcon
      case 'negative': return ArrowTrendingDownIcon
      default: return ArrowPathIcon
    }
  }

  const getCashFlowTrend = (trend: string): 'up' | 'down' | 'neutral' => {
    switch (trend) {
      case 'positive': return 'up'
      case 'negative': return 'down'
      default: return 'neutral'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Métricas Avançadas</h2>
        <div className="text-xs text-gray-500">Baseado nos dados atuais</div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Receita Diária Média"
          value={formatCurrency(metrics?.averageDailyIncome || 0)}
          icon={CalendarDaysIcon}
          trend="neutral"
          description="Baseado no mês atual"
          loading={loading}
        />
        
        <MetricCard
          title="Despesa Diária Média"
          value={formatCurrency(metrics?.averageDailyExpenses || 0)}
          icon={CalendarDaysIcon}
          trend="neutral"
          description="Baseado no mês atual"
          loading={loading}
        />
        
        <MetricCard
          title="Taxa de Crescimento"
          value={formatPercentage(metrics?.growthRate || 0)}
          icon={ChartBarIcon}
          trend={getTrendDirection(metrics?.growthRate || 0)}
          description="Comparado ao mês anterior"
          loading={loading}
        />
        
        <MetricCard
          title="Tendência do Fluxo"
          value={metrics?.cashFlowTrend === 'positive' ? 'Positiva' : 
                 metrics?.cashFlowTrend === 'negative' ? 'Negativa' : 'Estável'}
          icon={getCashFlowIcon(metrics?.cashFlowTrend || 'stable')}
          trend={getCashFlowTrend(metrics?.cashFlowTrend || 'stable')}
          description="Análise do fluxo de caixa"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="Projeção Receita Mensal"
          value={formatCurrency(metrics?.projectedMonthlyIncome || 0)}
          icon={ArrowTrendingUpIcon}
          trend="up"
          description="Baseado na média diária atual"
          loading={loading}
        />
        
        <MetricCard
          title="Projeção Despesa Mensal"
          value={formatCurrency(metrics?.projectedMonthlyExpenses || 0)}
          icon={ArrowTrendingDownIcon}
          trend="down"
          description="Baseado na média diária atual"
          loading={loading}
        />
      </div>

      {/* Insights */}
      {metrics && !loading && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Insights Financeiros</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-800 font-medium">Principal Categoria de Despesa:</p>
              <p className="text-blue-700">{metrics.topExpenseCategory}</p>
            </div>
            <div>
              <p className="text-blue-800 font-medium">Principal Fonte de Receita:</p>
              <p className="text-blue-700">{metrics.topIncomeSource}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-blue-800 font-medium">Recomendação:</p>
              <p className="text-blue-700">
                {metrics.growthRate > 10 
                  ? "Excelente crescimento! Continue investindo em marketing e qualidade."
                  : metrics.growthRate > 0
                  ? "Crescimento positivo. Considere estratégias para acelerar o crescimento."
                  : "Foque em reduzir custos e aumentar a captação de clientes."}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}