'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCRUDToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase'
import { 
  Save, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  CreditCard,
  Tag,
  Calendar
} from 'lucide-react'

interface Account {
  id: string
  name: string
  type: string
  current_balance?: number
  is_active: boolean
}

interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
}

interface TransactionFormData {
  account_id: string
  category_id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  date: string
  appointment_id?: string
}

interface TransactionFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingTransaction?: any
}

export function TransactionForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingTransaction 
}: TransactionFormProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<TransactionFormData>({
    account_id: '',
    category_id: '',
    type: 'expense',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  const toast = useCRUDToast()
  const supabase = createClient()

  // Carregar dados iniciais
  useEffect(() => {
    if (isOpen) {
      loadInitialData()
      
      if (editingTransaction) {
        setFormData({
          account_id: editingTransaction.account_id,
          category_id: editingTransaction.category_id,
          type: editingTransaction.type,
          amount: Math.abs(editingTransaction.amount),
          description: editingTransaction.description || '',
          date: editingTransaction.date,
          appointment_id: editingTransaction.appointment_id
        })
      } else {
        resetForm()
      }
    }
  }, [isOpen, editingTransaction])

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      account_id: '',
      category_id: '',
      type: 'expense',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0]
    })
  }

  // Carregar contas e categorias
  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      
      // Carregar contas ativas
      const { data: accountsData, error: accountsError } = await supabase
        .from('financial_accounts')
        .select(`
          id,
          name,
          type,
          is_active,
          current_balance:get_account_balance(id)
        `)
        .eq('is_active', true)
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
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do formulário')
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar categorias por tipo
  const filteredCategories = categories.filter(cat => cat.type === formData.type)

  // Validar saldo para despesas
  const validateBalance = (accountId: string, amount: number) => {
    if (formData.type === 'income') return true
    
    const account = accounts.find(acc => acc.id === accountId)
    if (!account) return false
    
    const currentBalance = account.current_balance || 0
    return currentBalance >= amount
  }

  // Salvar transação
  const saveTransaction = async () => {
    try {
      // Validações
      if (!formData.account_id) {
        toast.error('Selecione uma conta')
        return
      }
      
      if (!formData.category_id) {
        toast.error('Selecione uma categoria')
        return
      }
      
      if (formData.amount <= 0) {
        toast.error('Valor deve ser maior que zero')
        return
      }
      
      if (!formData.description.trim()) {
        toast.error('Descrição é obrigatória')
        return
      }

      // Validar saldo para despesas
      if (formData.type === 'expense' && !editingTransaction) {
        if (!validateBalance(formData.account_id, formData.amount)) {
          toast.error('Saldo insuficiente na conta selecionada')
          return
        }
      }

      setIsSaving(true)

      // Preparar dados da transação
      const transactionData = {
        account_id: formData.account_id,
        category_id: formData.category_id,
        type: formData.type,
        amount: formData.type === 'expense' ? -formData.amount : formData.amount,
        description: formData.description,
        date: formData.date,
        appointment_id: formData.appointment_id || null
      }

      if (editingTransaction) {
        // Atualizar transação existente
        const { error } = await supabase
          .from('financial_transactions')
          .update(transactionData)
          .eq('id', editingTransaction.id)

        if (error) throw error
        toast.success('Transação atualizada com sucesso!')
      } else {
        // Criar nova transação
        const { error } = await supabase
          .from('financial_transactions')
          .insert([transactionData])

        if (error) throw error
        toast.success('Transação criada com sucesso!')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Erro ao salvar transação:', error)
      toast.error('Erro ao salvar transação')
    } finally {
      setIsSaving(false)
    }
  }

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const modalTitle = (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        formData.type === 'income' 
          ? 'bg-green-100 text-green-600' 
          : 'bg-red-100 text-red-600'
      }`}>
        {formData.type === 'income' ? (
          <TrendingUp className="w-5 h-5" />
        ) : (
          <TrendingDown className="w-5 h-5" />
        )}
      </div>
      <div>
        <span className="text-lg font-semibold">
          {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
        </span>
        <p className="text-sm text-gray-600">
          {formData.type === 'income' ? 'Receita' : 'Despesa'}
        </p>
      </div>
    </div>
  )

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={modalTitle}
      size="lg"
    >

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Carregando...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tipo de Transação */}
            <div>
              <Label>Tipo de Transação</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant={formData.type === 'income' ? 'default' : 'outline'}
                  onClick={() => {
                    setFormData({ ...formData, type: 'income', category_id: '' })
                  }}
                  className={`flex-1 ${
                    formData.type === 'income' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'border-green-200 text-green-600 hover:bg-green-50'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Receita
                </Button>
                <Button
                  type="button"
                  variant={formData.type === 'expense' ? 'default' : 'outline'}
                  onClick={() => {
                    setFormData({ ...formData, type: 'expense', category_id: '' })
                  }}
                  className={`flex-1 ${
                    formData.type === 'expense' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'border-red-200 text-red-600 hover:bg-red-50'
                  }`}
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Despesa
                </Button>
              </div>
            </div>

            {/* Conta */}
            <div>
              <Label htmlFor="account_id">
                <CreditCard className="w-4 h-4 inline mr-1" />
                Conta
              </Label>
              <Select
                value={formData.account_id}
                onValueChange={(value) => setFormData({ ...formData, account_id: value })}
              >
                <option value="">Selecione uma conta</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {formatCurrency(account.current_balance || 0)}
                  </option>
                ))}
              </Select>
              {formData.account_id && formData.type === 'expense' && (
                <p className="text-xs text-gray-500 mt-1">
                  Saldo disponível: {formatCurrency(
                    accounts.find(acc => acc.id === formData.account_id)?.current_balance || 0
                  )}
                </p>
              )}
            </div>

            {/* Categoria */}
            <div>
              <Label htmlFor="category_id">
                <Tag className="w-4 h-4 inline mr-1" />
                Categoria
              </Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <option value="">Selecione uma categoria</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </Select>
              {filteredCategories.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Nenhuma categoria de {formData.type === 'income' ? 'receita' : 'despesa'} encontrada
                </p>
              )}
            </div>

            {/* Valor */}
            <div>
              <Label htmlFor="amount">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Valor
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  amount: parseFloat(e.target.value) || 0 
                })}
                placeholder="0,00"
                className="mt-1"
              />
              {formData.amount > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(formData.amount)}
                </p>
              )}
            </div>

            {/* Data */}
            <div>
              <Label htmlFor="date">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="description">
                <FileText className="w-4 h-4 inline mr-1" />
                Descrição
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva a transação..."
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Validação de saldo */}
            {formData.type === 'expense' && formData.account_id && formData.amount > 0 && (
              !validateBalance(formData.account_id, formData.amount) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    ⚠️ Saldo insuficiente na conta selecionada
                  </p>
                </div>
              )
            )}
          </div>
        )}

      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
        <Button 
          variant="outline" 
          onClick={onClose} 
          className="flex-1"
          disabled={isSaving}
        >
          Cancelar
        </Button>
        <Button 
          onClick={saveTransaction} 
          disabled={isSaving || isLoading}
          className={`flex-1 ${
            formData.type === 'income' 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Salvando...' : (editingTransaction ? 'Atualizar' : 'Criar')}
        </Button>
      </div>
    </Modal>
  )
}