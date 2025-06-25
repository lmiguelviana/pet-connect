# 📊 Fase 09 - Sistema de Relatórios Avançados

## 📋 Objetivos da Fase

- Implementar dashboard executivo com KPIs principais
- Criar relatórios de performance por período
- Implementar análise de clientes e comportamento
- Adicionar relatórios de serviços mais populares
- Criar análise de rentabilidade por serviço
- Implementar relatórios de funcionários e produtividade
- Adicionar previsões e tendências
- Criar sistema de alertas e notificações

## ⏱️ Estimativa: 5-6 dias

## 🛠️ Tarefas Detalhadas

### 1. Dashboard Executivo

#### 1.1 Página Principal de Relatórios
```typescript
// src/app/(dashboard)/reports/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { ExecutiveDashboard } from '@/components/reports/executive-dashboard'
import { ReportTabs } from '@/components/reports/report-tabs'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Button } from '@/components/ui/button'
import { 
  ChartBarIcon, 
  DocumentArrowDownIcon,
  Cog6ToothIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

export interface ExecutiveMetrics {
  // Métricas Gerais
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  
  // Clientes
  totalClients: number
  newClients: number
  activeClients: number
  clientRetentionRate: number
  averageClientValue: number
  
  // Agendamentos
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  appointmentCompletionRate: number
  averageAppointmentValue: number
  
  // Serviços
  totalServices: number
  mostPopularServices: {
    id: string
    name: string
    count: number
    revenue: number
  }[]
  servicePerformance: {
    service_id: string
    service_name: string
    appointments_count: number
    total_revenue: number
    average_rating: number
    profit_margin: number
  }[]
  
  // Tendências
  revenueGrowth: number
  clientGrowth: number
  appointmentGrowth: number
  
  // Comparações
  previousPeriodComparison: {
    revenue: { current: number; previous: number; growth: number }
    clients: { current: number; previous: number; growth: number }
    appointments: { current: number; previous: number; growth: number }
  }
  
  // Dados para gráficos
  monthlyRevenue: { month: string; revenue: number; expenses: number; profit: number }[]
  clientAcquisition: { month: string; new_clients: number; total_clients: number }[]
  serviceDistribution: { service: string; count: number; percentage: number }[]
  paymentMethodDistribution: { method: string; amount: number; percentage: number }[]
}

export default function ReportsPage() {
  const { company } = useAuth()
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  })
  const [comparisonPeriod, setComparisonPeriod] = useState({
    start: startOfMonth(subMonths(new Date(), 1)),
    end: endOfMonth(subMonths(new Date(), 1))
  })
  const [activeTab, setActiveTab] = useState('overview')
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadExecutiveMetrics()
    }
  }, [company?.id, dateRange, comparisonPeriod])

  const loadExecutiveMetrics = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .rpc('get_executive_metrics', {
          company_id: company!.id,
          start_date: format(dateRange.start, 'yyyy-MM-dd'),
          end_date: format(dateRange.end, 'yyyy-MM-dd'),
          comparison_start: format(comparisonPeriod.start, 'yyyy-MM-dd'),
          comparison_end: format(comparisonPeriod.end, 'yyyy-MM-dd')
        })

      if (error) throw error

      setMetrics(data)
    } catch (error) {
      console.error('Erro ao carregar métricas executivas:', error)
      toast.error('Erro ao carregar relatórios')
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = async (reportType: string, format: 'pdf' | 'excel') => {
    try {
      const { data, error } = await supabase.functions.invoke('export-executive-report', {
        body: {
          company_id: company!.id,
          report_type: reportType,
          start_date: format(dateRange.start, 'yyyy-MM-dd'),
          end_date: format(dateRange.end, 'yyyy-MM-dd'),
          export_format: format
        }
      })

      if (error) throw error

      // Download do arquivo
      const blob = new Blob([data], { 
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio_${reportType}_${format(new Date(), 'yyyy-MM-dd')}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Relatório exportado com sucesso!')
    } catch (error) {
      console.error('Erro ao exportar relatório:', error)
      toast.error('Erro ao exportar relatório')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
            Relatórios e Análises
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Insights completos sobre a performance do seu pet shop
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <Button
            variant="outline"
            onClick={() => handleExportReport(activeTab, 'pdf')}
            className="inline-flex items-center"
          >
            <DocumentArrowDownIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Exportar PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportReport(activeTab, 'excel')}
            className="inline-flex items-center"
          >
            <DocumentArrowDownIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período Principal
            </label>
            <DateRangePicker
              startDate={dateRange.start}
              endDate={dateRange.end}
              onChange={(start, end) => setDateRange({ start, end })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período de Comparação
            </label>
            <DateRangePicker
              startDate={comparisonPeriod.start}
              endDate={comparisonPeriod.end}
              onChange={(start, end) => setComparisonPeriod({ start, end })}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={loadExecutiveMetrics}
              disabled={loading}
              className="inline-flex items-center"
            >
              <ChartBarIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Executive Dashboard */}
      <ExecutiveDashboard metrics={metrics} loading={loading} />

      {/* Report Tabs */}
      <ReportTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        metrics={metrics}
        loading={loading}
        dateRange={dateRange}
        onExport={handleExportReport}
      />
    </div>
  )
}
```

#### 1.2 Dashboard Executivo
```typescript
// src/components/reports/executive-dashboard.tsx
import { ExecutiveMetrics } from '@/app/(dashboard)/reports/page'
import { 
  CurrencyDollarIcon,
  UsersIcon,
  CalendarDaysIcon,
  WrenchScrewdriverIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface ExecutiveDashboardProps {
  metrics: ExecutiveMetrics | null
  loading: boolean
}

export function ExecutiveDashboard({ metrics, loading }: ExecutiveDashboardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500 text-center">Nenhum dado encontrado para o período selecionado.</p>
      </div>
    )
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

  const mainKPIs = [
    {
      name: 'Receita Total',
      value: formatCurrency(metrics.totalRevenue),
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: metrics.previousPeriodComparison.revenue.growth,
      changeType: metrics.previousPeriodComparison.revenue.growth >= 0 ? 'positive' : 'negative',
    },
    {
      name: 'Lucro Líquido',
      value: formatCurrency(metrics.netProfit),
      icon: TrendingUpIcon,
      color: metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: metrics.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50',
      change: metrics.profitMargin,
      changeType: metrics.netProfit >= 0 ? 'positive' : 'negative',
      suffix: '% margem',
    },
    {
      name: 'Clientes Ativos',
      value: metrics.activeClients,
      icon: UsersIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: metrics.previousPeriodComparison.clients.growth,
      changeType: metrics.previousPeriodComparison.clients.growth >= 0 ? 'positive' : 'negative',
    },
    {
      name: 'Agendamentos',
      value: metrics.completedAppointments,
      icon: CalendarDaysIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: metrics.previousPeriodComparison.appointments.growth,
      changeType: metrics.previousPeriodComparison.appointments.growth >= 0 ? 'positive' : 'negative',
    },
  ]

  const secondaryKPIs = [
    {
      name: 'Taxa de Retenção',
      value: `${metrics.clientRetentionRate.toFixed(1)}%`,
      change: null,
    },
    {
      name: 'Ticket Médio',
      value: formatCurrency(metrics.averageClientValue),
      change: null,
    },
    {
      name: 'Taxa de Conclusão',
      value: `${metrics.appointmentCompletionRate.toFixed(1)}%`,
      change: null,
    },
    {
      name: 'Novos Clientes',
      value: metrics.newClients,
      change: metrics.clientGrowth,
    },
  ]

  // Dados para gráficos
  const revenueChartData = {
    labels: metrics.monthlyRevenue.map(item => item.month),
    datasets: [
      {
        label: 'Receita',
        data: metrics.monthlyRevenue.map(item => item.revenue),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Despesas',
        data: metrics.monthlyRevenue.map(item => item.expenses),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Lucro',
        data: metrics.monthlyRevenue.map(item => item.profit),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  }

  const serviceDistributionData = {
    labels: metrics.serviceDistribution.map(item => item.service),
    datasets: [
      {
        data: metrics.serviceDistribution.map(item => item.percentage),
        backgroundColor: [
          '#3B82F6',
          '#EF4444',
          '#10B981',
          '#F59E0B',
          '#8B5CF6',
          '#EC4899',
          '#06B6D4',
          '#84CC16',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }

  const clientAcquisitionData = {
    labels: metrics.clientAcquisition.map(item => item.month),
    datasets: [
      {
        label: 'Novos Clientes',
        data: metrics.clientAcquisition.map(item => item.new_clients),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {mainKPIs.map((kpi) => (
          <div key={kpi.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`rounded-md p-3 ${kpi.bgColor}`}>
                    <kpi.icon className={`h-6 w-6 ${kpi.color}`} aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {kpi.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {kpi.value}
                      </div>
                      {kpi.change !== undefined && (
                        <div className={clsx(
                          'ml-2 flex items-baseline text-sm font-semibold',
                          kpi.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        )}>
                          {kpi.changeType === 'positive' ? (
                            <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                          ) : (
                            <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4" />
                          )}
                          <span className="ml-1">
                            {formatPercentage(kpi.change)}
                            {kpi.suffix && ` ${kpi.suffix}`}
                          </span>
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Métricas Secundárias
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {secondaryKPIs.map((kpi) => (
              <div key={kpi.name} className="text-center">
                <dt className="text-sm font-medium text-gray-500">{kpi.name}</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{kpi.value}</dd>
                {kpi.change !== null && (
                  <dd className={clsx(
                    'mt-1 text-sm font-medium',
                    kpi.change >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatPercentage(kpi.change)} vs período anterior
                  </dd>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Evolução Financeira
            </h3>
            <div className="h-80">
              <Line
                data={revenueChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return formatCurrency(Number(value))
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Service Distribution */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Distribuição de Serviços
            </h3>
            <div className="h-80">
              <Doughnut
                data={serviceDistributionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.label}: ${context.parsed}%`
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Client Acquisition */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Aquisição de Clientes
            </h3>
            <div className="h-80">
              <Bar
                data={clientAcquisitionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Serviços Mais Populares
            </h3>
            <div className="space-y-4">
              {metrics.mostPopularServices.slice(0, 5).map((service, index) => (
                <div key={service.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={clsx(
                      'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' :
                      'bg-gray-300'
                    )}>
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-500">{service.count} agendamentos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(service.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 2. Sistema de Relatórios por Abas

#### 2.1 Componente de Abas de Relatórios
```typescript
// src/components/reports/report-tabs.tsx
import { useState } from 'react'
import { ExecutiveMetrics } from '@/app/(dashboard)/reports/page'
import { ClientAnalysisReport } from './client-analysis-report'
import { ServicePerformanceReport } from './service-performance-report'
import { FinancialAnalysisReport } from './financial-analysis-report'
import { OperationalReport } from './operational-report'
import { PredictiveAnalysisReport } from './predictive-analysis-report'
import { clsx } from 'clsx'

interface ReportTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  metrics: ExecutiveMetrics | null
  loading: boolean
  dateRange: { start: Date; end: Date }
  onExport: (reportType: string, format: 'pdf' | 'excel') => void
}

export function ReportTabs({ 
  activeTab, 
  onTabChange, 
  metrics, 
  loading, 
  dateRange, 
  onExport 
}: ReportTabsProps) {
  const tabs = [
    { id: 'overview', name: 'Visão Geral', icon: '📊' },
    { id: 'clients', name: 'Análise de Clientes', icon: '👥' },
    { id: 'services', name: 'Performance de Serviços', icon: '🛠️' },
    { id: 'financial', name: 'Análise Financeira', icon: '💰' },
    { id: 'operational', name: 'Operacional', icon: '⚙️' },
    { id: 'predictive', name: 'Análise Preditiva', icon: '🔮' },
  ]

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Visão Geral já está sendo exibida acima
            </h3>
            <p className="text-gray-500">
              Selecione uma das outras abas para ver relatórios específicos
            </p>
          </div>
        )}
        
        {activeTab === 'clients' && (
          <ClientAnalysisReport 
            metrics={metrics} 
            loading={loading} 
            dateRange={dateRange}
            onExport={onExport}
          />
        )}
        
        {activeTab === 'services' && (
          <ServicePerformanceReport 
            metrics={metrics} 
            loading={loading} 
            dateRange={dateRange}
            onExport={onExport}
          />
        )}
        
        {activeTab === 'financial' && (
          <FinancialAnalysisReport 
            metrics={metrics} 
            loading={loading} 
            dateRange={dateRange}
            onExport={onExport}
          />
        )}
        
        {activeTab === 'operational' && (
          <OperationalReport 
            metrics={metrics} 
            loading={loading} 
            dateRange={dateRange}
            onExport={onExport}
          />
        )}
        
        {activeTab === 'predictive' && (
          <PredictiveAnalysisReport 
            metrics={metrics} 
            loading={loading} 
            dateRange={dateRange}
            onExport={onExport}
          />
        )}
      </div>
    </div>
  )
}
```

#### 2.2 Relatório de Análise de Clientes
```typescript
// src/components/reports/client-analysis-report.tsx
import { ExecutiveMetrics } from '@/app/(dashboard)/reports/page'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ClientAnalysisData {
  clientSegmentation: {
    segment: string
    count: number
    percentage: number
    averageValue: number
  }[]
  clientLifetime: {
    client_id: string
    client_name: string
    first_appointment: string
    last_appointment: string
    total_appointments: number
    total_spent: number
    average_interval: number
  }[]
  clientRetention: {
    month: string
    new_clients: number
    returning_clients: number
    retention_rate: number
  }[]
  topClients: {
    client_id: string
    client_name: string
    total_spent: number
    appointments_count: number
    last_appointment: string
  }[]
  clientBehavior: {
    preferred_services: { service: string; count: number }[]
    preferred_times: { hour: number; count: number }[]
    preferred_days: { day: string; count: number }[]
    payment_preferences: { method: string; count: number }[]
  }
}

interface ClientAnalysisReportProps {
  metrics: ExecutiveMetrics | null
  loading: boolean
  dateRange: { start: Date; end: Date }
  onExport: (reportType: string, format: 'pdf' | 'excel') => void
}

export function ClientAnalysisReport({ metrics, loading, dateRange, onExport }: ClientAnalysisReportProps) {
  const { company } = useAuth()
  const [clientData, setClientData] = useState<ClientAnalysisData | null>(null)
  const [loadingClientData, setLoadingClientData] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadClientAnalysis()
    }
  }, [company?.id, dateRange])

  const loadClientAnalysis = async () => {
    try {
      setLoadingClientData(true)
      
      const { data, error } = await supabase
        .rpc('get_client_analysis', {
          company_id: company!.id,
          start_date: format(dateRange.start, 'yyyy-MM-dd'),
          end_date: format(dateRange.end, 'yyyy-MM-dd')
        })

      if (error) throw error

      setClientData(data)
    } catch (error) {
      console.error('Erro ao carregar análise de clientes:', error)
    } finally {
      setLoadingClientData(false)
    }
  }

  if (loading || loadingClientData) {
    return (
      <div className="animate-pulse space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded"></div>
        ))}
      </div>
    )
  }

  if (!clientData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nenhum dado de clientes encontrado para o período selecionado.</p>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Dados para gráficos
  const segmentationData = {
    labels: clientData.clientSegmentation.map(item => item.segment),
    datasets: [
      {
        data: clientData.clientSegmentation.map(item => item.count),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }

  const retentionData = {
    labels: clientData.clientRetention.map(item => item.month),
    datasets: [
      {
        label: 'Novos Clientes',
        data: clientData.clientRetention.map(item => item.new_clients),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Clientes Recorrentes',
        data: clientData.clientRetention.map(item => item.returning_clients),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
    ],
  }

  const behaviorData = {
    labels: clientData.clientBehavior.preferred_services.map(item => item.service),
    datasets: [
      {
        label: 'Preferências de Serviços',
        data: clientData.clientBehavior.preferred_services.map(item => item.count),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Análise de Clientes</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => onExport('clients', 'pdf')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Exportar PDF
          </button>
          <button
            onClick={() => onExport('clients', 'excel')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Client Segmentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Segmentação de Clientes</h3>
          <div className="h-64">
            <Doughnut
              data={segmentationData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  },
                }
              }}
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Detalhes da Segmentação</h3>
          <div className="space-y-3">
            {clientData.clientSegmentation.map((segment) => (
              <div key={segment.segment} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{segment.segment}</p>
                  <p className="text-sm text-gray-500">{segment.count} clientes ({segment.percentage.toFixed(1)}%)</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(segment.averageValue)}</p>
                  <p className="text-sm text-gray-500">Valor médio</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Client Retention */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Retenção de Clientes</h3>
        <div className="h-64">
          <Bar
            data={retentionData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                }
              }
            }}
          />
        </div>
      </div>

      {/* Top Clients */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top 10 Clientes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Gasto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agendamentos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Agendamento
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientData.topClients.slice(0, 10).map((client) => (
                <tr key={client.client_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {client.client_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(client.total_spent)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.appointments_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(client.last_appointment), 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Behavior */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Comportamento dos Clientes</h3>
        <div className="h-64">
          <Bar
            data={behaviorData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                }
              }
            }}
          />
        </div>
      </div>

      {/* Client Lifetime Value */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Valor do Tempo de Vida do Cliente (LTV)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Primeiro Agendamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total de Agendamentos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Gasto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Intervalo Médio (dias)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clientData.clientLifetime.slice(0, 10).map((client) => (
                <tr key={client.client_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {client.client_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(client.first_appointment), 'dd/MM/yyyy', { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.total_appointments}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(client.total_spent)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.average_interval} dias
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

### 3. Sistema de Alertas e Notificações

#### 3.1 Componente de Alertas
```typescript
// src/components/reports/report-alerts.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface Alert {
  id: string
  type: 'warning' | 'info' | 'success' | 'error'
  title: string
  message: string
  action?: {
    label: string
    href: string
  }
  created_at: string
  is_read: boolean
}

export function ReportAlerts() {
  const { company } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadAlerts()
    }
  }, [company?.id])

  const loadAlerts = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .rpc('get_business_alerts', {
          company_id: company!.id
        })

      if (error) throw error

      setAlerts(data || [])
    } catch (error) {
      console.error('Erro ao carregar alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('business_alerts')
        .update({ is_read: true })
        .eq('id', alertId)
        .eq('company_id', company!.id)

      if (error) throw error

      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ))
    } catch (error) {
      console.error('Erro ao marcar alerta como lido:', error)
    }
  }

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('business_alerts')
        .delete()
        .eq('id', alertId)
        .eq('company_id', company!.id)

      if (error) throw error

      setAlerts(alerts.filter(alert => alert.id !== alertId))
    } catch (error) {
      console.error('Erro ao dispensar alerta:', error)
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return ExclamationTriangleIcon
      case 'info':
        return InformationCircleIcon
      case 'success':
        return CheckCircleIcon
      default:
        return ExclamationTriangleIcon
    }
  }

  const getAlertColors = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-400',
          title: 'text-yellow-800',
          message: 'text-yellow-700'
        }
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-400',
          title: 'text-blue-800',
          message: 'text-blue-700'
        }
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-400',
          title: 'text-green-800',
          message: 'text-green-700'
        }
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-400',
          title: 'text-red-800',
          message: 'text-red-700'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: 'text-gray-400',
          title: 'text-gray-800',
          message: 'text-gray-700'
        }
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-6">
        <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum alerta</h3>
        <p className="mt-1 text-sm text-gray-500">
          Tudo está funcionando perfeitamente!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Alertas do Sistema</h3>
      
      {alerts.map((alert) => {
        const Icon = getAlertIcon(alert.type)
        const colors = getAlertColors(alert.type)
        
        return (
          <div
            key={alert.id}
            className={clsx(
              'rounded-lg border p-4',
              colors.bg,
              colors.border,
              !alert.is_read && 'ring-2 ring-offset-2 ring-blue-500'
            )}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <Icon className={clsx('h-5 w-5', colors.icon)} aria-hidden="true" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className={clsx('text-sm font-medium', colors.title)}>
                  {alert.title}
                </h3>
                <div className={clsx('mt-1 text-sm', colors.message)}>
                  <p>{alert.message}</p>
                </div>
                {alert.action && (
                  <div className="mt-3">
                    <a
                      href={alert.action.href}
                      className={clsx(
                        'text-sm font-medium underline',
                        colors.title,
                        'hover:no-underline'
                      )}
                    >
                      {alert.action.label}
                    </a>
                  </div>
                )}
              </div>
              <div className="ml-3 flex-shrink-0">
                <div className="flex space-x-2">
                  {!alert.is_read && (
                    <button
                      onClick={() => markAsRead(alert.id)}
                      className="text-gray-400 hover:text-gray-500"
                      title="Marcar como lido"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-gray-400 hover:text-gray-500"
                    title="Dispensar alerta"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

## ✅ Critérios de Aceitação

- [ ] Dashboard executivo com KPIs principais implementado
- [ ] Sistema de abas para diferentes tipos de relatórios
- [ ] Análise de clientes com segmentação e LTV
- [ ] Relatórios de performance de serviços
- [ ] Análise financeira detalhada com gráficos
- [ ] Relatórios operacionais (agendamentos, funcionários)
- [ ] Sistema de análise preditiva básica
- [ ] Exportação de relatórios em PDF e Excel
- [ ] Sistema de alertas e notificações
- [ ] Comparação entre períodos
- [ ] Gráficos interativos implementados
- [ ] Filtros por data funcionando
- [ ] Responsividade implementada
- [ ] Performance otimizada para grandes volumes

## 🔄 Próximos Passos

Após completar esta fase:
1. **Fase 10**: Implementar sistema de notificações e comunicação
2. Adicionar mais análises preditivas (IA/ML)
3. Implementar dashboards personalizáveis
4. Criar relatórios automatizados por email
5. Integrar com ferramentas de BI externas

## 📝 Notas Importantes

- Implementar cache para relatórios pesados
- Otimizar consultas SQL para performance
- Adicionar índices apropriados no banco
- Implementar paginação para grandes datasets
- Criar sistema de permissões por tipo de relatório
- Adicionar watermarks nos relatórios exportados
- Implementar agendamento de relatórios
- Criar templates personalizáveis
- Adicionar comparações com benchmarks do setor
- Implementar alertas automáticos baseados em métricas

---

**Tempo estimado: 5-6 dias**  
**Complexidade: Alta**  
**Dependências: Todas as fases anteriores concluídas**