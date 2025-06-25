# 💰 Fase 08 - Módulo Financeiro

## 📋 Objetivos da Fase

- Implementar controle de receitas e despesas
- Criar sistema de métodos de pagamento
- Implementar relatórios financeiros
- Adicionar dashboard financeiro
- Criar sistema de comissões
- Implementar controle de fluxo de caixa
- Adicionar integração com gateways de pagamento
- Criar sistema de faturas e recibos

## ⏱️ Estimativa: 6-7 dias

## 🛠️ Tarefas Detalhadas

### 1. Estrutura Base do Módulo Financeiro

#### 1.1 Página Principal Financeira
```typescript
// src/app/(dashboard)/financial/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { FinancialDashboard } from '@/components/financial/financial-dashboard'
import { TransactionsList } from '@/components/financial/transactions-list'
import { FinancialFilters } from '@/components/financial/financial-filters'
import { Button } from '@/components/ui/button'
import { PlusIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  category: string
  subcategory?: string
  amount: number
  description: string
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer' | 'check'
  status: 'pending' | 'completed' | 'cancelled'
  transaction_date: string
  due_date?: string
  paid_date?: string
  reference_id?: string // ID do agendamento, cliente, etc.
  reference_type?: 'appointment' | 'client' | 'supplier' | 'other'
  tags: string[]
  attachments: {
    id: string
    name: string
    url: string
    type: string
  }[]
  created_at: string
  updated_at: string
  company_id: string
  created_by: string
  client?: {
    id: string
    name: string
  }
  appointment?: {
    id: string
    service_name: string
  }
}

export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  pendingIncome: number
  pendingExpenses: number
  cashFlow: number
  transactionsCount: number
  averageTicket: number
}

export default function FinancialPage() {
  const { company } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  })
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadFinancialData()
    }
  }, [company?.id, dateRange, typeFilter, statusFilter, categoryFilter, paymentMethodFilter])

  const loadFinancialData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadTransactions(),
        loadSummary()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error)
      toast.error('Erro ao carregar dados financeiros')
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async () => {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        client:clients(id, name),
        appointment:appointments(id, service_name),
        attachments:transaction_attachments(id, name, url, type)
      `)
      .eq('company_id', company!.id)
      .gte('transaction_date', format(dateRange.start, 'yyyy-MM-dd'))
      .lte('transaction_date', format(dateRange.end, 'yyyy-MM-dd'))

    // Aplicar filtros
    if (typeFilter !== 'all') {
      query = query.eq('type', typeFilter)
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    if (categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter)
    }

    if (paymentMethodFilter !== 'all') {
      query = query.eq('payment_method', paymentMethodFilter)
    }

    query = query.order('transaction_date', { ascending: false })

    const { data, error } = await query

    if (error) throw error

    setTransactions(data || [])
  }

  const loadSummary = async () => {
    const { data, error } = await supabase
      .rpc('get_financial_summary', {
        company_id: company!.id,
        start_date: format(dateRange.start, 'yyyy-MM-dd'),
        end_date: format(dateRange.end, 'yyyy-MM-dd')
      })

    if (error) throw error

    setSummary(data)
  }

  const handleExportData = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('company_id', company!.id)
        .gte('transaction_date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('transaction_date', format(dateRange.end, 'yyyy-MM-dd'))
        .csv()

      if (error) throw error

      // Criar e baixar arquivo CSV
      const blob = new Blob([data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `financeiro_${format(dateRange.start, 'yyyy-MM-dd')}_${format(dateRange.end, 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Dados exportados com sucesso!')
    } catch (error) {
      console.error('Erro ao exportar dados:', error)
      toast.error('Erro ao exportar dados')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
            Financeiro
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Controle completo das finanças do seu pet shop
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <Button
            variant="outline"
            onClick={handleExportData}
            className="inline-flex items-center"
          >
            <DocumentArrowDownIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Exportar
          </Button>
          <Link href="/financial/transactions/new">
            <Button className="inline-flex items-center">
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Nova Transação
            </Button>
          </Link>
        </div>
      </div>

      {/* Dashboard */}
      <FinancialDashboard summary={summary} loading={loading} />

      {/* Filters */}
      <FinancialFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        paymentMethodFilter={paymentMethodFilter}
        onPaymentMethodFilterChange={setPaymentMethodFilter}
      />

      {/* Transactions List */}
      <TransactionsList
        transactions={transactions}
        loading={loading}
        onRefresh={loadFinancialData}
      />
    </div>
  )
}
```

#### 1.2 Dashboard Financeiro
```typescript
// src/components/financial/financial-dashboard.tsx
import { FinancialSummary } from '@/app/(dashboard)/financial/page'
import { 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ClockIcon,
  ChartBarIcon,
  CalculatorIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface FinancialDashboardProps {
  summary: FinancialSummary | null
  loading: boolean
}

export function FinancialDashboard({ summary, loading }: FinancialDashboardProps) {
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

  if (!summary) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500 text-center">Nenhum dado financeiro encontrado para o período selecionado.</p>
      </div>
    )
  }

  const stats = [
    {
      name: 'Receitas',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(summary.totalIncome),
      icon: ArrowTrendingUpIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: summary.pendingIncome > 0 ? `+${new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(summary.pendingIncome)} pendente` : '',
      changeType: 'positive',
    },
    {
      name: 'Despesas',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(summary.totalExpenses),
      icon: ArrowTrendingDownIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: summary.pendingExpenses > 0 ? `+${new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(summary.pendingExpenses)} pendente` : '',
      changeType: 'negative',
    },
    {
      name: 'Lucro Líquido',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(summary.netProfit),
      icon: CalculatorIcon,
      color: summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: summary.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50',
      change: '',
      changeType: summary.netProfit >= 0 ? 'positive' : 'negative',
    },
    {
      name: 'Fluxo de Caixa',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(summary.cashFlow),
      icon: BanknotesIcon,
      color: summary.cashFlow >= 0 ? 'text-blue-600' : 'text-orange-600',
      bgColor: summary.cashFlow >= 0 ? 'bg-blue-50' : 'bg-orange-50',
      change: '',
      changeType: summary.cashFlow >= 0 ? 'positive' : 'negative',
    },
    {
      name: 'Transações',
      value: summary.transactionsCount,
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '',
      changeType: 'neutral',
    },
    {
      name: 'Ticket Médio',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(summary.averageTicket),
      icon: CreditCardIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      change: '',
      changeType: 'neutral',
    },
    {
      name: 'Receitas Pendentes',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(summary.pendingIncome),
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      change: '',
      changeType: 'neutral',
    },
    {
      name: 'Despesas Pendentes',
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(summary.pendingExpenses),
      icon: ClockIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '',
      changeType: 'neutral',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`rounded-md p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className={clsx(
                      'text-2xl font-semibold',
                      stat.changeType === 'positive' ? 'text-green-900' :
                      stat.changeType === 'negative' ? 'text-red-900' :
                      'text-gray-900'
                    )}>
                      {stat.value}
                    </div>
                  </dd>
                  {stat.change && (
                    <dd className="text-xs text-gray-600">
                      {stat.change}
                    </dd>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 2. Formulário de Transações

#### 2.1 Página de Nova Transação
```typescript
// src/app/(dashboard)/financial/transactions/new/page.tsx
'use client'

import { TransactionForm } from '@/components/financial/transaction-form'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function NewTransactionPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/financial"
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Voltar para financeiro
        </Link>
      </div>

      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
            Nova Transação
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Registre uma nova receita ou despesa
          </p>
        </div>
      </div>

      {/* Form */}
      <TransactionForm />
    </div>
  )
}
```

#### 2.2 Componente do Formulário de Transação
```typescript
// src/components/financial/transaction-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/ui/file-upload'
import { ClientSelect } from '@/components/ui/client-select'
import { toast } from 'react-hot-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'

const transactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    required_error: 'Selecione o tipo de transação',
  }),
  category: z.string().min(1, 'Selecione uma categoria'),
  subcategory: z.string().optional(),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().min(2, 'Descrição deve ter pelo menos 2 caracteres'),
  payment_method: z.enum(['cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'check'], {
    required_error: 'Selecione um método de pagamento',
  }),
  status: z.enum(['pending', 'completed', 'cancelled']).default('completed'),
  transaction_date: z.string().min(1, 'Data da transação é obrigatória'),
  due_date: z.string().optional(),
  paid_date: z.string().optional(),
  reference_id: z.string().optional(),
  reference_type: z.enum(['appointment', 'client', 'supplier', 'other']).optional(),
  tags: z.array(z.string()).default([]),
})

type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionFormProps {
  initialData?: Partial<TransactionFormData & { id: string; attachments: { id: string; name: string; url: string; type: string }[] }>
  isEditing?: boolean
}

export function TransactionForm({ initialData, isEditing = false }: TransactionFormProps) {
  const router = useRouter()
  const { company, user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [attachments, setAttachments] = useState<{ name: string; url: string; type: string }[]>(
    initialData?.attachments?.map(a => ({ name: a.name, url: a.url, type: a.type })) || []
  )
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [newTag, setNewTag] = useState('')
  const [categories, setCategories] = useState<{ value: string; label: string; subcategories?: string[] }[]>([])
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: initialData?.type || 'income',
      category: initialData?.category || '',
      subcategory: initialData?.subcategory || '',
      amount: initialData?.amount || 0,
      description: initialData?.description || '',
      payment_method: initialData?.payment_method || 'cash',
      status: initialData?.status || 'completed',
      transaction_date: initialData?.transaction_date || format(new Date(), 'yyyy-MM-dd'),
      due_date: initialData?.due_date || '',
      paid_date: initialData?.paid_date || '',
      reference_id: initialData?.reference_id || '',
      reference_type: initialData?.reference_type || undefined,
      tags: initialData?.tags || [],
    },
  })

  const watchType = watch('type')
  const watchCategory = watch('category')
  const watchStatus = watch('status')

  useEffect(() => {
    loadCategories()
  }, [watchType])

  const loadCategories = () => {
    if (watchType === 'income') {
      setCategories([
        { value: 'services', label: 'Serviços', subcategories: ['grooming', 'veterinary', 'boarding', 'training'] },
        { value: 'products', label: 'Produtos', subcategories: ['food', 'toys', 'accessories', 'medicine'] },
        { value: 'consultations', label: 'Consultas' },
        { value: 'other_income', label: 'Outras Receitas' },
      ])
    } else {
      setCategories([
        { value: 'supplies', label: 'Suprimentos', subcategories: ['food', 'cleaning', 'medical', 'office'] },
        { value: 'salaries', label: 'Salários e Encargos' },
        { value: 'rent', label: 'Aluguel e Condomínio' },
        { value: 'utilities', label: 'Utilidades', subcategories: ['electricity', 'water', 'internet', 'phone'] },
        { value: 'marketing', label: 'Marketing e Publicidade' },
        { value: 'equipment', label: 'Equipamentos e Manutenção' },
        { value: 'taxes', label: 'Impostos e Taxas' },
        { value: 'other_expenses', label: 'Outras Despesas' },
      ])
    }
  }

  const onSubmit = async (data: TransactionFormData) => {
    try {
      setLoading(true)

      const transactionData = {
        ...data,
        subcategory: data.subcategory || null,
        due_date: data.due_date || null,
        paid_date: data.paid_date || null,
        reference_id: data.reference_id || null,
        reference_type: data.reference_type || null,
        tags,
        company_id: company!.id,
        created_by: user!.id,
      }

      let transactionId: string

      if (isEditing && initialData?.id) {
        const { error } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', initialData.id)
          .eq('company_id', company!.id)

        if (error) throw error
        transactionId = initialData.id
        toast.success('Transação atualizada com sucesso!')
      } else {
        const { data: newTransaction, error } = await supabase
          .from('transactions')
          .insert([transactionData])
          .select('id')
          .single()

        if (error) throw error
        transactionId = newTransaction.id
        toast.success('Transação registrada com sucesso!')
      }

      // Salvar anexos
      if (attachments.length > 0) {
        // Remover anexos antigos se estiver editando
        if (isEditing) {
          await supabase
            .from('transaction_attachments')
            .delete()
            .eq('transaction_id', transactionId)
        }

        // Inserir novos anexos
        const attachmentData = attachments.map(attachment => ({
          transaction_id: transactionId,
          name: attachment.name,
          url: attachment.url,
          type: attachment.type,
          company_id: company!.id,
        }))

        const { error: attachmentError } = await supabase
          .from('transaction_attachments')
          .insert(attachmentData)

        if (attachmentError) throw attachmentError
      }

      router.push('/financial')
    } catch (error: any) {
      console.error('Erro ao salvar transação:', error)
      toast.error(error.message || 'Erro ao salvar transação')
    } finally {
      setLoading(false)
    }
  }

  const handleAttachmentsChange = (newAttachments: { name: string; url: string; type: string }[]) => {
    setAttachments(newAttachments)
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()]
      setTags(updatedTags)
      setValue('tags', updatedTags)
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    const updatedTags = tags.filter(t => t !== tag)
    setTags(updatedTags)
    setValue('tags', updatedTags)
  }

  const paymentMethodOptions = [
    { value: 'cash', label: 'Dinheiro' },
    { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'debit_card', label: 'Cartão de Débito' },
    { value: 'pix', label: 'PIX' },
    { value: 'bank_transfer', label: 'Transferência Bancária' },
    { value: 'check', label: 'Cheque' },
  ]

  const statusOptions = [
    { value: 'pending', label: 'Pendente' },
    { value: 'completed', label: 'Concluída' },
    { value: 'cancelled', label: 'Cancelada' },
  ]

  const selectedCategory = categories.find(cat => cat.value === watchCategory)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Transação *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none">
                  <input
                    type="radio"
                    value="income"
                    {...register('type')}
                    className="sr-only"
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">💰 Receita</span>
                      <span className="mt-1 flex items-center text-sm text-gray-500">Entrada de dinheiro</span>
                    </span>
                  </span>
                  <span className="pointer-events-none absolute -inset-px rounded-lg border-2 border-transparent peer-checked:border-green-500" aria-hidden="true" />
                </label>
                <label className="relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none">
                  <input
                    type="radio"
                    value="expense"
                    {...register('type')}
                    className="sr-only"
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">💸 Despesa</span>
                      <span className="mt-1 flex items-center text-sm text-gray-500">Saída de dinheiro</span>
                    </span>
                  </span>
                  <span className="pointer-events-none absolute -inset-px rounded-lg border-2 border-transparent peer-checked:border-red-500" aria-hidden="true" />
                </label>
              </div>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                id="amount"
                {...register('amount', { valueAsNumber: true })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="0,00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Categoria *
              </label>
              <select
                id="category"
                {...register('category')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* Subcategory */}
            {selectedCategory?.subcategories && (
              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700">
                  Subcategoria
                </label>
                <select
                  id="subcategory"
                  {...register('subcategory')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Selecione uma subcategoria</option>
                  {selectedCategory.subcategories.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Description */}
            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descrição *
              </label>
              <textarea
                id="description"
                rows={3}
                {...register('description')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Descreva a transação..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700">
                Método de Pagamento *
              </label>
              <select
                id="payment_method"
                {...register('payment_method')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                {paymentMethodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.payment_method && (
                <p className="mt-1 text-sm text-red-600">{errors.payment_method.message}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status *
              </label>
              <select
                id="status"
                {...register('status')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>

            {/* Transaction Date */}
            <div>
              <label htmlFor="transaction_date" className="block text-sm font-medium text-gray-700">
                Data da Transação *
              </label>
              <input
                type="date"
                id="transaction_date"
                {...register('transaction_date')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {errors.transaction_date && (
                <p className="mt-1 text-sm text-red-600">{errors.transaction_date.message}</p>
              )}
            </div>

            {/* Due Date (for pending transactions) */}
            {watchStatus === 'pending' && (
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  id="due_date"
                  {...register('due_date')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            )}

            {/* Paid Date (for completed transactions) */}
            {watchStatus === 'completed' && (
              <div>
                <label htmlFor="paid_date" className="block text-sm font-medium text-gray-700">
                  Data do Pagamento
                </label>
                <input
                  type="date"
                  id="paid_date"
                  {...register('paid_date')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            )}

            {/* Client Reference */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente Relacionado (opcional)
              </label>
              <ClientSelect
                value={watch('reference_id') || ''}
                onChange={(clientId) => {
                  setValue('reference_id', clientId)
                  setValue('reference_type', clientId ? 'client' : undefined)
                }}
                placeholder="Selecione um cliente..."
              />
            </div>

            {/* Tags */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Ex: urgente, recorrente, promocional"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={!newTag.trim()}
                >
                  Adicionar
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-primary-600 hover:text-primary-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anexos (Notas fiscais, recibos, etc.)
              </label>
              <FileUpload
                files={attachments}
                onChange={handleAttachmentsChange}
                maxFiles={5}
                acceptedTypes={['image/*', 'application/pdf', '.doc', '.docx']}
                folder={`transactions/${company!.id}`}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {isEditing ? 'Atualizar Transação' : 'Registrar Transação'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
```

### 3. Relatórios Financeiros

#### 3.1 Página de Relatórios
```typescript
// src/app/(dashboard)/financial/reports/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { FinancialCharts } from '@/components/financial/financial-charts'
import { ReportFilters } from '@/components/financial/report-filters'
import { ReportExport } from '@/components/financial/report-export'
import { Button } from '@/components/ui/button'
import { DocumentArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { format, startOfYear, endOfYear, subMonths } from 'date-fns'

export interface FinancialReport {
  period: string
  totalIncome: number
  totalExpenses: number
  netProfit: number
  transactionsCount: number
  averageTicket: number
  topCategories: {
    category: string
    amount: number
    percentage: number
  }[]
  monthlyData: {
    month: string
    income: number
    expenses: number
    profit: number
  }[]
  paymentMethods: {
    method: string
    amount: number
    percentage: number
  }[]
}

export default function FinancialReportsPage() {
  const { company } = useAuth()
  const [report, setReport] = useState<FinancialReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: startOfYear(new Date()),
    end: endOfYear(new Date())
  })
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'comparison'>('summary')
  const [comparisonPeriod, setComparisonPeriod] = useState<'previous_year' | 'previous_month' | 'custom'>('previous_year')
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadReport()
    }
  }, [company?.id, dateRange, reportType])

  const loadReport = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .rpc('generate_financial_report', {
          company_id: company!.id,
          start_date: format(dateRange.start, 'yyyy-MM-dd'),
          end_date: format(dateRange.end, 'yyyy-MM-dd'),
          report_type: reportType
        })

      if (error) throw error

      setReport(data)
    } catch (error) {
      console.error('Erro ao carregar relatório:', error)
      toast.error('Erro ao carregar relatório financeiro')
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const { data, error } = await supabase.functions.invoke('export-financial-report', {
        body: {
          company_id: company!.id,
          start_date: format(dateRange.start, 'yyyy-MM-dd'),
          end_date: format(dateRange.end, 'yyyy-MM-dd'),
          report_type: reportType,
          export_format: format
        }
      })

      if (error) throw error

      // Download do arquivo
      const blob = new Blob([data], { 
        type: format === 'pdf' ? 'application/pdf' : 
              format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
              'text/csv'
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio_financeiro_${format(dateRange.start, 'yyyy-MM-dd')}_${format(dateRange.end, 'yyyy-MM-dd')}.${format}`
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
            Relatórios Financeiros
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Análise detalhada da performance financeira
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <ReportExport onExport={handleExportReport} loading={loading} />
        </div>
      </div>

      {/* Filters */}
      <ReportFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        reportType={reportType}
        onReportTypeChange={setReportType}
        comparisonPeriod={comparisonPeriod}
        onComparisonPeriodChange={setComparisonPeriod}
      />

      {/* Charts and Analysis */}
      <FinancialCharts report={report} loading={loading} />
    </div>
  )
}
```

## ✅ Critérios de Aceitação

- [ ] CRUD completo de transações implementado
- [ ] Dashboard financeiro com métricas principais
- [ ] Sistema de categorização de receitas/despesas
- [ ] Múltiplos métodos de pagamento suportados
- [ ] Controle de status das transações
- [ ] Upload de anexos (notas fiscais, recibos)
- [ ] Sistema de tags para organização
- [ ] Filtros avançados por período, categoria, status
- [ ] Relatórios financeiros com gráficos
- [ ] Exportação de dados (CSV, PDF, Excel)
- [ ] Cálculo automático de métricas financeiras
- [ ] Integração com agendamentos e clientes
- [ ] Responsividade implementada
- [ ] Validações de segurança (RLS)

## 💳 Integração com Mercado Pago

### Configuração do Mercado Pago

```typescript
// src/lib/mercado-pago.ts
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
    idempotencyKey: 'abc'
  }
})

export const mercadoPago = {
  payment: new Payment(client),
  preference: new Preference(client)
}

// Criar preferência de pagamento
export async function createPaymentPreference(data: {
  title: string
  quantity: number
  unit_price: number
  description?: string
  external_reference?: string
}) {
  try {
    const preference = await mercadoPago.preference.create({
      body: {
        items: [{
          id: '1',
          title: data.title,
          quantity: data.quantity,
          unit_price: data.unit_price,
          description: data.description,
          currency_id: 'BRL'
        }],
        external_reference: data.external_reference,
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 12
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/payment/pending`
        },
        auto_return: 'approved'
      }
    })
    
    return preference
  } catch (error) {
    console.error('Erro ao criar preferência:', error)
    throw error
  }
}

// Verificar status do pagamento
export async function getPaymentStatus(paymentId: string) {
  try {
    const payment = await mercadoPago.payment.get({ id: paymentId })
    return payment
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error)
    throw error
  }
}
```

### Componente de Pagamento

```typescript
// src/components/financial/mercado-pago-button.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCardIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface MercadoPagoButtonProps {
  amount: number
  description: string
  onSuccess?: (paymentData: any) => void
  onError?: (error: any) => void
}

export function MercadoPagoButton({ 
  amount, 
  description, 
  onSuccess, 
  onError 
}: MercadoPagoButtonProps) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/mercado-pago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: description,
          quantity: 1,
          unit_price: amount,
          description
        })
      })

      const { preference } = await response.json()
      
      if (preference?.init_point) {
        // Redirecionar para o Mercado Pago
        window.open(preference.init_point, '_blank')
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error)
      toast.error('Erro ao processar pagamento')
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      className="bg-blue-500 hover:bg-blue-600 text-white"
    >
      <CreditCardIcon className="h-4 w-4 mr-2" />
      {loading ? 'Processando...' : `Pagar R$ ${amount.toFixed(2)}`}
    </Button>
  )
}
```

### API Routes para Mercado Pago

```typescript
// src/app/api/mercado-pago/create-preference/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createPaymentPreference } from '@/lib/mercado-pago'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const preference = await createPaymentPreference(body)
    
    return NextResponse.json({ preference })
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json(
      { error: 'Erro ao criar preferência de pagamento' },
      { status: 500 }
    )
  }
}
```

```typescript
// src/app/api/mercado-pago/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPaymentStatus } from '@/lib/mercado-pago'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data } = body
    
    if (data?.id) {
      const payment = await getPaymentStatus(data.id)
      
      // Atualizar status da transação no banco
      const supabase = createClient()
      
      await supabase
        .from('transactions')
        .update({
          status: payment.status === 'approved' ? 'completed' : 'pending',
          payment_reference: payment.id,
          updated_at: new Date().toISOString()
        })
        .eq('external_reference', payment.external_reference)
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro no webhook:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}
```

## 🔄 Próximos Passos

Após completar esta fase:
1. **Fase 09**: Implementar sistema de relatórios avançados
2. Integrar com gateways de pagamento (Mercado Pago, Stripe, PagSeguro)
3. Implementar sistema de comissões para funcionários
4. Criar alertas de vencimento de contas
5. Implementar conciliação bancária

## 📝 Notas Importantes

- Implementar backup automático dos dados financeiros
- Adicionar auditoria de todas as transações
- Configurar alertas para transações suspeitas
- Implementar controle de acesso por perfil
- Otimizar consultas para relatórios grandes
- Adicionar suporte para múltiplas moedas (futuro)
- Implementar sistema de aprovação para despesas altas
- Criar dashboard executivo para tomada de decisões
- Integrar com sistemas contábeis externos
- Implementar previsões financeiras baseadas em histórico

---

**Tempo estimado: 6-7 dias**  
**Complexidade: Alta**  
**Dependências: Fases anteriores concluídas**