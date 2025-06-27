import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema de validação para transação
const TransactionSchema = z.object({
  account_id: z.string().uuid('ID da conta inválido'),
  category_id: z.string().uuid('ID da categoria inválido'),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Tipo deve ser income ou expense' })
  }),
  description: z.string().max(200, 'Descrição muito longa').optional(),
  date: z.string().datetime('Data inválida'),
  appointment_id: z.string().uuid('ID do agendamento inválido').optional()
})

// GET - Listar transações com filtros
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar company_id do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session.user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: 'Usuário não associado a uma empresa' },
        { status: 400 }
      )
    }

    // Parâmetros de filtro e paginação
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const type = searchParams.get('type') // 'income' | 'expense'
    const categoryId = searchParams.get('category_id')
    const accountId = searchParams.get('account_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const search = searchParams.get('search')
    
    const offset = (page - 1) * limit

    // Query base com joins
    let query = supabase
      .from('financial_transactions')
      .select(`
        *,
        financial_accounts!inner(id, name, type),
        financial_categories!inner(id, name, type, color, icon)
      `)
      .eq('company_id', profile.company_id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (type && ['income', 'expense'].includes(type)) {
      query = query.eq('type', type)
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    if (dateFrom) {
      query = query.gte('date', dateFrom)
    }

    if (dateTo) {
      query = query.lte('date', dateTo)
    }

    if (search) {
      query = query.ilike('description', `%${search}%`)
    }

    // Executar query com paginação
    const { data: transactions, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Erro ao buscar transações:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Buscar totais para estatísticas
    const { data: totals } = await supabase
      .from('financial_transactions')
      .select('type, amount')
      .eq('company_id', profile.company_id)
      .gte('date', dateFrom || '1900-01-01')
      .lte('date', dateTo || '2100-12-31')

    const statistics = {
      total_income: totals?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0,
      total_expense: totals?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0,
      net_profit: 0
    }
    statistics.net_profit = statistics.total_income - statistics.total_expense

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      statistics
    })
  } catch (error) {
    console.error('Erro na API de transações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar transação
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Buscar company_id do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session.user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: 'Usuário não associado a uma empresa' },
        { status: 400 }
      )
    }

    // Validar dados
    const body = await request.json()
    const validationResult = TransactionSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { account_id, category_id, amount, type, description, date, appointment_id } = validationResult.data

    // Verificar se conta existe e pertence à empresa
    const { data: account } = await supabase
      .from('financial_accounts')
      .select('id')
      .eq('id', account_id)
      .eq('company_id', profile.company_id)
      .single()

    if (!account) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se categoria existe, pertence à empresa e é do tipo correto
    const { data: category } = await supabase
      .from('financial_categories')
      .select('id, type')
      .eq('id', category_id)
      .eq('company_id', profile.company_id)
      .single()

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    if (category.type !== type) {
      return NextResponse.json(
        { error: 'Tipo da transação deve corresponder ao tipo da categoria' },
        { status: 400 }
      )
    }

    // Verificar agendamento se fornecido
    if (appointment_id) {
      const { data: appointment } = await supabase
        .from('appointments')
        .select('id')
        .eq('id', appointment_id)
        .eq('company_id', profile.company_id)
        .single()

      if (!appointment) {
        return NextResponse.json(
          { error: 'Agendamento não encontrado' },
          { status: 404 }
        )
      }
    }

    // Criar transação
    const { data: transaction, error } = await supabase
      .from('financial_transactions')
      .insert({
        account_id,
        category_id,
        amount,
        type,
        description,
        date,
        appointment_id,
        company_id: profile.company_id
      })
      .select(`
        *,
        financial_accounts!inner(id, name, type),
        financial_categories!inner(id, name, type, color, icon)
      `)
      .single()

    if (error) {
      console.error('Erro ao criar transação:', error)
      return NextResponse.json(
        { error: 'Erro ao criar transação' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Transação criada com sucesso',
        transaction 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro na API de transações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}