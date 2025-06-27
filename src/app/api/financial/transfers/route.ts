import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema de validação para transferência
const TransferSchema = z.object({
  from_account_id: z.string().uuid('ID da conta de origem inválido'),
  to_account_id: z.string().uuid('ID da conta de destino inválido'),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().max(200, 'Descrição muito longa').optional(),
  date: z.string().datetime('Data inválida')
}).refine(data => data.from_account_id !== data.to_account_id, {
  message: 'Conta de origem deve ser diferente da conta de destino',
  path: ['to_account_id']
})

// GET - Listar transferências
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
    const accountId = searchParams.get('account_id') // Filtrar por conta (origem ou destino)
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const search = searchParams.get('search')
    
    const offset = (page - 1) * limit

    // Query base com joins para as contas
    let query = supabase
      .from('financial_transfers')
      .select(`
        *,
        from_account:financial_accounts!from_account_id(id, name, type),
        to_account:financial_accounts!to_account_id(id, name, type)
      `)
      .eq('company_id', profile.company_id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (accountId) {
      query = query.or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
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
    const { data: transfers, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Erro ao buscar transferências:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Calcular total transferido no período
    const { data: totals } = await supabase
      .from('financial_transfers')
      .select('amount')
      .eq('company_id', profile.company_id)
      .gte('date', dateFrom || '1900-01-01')
      .lte('date', dateTo || '2100-12-31')

    const totalTransferred = totals?.reduce((sum, t) => sum + t.amount, 0) || 0

    return NextResponse.json({
      transfers,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      statistics: {
        total_transferred: totalTransferred
      }
    })
  } catch (error) {
    console.error('Erro na API de transferências:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar transferência
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
    const validationResult = TransferSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { from_account_id, to_account_id, amount, description, date } = validationResult.data

    // Verificar se ambas as contas existem e pertencem à empresa
    const { data: accounts } = await supabase
      .from('financial_accounts')
      .select('id, name')
      .eq('company_id', profile.company_id)
      .in('id', [from_account_id, to_account_id])

    if (!accounts || accounts.length !== 2) {
      return NextResponse.json(
        { error: 'Uma ou ambas as contas não foram encontradas' },
        { status: 404 }
      )
    }

    // Verificar se conta de origem tem saldo suficiente
    const { data: fromAccountBalance } = await supabase
      .rpc('get_account_balance', { account_id: from_account_id })

    if (fromAccountBalance < amount) {
      return NextResponse.json(
        { error: 'Saldo insuficiente na conta de origem' },
        { status: 400 }
      )
    }

    // Iniciar transação no banco
    const { data: transfer, error: transferError } = await supabase
      .from('financial_transfers')
      .insert({
        from_account_id,
        to_account_id,
        amount,
        description,
        date,
        company_id: profile.company_id
      })
      .select(`
        *,
        from_account:financial_accounts!from_account_id(id, name, type),
        to_account:financial_accounts!to_account_id(id, name, type)
      `)
      .single()

    if (transferError) {
      console.error('Erro ao criar transferência:', transferError)
      return NextResponse.json(
        { error: 'Erro ao criar transferência' },
        { status: 500 }
      )
    }

    // Criar transações correspondentes
    // Transação de saída (despesa) na conta de origem
    const { error: outgoingError } = await supabase
      .from('financial_transactions')
      .insert({
        account_id: from_account_id,
        category_id: null, // Transferências não têm categoria
        amount,
        type: 'expense',
        description: `Transferência para ${accounts.find(a => a.id === to_account_id)?.name}${description ? ` - ${description}` : ''}`,
        date,
        transfer_id: transfer.id,
        company_id: profile.company_id
      })

    if (outgoingError) {
      console.error('Erro ao criar transação de saída:', outgoingError)
      // Reverter transferência
      await supabase.from('financial_transfers').delete().eq('id', transfer.id)
      return NextResponse.json(
        { error: 'Erro ao processar transferência' },
        { status: 500 }
      )
    }

    // Transação de entrada (receita) na conta de destino
    const { error: incomingError } = await supabase
      .from('financial_transactions')
      .insert({
        account_id: to_account_id,
        category_id: null, // Transferências não têm categoria
        amount,
        type: 'income',
        description: `Transferência de ${accounts.find(a => a.id === from_account_id)?.name}${description ? ` - ${description}` : ''}`,
        date,
        transfer_id: transfer.id,
        company_id: profile.company_id
      })

    if (incomingError) {
      console.error('Erro ao criar transação de entrada:', incomingError)
      // Reverter transferência e transação de saída
      await supabase.from('financial_transactions').delete().eq('transfer_id', transfer.id)
      await supabase.from('financial_transfers').delete().eq('id', transfer.id)
      return NextResponse.json(
        { error: 'Erro ao processar transferência' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Transferência criada com sucesso',
        transfer 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro na API de transferências:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}