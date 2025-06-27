'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useCRUDToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase'
import { TransactionForm } from './transaction-form'
import { 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Tag,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye
} from 'lucide-react'

interface Transaction {
  id: string
  account_id: string
  category_id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  date: string
  appointment_id?: string
  created_at: string
  updated_at: string
  account: {
    name: string
    type: string
  }
  category: {
    name: string
    type: string
    color: string
    icon: string
  }
  appointment?: {
    id: string
    service_name: string
  }
}

interface Account {
  id: string
  name: string
  type: string
}

interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
}

interface Filters {
  search: string
  account_id: string
  category_id: string
  type: string
  date_from: string
  date_to: string
}

interface TransactionListProps {
  onTransactionChange?: () => void
  showForm?: boolean
  onFormClose?: () => void
}

export function TransactionList({ 
  onTransactionChange, 
  showForm = false, 
  onFormClose 
}: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(showForm)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    account_id: '',
    category_id: '',
    type: '',
    date_from: '',
    date_to: ''
  })
  
  const toast = useCRUDToast()

  // Sincronizar com prop externa
  useEffect(() => {
    setIsFormOpen(showForm)
  }, [showForm])
  const supabase = createClient()
  const itemsPerPage = 20

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData()
  }, [])

  // Carregar transações quando filtros ou página mudam
  useEffect(() => {
    loadTransactions()
  }, [currentPage, filters])

  // Carregar contas e categorias
  const loadInitialData = async () => {
    try {
      // Carregar contas
      const { data: accountsData, error: accountsError } = await supabase
        .from('financial_accounts')
        .select('id, name, type')
        .order('name')

      if (accountsError) throw accountsError
      setAccounts(accountsData || [])

      // Carregar categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('financial_categories')
        .select('*')
        .order('type', { ascending: false })
        .order('name')

      if (categoriesError) throw categoriesError
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error)
      toast.error('Erro ao carregar dados')
    }
  }

  // Carregar transações
  const loadTransactions = async () => {
    try {
      setIsLoading(true)
      
      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          account:financial_accounts(name, type),
          category:financial_categories(name, type, color, icon),
          appointment:appointments(id, service_name)
        `, { count: 'exact' })
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)

      // Aplicar filtros
      if (filters.search) {
        query = query.ilike('description', `%${filters.search}%`)
      }
      
      if (filters.account_id) {
        query = query.eq('account_id', filters.account_id)
      }
      
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id)
      }
      
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      
      if (filters.date_from) {
        query = query.gte('date', filters.date_from)
      }
      
      if (filters.date_to) {
        query = query.lte('date', filters.date_to)
      }

      const { data, error, count } = await query

      if (error) throw error
      
      setTransactions(data || [])
      setTotalCount(count || 0)
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
      toast.error('Erro ao carregar transações')
    } finally {
      setIsLoading(false)
    }
  }

  // Abrir formulário para nova transação
  const openForm = () => {
    setEditingTransaction(null)
    setIsFormOpen(true)
  }

  // Abrir formulário para editar transação
  const editTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsFormOpen(true)
  }

  // Fechar formulário
  const closeForm = () => {
    setIsFormOpen(false)
    setEditingTransaction(null)
    onFormClose?.()
  }

  // Callback de sucesso do formulário
  const onFormSuccess = () => {
    loadTransactions()
    onTransactionChange?.()
  }

  // Excluir transação
  const deleteTransaction = async (transaction: Transaction) => {
    if (transaction.appointment_id) {
      toast.error('Não é possível excluir transações geradas automaticamente por agendamentos')
      return
    }

    if (!confirm(`Tem certeza que deseja excluir esta transação?\n\n${transaction.description}`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', transaction.id)

      if (error) throw error
      toast.success('Transação excluída com sucesso')
      loadTransactions()
      onTransactionChange?.()
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      toast.error('Erro ao excluir transação')
    }
  }

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      search: '',
      account_id: '',
      category_id: '',
      type: '',
      date_from: '',
      date_to: ''
    })
    setCurrentPage(1)
  }

  // Aplicar filtros
  const applyFilters = () => {
    setCurrentPage(1)
    loadTransactions()
  }

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(value))
  }

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  // Calcular totais
  const totals = transactions.reduce(
    (acc, transaction) => {
      if (transaction.type === 'income') {
        acc.income += transaction.amount
      } else {
        acc.expense += Math.abs(transaction.amount)
      }
      return acc
    },
    { income: 0, expense: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transações</h2>
          <p className="text-gray-600">Gerencie suas receitas e despesas</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            size="sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button onClick={openForm} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Receitas</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(totals.income)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Despesas</p>
              <p className="text-lg font-semibold text-red-600">
                {formatCurrency(totals.expense)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              totals.income - totals.expense >= 0 
                ? 'bg-green-100 text-green-600' 
                : 'bg-red-100 text-red-600'
            }`}>
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Saldo</p>
              <p className={`text-lg font-semibold ${
                totals.income - totals.expense >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {formatCurrency(totals.income - totals.expense)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Buscar por descrição..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conta
              </label>
              <Select
                value={filters.account_id}
                onValueChange={(value) => setFilters({ ...filters, account_id: value })}
              >
                <option value="">Todas as contas</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <Select
                value={filters.category_id}
                onValueChange={(value) => setFilters({ ...filters, category_id: value })}
              >
                <option value="">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <option value="">Todos os tipos</option>
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </Select>
            </div>

            {/* Data De */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data De
              </label>
              <Input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              />
            </div>

            {/* Data Até */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Até
              </label>
              <Input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={applyFilters} size="sm">
              Aplicar Filtros
            </Button>
            <Button variant="outline" onClick={clearFilters} size="sm">
              Limpar
            </Button>
          </div>
        </Card>
      )}

      {/* Lista de transações */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Carregando transações...</div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center p-8">
            <div className="text-gray-500 mb-4">
              {Object.values(filters).some(f => f) 
                ? 'Nenhuma transação encontrada com os filtros aplicados' 
                : 'Nenhuma transação encontrada'
              }
            </div>
            {!Object.values(filters).some(f => f) && (
              <Button onClick={openForm} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar primeira transação
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conta
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDate(transaction.date)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.description}
                        </div>
                        {transaction.appointment && (
                          <div className="text-xs text-blue-600">
                            Agendamento: {transaction.appointment.service_name}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{transaction.category.icon}</span>
                        <Badge 
                          className={`${transaction.category.color} text-white`}
                          style={{ backgroundColor: transaction.category.color }}
                        >
                          {transaction.category.name}
                        </Badge>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {transaction.account.name}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {transaction.type === 'income' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          transaction.type === 'income' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editTransaction(transaction)}
                          className="h-8 w-8 p-0"
                          disabled={!!transaction.appointment_id}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTransaction(transaction)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={!!transaction.appointment_id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-700">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} transações
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 text-sm">
                {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Formulário de transação */}
      <TransactionForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSuccess={onFormSuccess}
        editingTransaction={editingTransaction}
      />
    </div>
  )
}