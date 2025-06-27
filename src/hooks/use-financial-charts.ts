'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

type MonthlyData = {
  month: string
  income: number
  expenses: number
  profit: number
}

type CategoryData = {
  name: string
  value: number
  color: string
}

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

export function useFinancialCharts() {
  const { company } = useAuth()
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [advancedMetrics, setAdvancedMetrics] = useState<AdvancedMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadChartData()
    }
  }, [company?.id])

  const loadChartData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadMonthlyData(),
        loadCategoryData(),
        loadAdvancedMetrics()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados dos gráficos:', error)
      toast.error('Erro ao carregar dados dos gráficos')
    } finally {
      setLoading(false)
    }
  }

  const loadMonthlyData = async () => {
    // Buscar dados dos últimos 6 meses
    const months = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = date.toISOString().slice(0, 7) // YYYY-MM
      months.push(monthStr)
    }

    const monthlyResults: MonthlyData[] = []

    for (const month of months) {
      const { data: transactions } = await supabase
        .from('financial_transactions')
        .select('type, amount')
        .eq('company_id', company!.id)
        .gte('date', `${month}-01`)
        .lt('date', `${month}-32`)

      const income = (transactions || [])
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const expenses = (transactions || [])
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      monthlyResults.push({
        month,
        income,
        expenses,
        profit: income - expenses
      })
    }

    setMonthlyData(monthlyResults)
  }

  const loadCategoryData = async () => {
    // Buscar despesas por categoria dos últimos 3 meses
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const startDate = threeMonthsAgo.toISOString().slice(0, 10)

    const { data: transactions } = await supabase
      .from('financial_transactions')
      .select(`
        amount,
        category:financial_categories(name, color)
      `)
      .eq('company_id', company!.id)
      .eq('type', 'expense')
      .gte('date', startDate)

    // Agrupar por categoria
    const categoryMap = new Map<string, { value: number, color: string }>()
    
    transactions?.forEach(transaction => {
      if (transaction.category) {
        const categoryName = transaction.category.name
        const existing = categoryMap.get(categoryName) || { value: 0, color: transaction.category.color }
        existing.value += transaction.amount
        categoryMap.set(categoryName, existing)
      }
    })

    const categoryResults: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8) // Top 8 categorias

    setCategoryData(categoryResults)
  }

  const loadAdvancedMetrics = async () => {
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const currentDay = now.getDate()

    // Transações do mês atual
    const { data: currentMonthTransactions } = await supabase
      .from('financial_transactions')
      .select('type, amount, category:financial_categories(name)')
      .eq('company_id', company!.id)
      .gte('date', `${currentMonth}-01`)
      .lt('date', `${currentMonth}-32`)

    // Transações do mês passado
    const { data: lastMonthTransactions } = await supabase
      .from('financial_transactions')
      .select('type, amount')
      .eq('company_id', company!.id)
      .gte('date', `${lastMonth}-01`)
      .lt('date', `${lastMonth}-32`)

    const currentIncome = (currentMonthTransactions || [])
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const currentExpenses = (currentMonthTransactions || [])
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const lastIncome = (lastMonthTransactions || [])
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const lastExpenses = (lastMonthTransactions || [])
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // Calcular métricas
    const averageDailyIncome = currentIncome / currentDay
    const averageDailyExpenses = currentExpenses / currentDay
    const growthRate = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0
    const projectedMonthlyIncome = averageDailyIncome * daysInMonth
    const projectedMonthlyExpenses = averageDailyExpenses * daysInMonth
    
    // Tendência do fluxo de caixa
    const currentProfit = currentIncome - currentExpenses
    const lastProfit = lastIncome - lastExpenses
    let cashFlowTrend: 'positive' | 'negative' | 'stable' = 'stable'
    
    if (currentProfit > lastProfit * 1.05) cashFlowTrend = 'positive'
    else if (currentProfit < lastProfit * 0.95) cashFlowTrend = 'negative'

    // Top categoria de despesa
    const expensesByCategory = new Map<string, number>()
    currentMonthTransactions?.forEach(t => {
      if (t.type === 'expense' && t.category) {
        const current = expensesByCategory.get(t.category.name) || 0
        expensesByCategory.set(t.category.name, current + t.amount)
      }
    })
    
    const topExpenseCategory = Array.from(expensesByCategory.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'

    setAdvancedMetrics({
      averageDailyIncome,
      averageDailyExpenses,
      growthRate,
      projectedMonthlyIncome,
      projectedMonthlyExpenses,
      cashFlowTrend,
      topExpenseCategory,
      topIncomeSource: 'Serviços' // Placeholder - pode ser calculado dinamicamente
    })
  }

  return {
    monthlyData,
    categoryData,
    advancedMetrics,
    loading,
    refetch: loadChartData
  }
}

export function useFinancialReports() {
  const { company } = useAuth()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const generateReport = async (filters: {
    startDate: string
    endDate: string
    accountId?: string
    categoryId?: string
    type?: 'income' | 'expense'
  }) => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          account:financial_accounts(name, type),
          category:financial_categories(name, type, color)
        `)
        .eq('company_id', company!.id)
        .gte('date', filters.startDate)
        .lte('date', filters.endDate)
        .order('date', { ascending: false })

      if (filters.accountId) {
        query = query.eq('account_id', filters.accountId)
      }
      
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }
      
      if (filters.type) {
        query = query.eq('type', filters.type)
      }

      const { data, error } = await query
      
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      toast.error('Erro ao gerar relatório')
      return []
    } finally {
      setLoading(false)
    }
  }

  return {
    generateReport,
    loading
  }
}