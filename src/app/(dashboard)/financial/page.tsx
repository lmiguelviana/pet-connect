'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  CurrencyDollarIcon, 
  PlusIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { clsx } from 'clsx'
import { 
  CategoryManager, 
  AccountManager, 
  TransactionForm, 
  TransactionList 
} from '@/components/financial'

type FinancialAccount = {
  id: string
  name: string
  type: 'checking' | 'savings' | 'cash' | 'credit_card'
  balance: number
  is_active: boolean
  created_at: string
  company_id: string
}

type FinancialTransaction = {
  id: string
  account_id: string
  category_id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  date: string
  reference_type?: string
  reference_id?: string
  created_at: string
  company_id: string
  account?: FinancialAccount
  category?: {
    id: string
    name: string
    type: 'income' | 'expense'
    color: string
  }
}

type TabType = 'dashboard' | 'accounts' | 'categories' | 'transactions'

export default function FinancialPage() {
  const { company } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [stats, setStats] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    netProfit: 0
  })
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadFinancialData()
    }
  }, [company?.id])

  const loadFinancialData = async () => {
    try {
      setLoading(true)
      
      // Carregar contas
      const { data: accountsData, error: accountsError } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('company_id', company!.id)
        .eq('is_active', true)
        .order('name')

      if (accountsError) throw accountsError
      setAccounts(accountsData || [])

      // Carregar transações recentes
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('financial_transactions')
        .select(`
          *,
          account:financial_accounts(id, name, type),
          category:financial_categories(id, name, type, color)
        `)
        .eq('company_id', company!.id)
        .order('date', { ascending: false })
        .limit(10)

      if (transactionsError) throw transactionsError
      setTransactions(transactionsData || [])

      // Calcular estatísticas
      const totalBalance = (accountsData || []).reduce((sum, account) => sum + account.balance, 0)
      
      // Transações do mês atual
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
      const { data: monthlyTransactions } = await supabase
        .from('financial_transactions')
        .select('type, amount')
        .eq('company_id', company!.id)
        .gte('date', `${currentMonth}-01`)
        .lt('date', `${currentMonth}-32`)

      const monthlyIncome = (monthlyTransactions || [])
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const monthlyExpenses = (monthlyTransactions || [])
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      setStats({
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        netProfit: monthlyIncome - monthlyExpenses
      })

    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error)
      toast.error('Erro ao carregar dados financeiros')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: ArrowTrendingUpIcon },
    { id: 'accounts', name: 'Contas', icon: BanknotesIcon },
    { id: 'categories', name: 'Categorias', icon: ScaleIcon },
    { id: 'transactions', name: 'Transações', icon: CurrencyDollarIcon },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="mt-1 text-sm text-gray-500">
            Controle financeiro completo do seu pet shop
          </p>
        </div>
        <Button 
          className="flex items-center gap-2"
          onClick={() => {
            setActiveTab('transactions')
            setShowTransactionForm(true)
          }}
        >
          <PlusIcon className="h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={clsx(
                  'flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BanknotesIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Saldo Total
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(stats.totalBalance)}
                    </dd>
                  </dl>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Receitas do Mês
                    </dt>
                    <dd className="text-lg font-medium text-green-600">
                      {formatCurrency(stats.monthlyIncome)}
                    </dd>
                  </dl>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingDownIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Despesas do Mês
                    </dt>
                    <dd className="text-lg font-medium text-red-600">
                      {formatCurrency(stats.monthlyExpenses)}
                    </dd>
                  </dl>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ScaleIcon className={clsx(
                    "h-8 w-8",
                    stats.netProfit >= 0 ? "text-green-600" : "text-red-600"
                  )} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Lucro Líquido
                    </dt>
                    <dd className={clsx(
                      "text-lg font-medium",
                      stats.netProfit >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(stats.netProfit)}
                    </dd>
                  </dl>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Transações Recentes</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveTab('transactions')}
              >
                Ver Todas
              </Button>
            </div>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma transação</h3>
                <p className="mt-1 text-sm text-gray-500">Comece criando sua primeira transação.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-3">
                      <div className={clsx(
                        "w-3 h-3 rounded-full",
                        transaction.type === 'income' ? "bg-green-500" : "bg-red-500"
                      )} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {transaction.account?.name} • {transaction.category?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={clsx(
                        "text-sm font-medium",
                        transaction.type === 'income' ? "text-green-600" : "text-red-600"
                      )}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Gestão de Contas */}
      {activeTab === 'accounts' && (
        <AccountManager onAccountChange={loadFinancialData} />
      )}

      {/* Gestão de Categorias */}
      {activeTab === 'categories' && (
        <CategoryManager />
      )}

      {/* Gestão de Transações */}
      {activeTab === 'transactions' && (
        <TransactionList 
          onTransactionChange={loadFinancialData}
          showForm={showTransactionForm}
          onFormClose={() => setShowTransactionForm(false)}
        />
      )}
    </div>
  )
}