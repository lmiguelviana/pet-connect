'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFinancialReports } from '@/hooks/use-financial-charts'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { 
  DocumentArrowDownIcon,
  FunnelIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'
import { toast } from 'react-hot-toast'

type FinancialAccount = {
  id: string
  name: string
  type: string
}

type FinancialCategory = {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
}

type Transaction = {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  date: string
  account?: FinancialAccount
  category?: FinancialCategory
}

type ReportFilters = {
  startDate: string
  endDate: string
  accountId?: string
  categoryId?: string
  type?: 'income' | 'expense'
}

export function FinancialReports() {
  const { company } = useAuth()
  const { generateReport, loading } = useFinancialReports()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const [categories, setCategories] = useState<FinancialCategory[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  })
  const supabase = createClient()

  const loadAccountsAndCategories = async () => {
    try {
      const [accountsRes, categoriesRes] = await Promise.all([
        supabase
          .from('financial_accounts')
          .select('id, name, type')
          .eq('company_id', company!.id)
          .eq('is_active', true),
        supabase
          .from('financial_categories')
          .select('id, name, type, color')
          .eq('company_id', company!.id)
          .eq('is_active', true)
      ])

      if (accountsRes.data) setAccounts(accountsRes.data)
      if (categoriesRes.data) setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Erro ao carregar contas e categorias:', error)
    }
  }

  const handleGenerateReport = async () => {
    if (!company?.id) return
    
    if (!accounts.length || !categories.length) {
      await loadAccountsAndCategories()
    }

    const reportData = await generateReport(filters)
    setTransactions(reportData)
    
    if (reportData.length === 0) {
      toast.info('Nenhuma transação encontrada para os filtros selecionados')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getTotalIncome = () => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const getTotalExpenses = () => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const exportToCSV = () => {
    if (transactions.length === 0) {
      toast.error('Nenhum dado para exportar')
      return
    }

    const headers = ['Data', 'Tipo', 'Descrição', 'Conta', 'Categoria', 'Valor']
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => [
        new Date(t.date).toLocaleDateString('pt-BR'),
        t.type === 'income' ? 'Receita' : 'Despesa',
        `"${t.description}"`,
        `"${t.account?.name || 'N/A'}"`,
        `"${t.category?.name || 'N/A'}"`,
        t.amount.toString().replace('.', ',')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio-financeiro-${filters.startDate}-${filters.endDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Relatório exportado com sucesso!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Relatórios Financeiros</h2>
          <p className="text-sm text-gray-500">Gere relatórios detalhados das suas transações</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <FunnelIcon className="h-4 w-4" />
            Filtros
          </Button>
          {transactions.length > 0 && (
            <Button
              onClick={exportToCSV}
              className="flex items-center gap-2"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              Exportar CSV
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros do Relatório</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inicial
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Final
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <Select value={filters.type || ''} onValueChange={(value) => 
                setFilters({ ...filters, type: value as 'income' | 'expense' || undefined })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conta
              </label>
              <Select value={filters.accountId || ''} onValueChange={(value) => 
                setFilters({ ...filters, accountId: value || undefined })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <Select value={filters.categoryId || ''} onValueChange={(value) => 
                setFilters({ ...filters, categoryId: value || undefined })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button onClick={handleGenerateReport} disabled={loading}>
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </div>
        </Card>
      )}

      {/* Resumo */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Receitas</p>
                <p className="text-2xl font-semibold text-green-600">
                  {formatCurrency(getTotalIncome())}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Despesas</p>
                <p className="text-2xl font-semibold text-red-600">
                  {formatCurrency(getTotalExpenses())}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className={clsx(
                  "h-8 w-8",
                  getTotalIncome() - getTotalExpenses() >= 0 ? "text-green-600" : "text-red-600"
                )} />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Saldo Líquido</p>
                <p className={clsx(
                  "text-2xl font-semibold",
                  getTotalIncome() - getTotalExpenses() >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(getTotalIncome() - getTotalExpenses())}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Lista de Transações */}
      {transactions.length > 0 ? (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Transações ({transactions.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={clsx(
                          "w-2 h-2 rounded-full mr-3",
                          transaction.type === 'income' ? "bg-green-500" : "bg-red-500"
                        )} />
                        <span className="text-sm text-gray-900">{transaction.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.account?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: transaction.category?.color + '20',
                          color: transaction.category?.color || '#6B7280'
                        }}
                      >
                        {transaction.category?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={clsx(
                        "text-sm font-medium",
                        transaction.type === 'income' ? "text-green-600" : "text-red-600"
                      )}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : !loading && (
        <Card className="p-12">
          <div className="text-center">
            <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum relatório gerado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Configure os filtros e clique em "Gerar Relatório" para começar.
            </p>
            <div className="mt-6">
              <Button onClick={() => setShowFilters(true)}>
                Configurar Filtros
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}