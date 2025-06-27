'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { useCRUDToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  CreditCard,
  Banknote,
  PiggyBank,
  Wallet,
  Building2,
  Eye,
  EyeOff
} from 'lucide-react'

interface Account {
  id: string
  name: string
  type: 'checking' | 'savings' | 'cash' | 'credit'
  initial_balance: number
  current_balance?: number
  is_active: boolean
  company_id: string
  created_at: string
  updated_at: string
}

interface AccountFormData {
  name: string
  type: 'checking' | 'savings' | 'cash' | 'credit'
  initial_balance: number
  is_active: boolean
}

const ACCOUNT_TYPES = [
  { 
    value: 'checking', 
    label: 'Conta Corrente', 
    icon: Building2, 
    color: 'bg-blue-100 text-blue-800',
    description: 'Conta bancária para movimentação diária'
  },
  { 
    value: 'savings', 
    label: 'Poupança', 
    icon: PiggyBank, 
    color: 'bg-green-100 text-green-800',
    description: 'Conta de poupança para reservas'
  },
  { 
    value: 'cash', 
    label: 'Dinheiro', 
    icon: Banknote, 
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Dinheiro em espécie'
  },
  { 
    value: 'credit', 
    label: 'Cartão de Crédito', 
    icon: CreditCard, 
    color: 'bg-purple-100 text-purple-800',
    description: 'Cartão de crédito'
  }
] as const

export function AccountManager() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [showBalances, setShowBalances] = useState(true)
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    type: 'checking',
    initial_balance: 0,
    is_active: true
  })
  
  const toast = useCRUDToast()
  const supabase = createClient()

  // Carregar contas
  const loadAccounts = async () => {
    try {
      setIsLoading(true)
      
      // Buscar contas com saldo atual
      const { data, error } = await supabase
        .from('financial_accounts')
        .select(`
          *,
          current_balance:get_account_balance(id)
        `)
        .order('name')

      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
      toast.error('Erro ao carregar contas')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  // Abrir formulário para nova conta
  const openForm = () => {
    setFormData({
      name: '',
      type: 'checking',
      initial_balance: 0,
      is_active: true
    })
    setEditingAccount(null)
    setIsFormOpen(true)
  }

  // Abrir formulário para editar conta
  const editAccount = (account: Account) => {
    setFormData({
      name: account.name,
      type: account.type,
      initial_balance: account.initial_balance,
      is_active: account.is_active
    })
    setEditingAccount(account)
    setIsFormOpen(true)
  }

  // Fechar formulário
  const closeForm = () => {
    setIsFormOpen(false)
    setEditingAccount(null)
    setFormData({
      name: '',
      type: 'checking',
      initial_balance: 0,
      is_active: true
    })
  }

  // Salvar conta
  const saveAccount = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Nome da conta é obrigatório')
        return
      }

      if (editingAccount) {
        // Atualizar conta existente
        const { error } = await supabase
          .from('financial_accounts')
          .update({
            name: formData.name,
            type: formData.type,
            is_active: formData.is_active
            // Não permitir alterar initial_balance de conta existente
          })
          .eq('id', editingAccount.id)

        if (error) throw error
        toast.success('Conta atualizada com sucesso!')
      } else {
        // Criar nova conta
        const { error } = await supabase
          .from('financial_accounts')
          .insert([formData])

        if (error) throw error
        toast.success('Conta criada com sucesso!')
      }

      closeForm()
      loadAccounts()
    } catch (error: any) {
      console.error('Erro ao salvar conta:', error)
      if (error.message?.includes('duplicate')) {
        toast.error('Já existe uma conta com este nome')
      } else {
        toast.error('Erro ao salvar conta')
      }
    }
  }

  // Excluir conta
  const deleteAccount = async (account: Account) => {
    if (!confirm(`Tem certeza que deseja excluir a conta "${account.name}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('financial_accounts')
        .delete()
        .eq('id', account.id)

      if (error) throw error
      toast.success('Conta excluída com sucesso!')
      loadAccounts()
    } catch (error: any) {
      console.error('Erro ao excluir conta:', error)
      if (error.message?.includes('foreign key')) {
        toast.error('Não é possível excluir conta que possui transações associadas')
      } else {
        toast.error('Erro ao excluir conta')
      }
    }
  }

  // Alternar ativação da conta
  const toggleAccountStatus = async (account: Account) => {
    try {
      const { error } = await supabase
        .from('financial_accounts')
        .update({ is_active: !account.is_active })
        .eq('id', account.id)

      if (error) throw error
      toast.success(`Conta ${!account.is_active ? 'ativada' : 'desativada'} com sucesso!`)
      loadAccounts()
    } catch (error) {
      console.error('Erro ao alterar status da conta:', error)
      toast.error('Erro ao alterar status da conta')
    }
  }

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Calcular saldo total
  const totalBalance = accounts
    .filter(account => account.is_active)
    .reduce((sum, account) => sum + (account.current_balance || account.initial_balance), 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Carregando contas...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Contas</h2>
          <p className="text-gray-600">Gerencie suas contas bancárias e carteiras</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBalances(!showBalances)}
            size="sm"
          >
            {showBalances ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showBalances ? 'Ocultar' : 'Mostrar'} Saldos
          </Button>
          <Button onClick={openForm} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Saldo Total</h3>
            <p className="text-sm text-gray-600">Soma de todas as contas ativas</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {showBalances ? formatCurrency(totalBalance) : '••••••'}
            </div>
            <div className="text-sm text-gray-600">
              {accounts.filter(a => a.is_active).length} contas ativas
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de contas */}
      {accounts.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            Nenhuma conta encontrada. Crie sua primeira conta!
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const typeConfig = ACCOUNT_TYPES.find(t => t.value === account.type)
            const TypeIcon = typeConfig?.icon || Wallet
            const currentBalance = account.current_balance ?? account.initial_balance
            
            return (
              <Card key={account.id} className={`p-4 hover:shadow-md transition-shadow ${
                !account.is_active ? 'opacity-60 bg-gray-50' : ''
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <TypeIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{account.name}</h3>
                      <Badge className={typeConfig?.color || 'bg-gray-100 text-gray-800'}>
                        {typeConfig?.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editAccount(account)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAccount(account)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Saldo Atual:</span>
                    <span className={`font-semibold ${
                      currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {showBalances ? formatCurrency(currentBalance) : '••••••'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Saldo Inicial:</span>
                    <span className="text-sm text-gray-900">
                      {showBalances ? formatCurrency(account.initial_balance) : '••••••'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAccountStatus(account)}
                      className={`h-6 px-2 text-xs ${
                        account.is_active 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {account.is_active ? 'Ativa' : 'Inativa'}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal do formulário */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingAccount ? 'Editar Conta' : 'Nova Conta'}
              </h3>
              <Button variant="ghost" size="sm" onClick={closeForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <Label htmlFor="name">Nome da Conta</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Banco do Brasil, Carteira, etc."
                  className="mt-1"
                />
              </div>

              {/* Tipo */}
              <div>
                <Label htmlFor="type">Tipo de Conta</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: AccountFormData['type']) => 
                    setFormData({ ...formData, type: value })
                  }
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {ACCOUNT_TYPES.find(t => t.value === formData.type)?.description}
                </p>
              </div>

              {/* Saldo Inicial */}
              {!editingAccount && (
                <div>
                  <Label htmlFor="initial_balance">Saldo Inicial</Label>
                  <Input
                    id="initial_balance"
                    type="number"
                    step="0.01"
                    value={formData.initial_balance}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      initial_balance: parseFloat(e.target.value) || 0 
                    })}
                    placeholder="0,00"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valor atual disponível na conta
                  </p>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active">Conta ativa</Label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={closeForm} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={saveAccount} className="flex-1 bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                {editingAccount ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}