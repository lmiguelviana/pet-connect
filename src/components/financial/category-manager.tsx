'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { useCRUDToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  TrendingUp,
  TrendingDown,
  Palette
} from 'lucide-react'

interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
  company_id: string
  created_at: string
}

interface CategoryFormData {
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
}

const DEFAULT_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
]

const DEFAULT_ICONS = [
  '💰', '🏪', '🍔', '⛽', '🏠', '💡', '📱', '🚗', '🎯', '📚',
  '🎮', '👕', '💊', '🎬', '✈️', '🎁', '🛒', '💳', '📊', '🔧'
]

const CATEGORY_TYPES = [
  { value: 'income' as const, label: 'Receita', icon: TrendingUp, color: 'text-green-600' },
  { value: 'expense' as const, label: 'Despesa', icon: TrendingDown, color: 'text-red-600' }
]

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    type: 'expense',
    color: DEFAULT_COLORS[0],
    icon: DEFAULT_ICONS[0]
  })
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  
  const toast = useCRUDToast()
  const supabase = createClient()

  // Carregar categorias
  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      toast.error('Erro ao carregar categorias')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  // Filtrar categorias
  const filteredCategories = categories.filter(category => {
    if (filter === 'all') return true
    return category.type === filter
  })

  // Abrir formulário para nova categoria
  const openForm = () => {
    setFormData({
      name: '',
      type: 'expense',
      color: DEFAULT_COLORS[0],
      icon: DEFAULT_ICONS[0]
    })
    setEditingCategory(null)
    setIsFormOpen(true)
  }

  // Abrir formulário para editar categoria
  const editCategory = (category: Category) => {
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon
    })
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  // Fechar formulário
  const closeForm = () => {
    setIsFormOpen(false)
    setEditingCategory(null)
    setFormData({
      name: '',
      type: 'expense',
      color: DEFAULT_COLORS[0],
      icon: DEFAULT_ICONS[0]
    })
  }

  // Salvar categoria
  const saveCategory = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome da categoria é obrigatório')
      return
    }

    try {
      if (editingCategory) {
        // Atualizar categoria existente
        const { error } = await supabase
          .from('financial_categories')
          .update({
            name: formData.name.trim(),
            type: formData.type,
            color: formData.color,
            icon: formData.icon
          })
          .eq('id', editingCategory.id)

        if (error) throw error
        toast.success('Categoria atualizada com sucesso!')
      } else {
        // Criar nova categoria
        const { error } = await supabase
          .from('financial_categories')
          .insert({
            name: formData.name.trim(),
            type: formData.type,
            color: formData.color,
            icon: formData.icon,
            company_id: '1' // TODO: Pegar do contexto da empresa
          })

        if (error) throw error
        toast.success('Categoria criada com sucesso!')
      }

      closeForm()
      loadCategories()
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error)
      if (error.message?.includes('duplicate')) {
        toast.error('Já existe uma categoria com este nome')
      } else {
        toast.error('Erro ao salvar categoria')
      }
    }
  }

  // Excluir categoria
  const deleteCategory = async (category: Category) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${category.name}"?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('financial_categories')
        .delete()
        .eq('id', category.id)

      if (error) throw error
      toast.success('Categoria excluída com sucesso!')
      loadCategories()
    } catch (error: any) {
      console.error('Erro ao excluir categoria:', error)
      if (error.message?.includes('foreign key')) {
        toast.error('Não é possível excluir categoria que possui transações associadas')
      } else {
        toast.error('Erro ao excluir categoria')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Carregando categorias...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Categorias</h2>
          <p className="text-gray-600">Gerencie as categorias de receitas e despesas</p>
        </div>
        <Button onClick={openForm} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className="flex items-center gap-2"
        >
          <Palette className="w-4 h-4" />
          Todas ({categories.length})
        </Button>
        <Button
          variant={filter === 'income' ? 'default' : 'outline'}
          onClick={() => setFilter('income')}
          className="flex items-center gap-2"
        >
          <TrendingUp className="w-4 h-4 text-green-600" />
          Receitas ({categories.filter(c => c.type === 'income').length})
        </Button>
        <Button
          variant={filter === 'expense' ? 'default' : 'outline'}
          onClick={() => setFilter('expense')}
          className="flex items-center gap-2"
        >
          <TrendingDown className="w-4 h-4 text-red-600" />
          Despesas ({categories.filter(c => c.type === 'expense').length})
        </Button>
      </div>

      {/* Lista de categorias */}
      {filteredCategories.length === 0 ? (
        <div className="text-gray-500">
          {filter === 'all' 
            ? 'Nenhuma categoria encontrada. Crie sua primeira categoria!' 
            : `Nenhuma categoria de ${filter === 'income' ? 'receita' : 'despesa'} encontrada.`
          }
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => {
            const typeConfig = CATEGORY_TYPES.find(t => t.value === category.type)
            const TypeIcon = typeConfig?.icon
            
            return (
              <Card key={category.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        {TypeIcon && <TypeIcon className={`w-4 h-4 ${typeConfig?.color}`} />}
                        <span className={`text-sm font-medium ${typeConfig?.color}`}>
                          {typeConfig?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editCategory(category)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCategory(category)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal do formulário */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: formData.color }}
            >
              {formData.icon}
            </div>
            <span>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</span>
          </div>
        }
        size="md"
      >
        <div className="space-y-4">
          {/* Nome */}
          <div>
            <Label htmlFor="name">Nome da Categoria</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Alimentação, Vendas, etc."
              className="mt-1"
            />
          </div>

          {/* Tipo */}
          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'income' | 'expense') => 
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${type.color}`} />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Cor */}
          <div>
            <Label>Cor</Label>
            <div className="grid grid-cols-5 gap-3 mt-2">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                    formData.color === color 
                      ? 'border-gray-800 ring-2 ring-gray-300' 
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          {/* Ícone */}
          <div>
            <Label>Ícone</Label>
            <div className="grid grid-cols-8 gap-2 mt-2 max-h-32 overflow-y-auto">
              {DEFAULT_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={`w-10 h-10 rounded-lg border text-lg transition-all hover:scale-110 ${
                    formData.icon === icon 
                      ? 'bg-gray-200 border-gray-400 ring-2 ring-gray-300' 
                      : 'border-gray-200 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                  onClick={() => setFormData({ ...formData, icon })}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-4 bg-gradient-to-r from-gray-50 to-gray-100">
            <Label className="text-sm font-medium text-gray-700">Preview da Categoria:</Label>
            <div className="flex items-center gap-3 mt-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl shadow-md"
                style={{ backgroundColor: formData.color }}
              >
                {formData.icon}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {formData.name || 'Nome da categoria'}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {(() => {
                    const typeConfig = CATEGORY_TYPES.find(t => t.value === formData.type)
                    const TypeIcon = typeConfig?.icon
                    return (
                      <>
                        {TypeIcon && <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />}
                        <span className={`text-sm font-medium ${typeConfig?.color}`}>
                          {typeConfig?.label}
                        </span>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={closeForm} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={saveCategory} 
            className={`flex-1 ${
              formData.type === 'income' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            <Save className="w-4 h-4 mr-2" />
            {editingCategory ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}