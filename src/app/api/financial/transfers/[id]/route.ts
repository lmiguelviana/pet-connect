import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema de validação para atualização de transferência
const UpdateTransferSchema = z.object({
  from_account_id: z.string().uuid('ID da conta de origem inválido').optional(),
  to_account_id: z.string().uuid('ID da conta de destino inválido').optional(),
  amount: z.number().positive('Valor deve ser positivo').optional(),
  description: z.string().max(200, 'Descrição muito longa').optional(),
  date: z.string().datetime('Data inválida').optional()
}).refine(data => {
  if (data.from_account_id && data.to_account_id) {
    return data.from_account_id !== data.to_account_id
  }
  return true
}, {
  message: 'Conta de origem deve ser diferente da conta de destino',
  path: ['to_account_id']
})

// GET - Buscar transferência específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Buscar transferência com joins
    const { data: transfer, error } = await supabase
      .from('financial_transfers')
      .select(`
        *,
        from_account:financial_accounts!from_account_id(id, name, type),
        to_account:financial_accounts!to_account_id(id, name, type),
        financial_transactions(id, type, description)
      `)
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .single()

    if (error || !transfer) {
      return NextResponse.json(
        { error: 'Transferência não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ transfer })
  } catch (error) {
    console.error('Erro na API de transferência:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar transferência
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verificar se transferência existe
    const { data: existingTransfer } = await supabase
      .from('financial_transfers')
      .select('*')
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .single()

    if (!existingTransfer) {
      return NextResponse.json(
        { error: 'Transferência não encontrada' },
        { status: 404 }
      )
    }

    // Validar dados
    const body = await request.json()
    const validationResult = UpdateTransferSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Validações específicas se contas estão sendo alteradas
    if (updateData.from_account_id || updateData.to_account_id) {
      const fromAccountId = updateData.from_account_id || existingTransfer.from_account_id
      const toAccountId = updateData.to_account_id || existingTransfer.to_account_id

      // Verificar se ambas as contas existem e pertencem à empresa
      const { data: accounts } = await supabase
        .from('financial_accounts')
        .select('id, name')
        .eq('company_id', profile.company_id)
        .in('id', [fromAccountId, toAccountId])

      if (!accounts || accounts.length !== 2) {
        return NextResponse.json(
          { error: 'Uma ou ambas as contas não foram encontradas' },
          { status: 404 }
        )
      }
    }

    // Verificar saldo se valor está sendo alterado
    if (updateData.amount && updateData.amount !== existingTransfer.amount) {
      const fromAccountId = updateData.from_account_id || existingTransfer.from_account_id
      
      const { data: fromAccountBalance } = await supabase
        .rpc('get_account_balance', { account_id: fromAccountId })

      // Considerar o valor atual da transferência no cálculo do saldo
      const availableBalance = fromAccountBalance + existingTransfer.amount
      
      if (availableBalance < updateData.amount) {
        return NextResponse.json(
          { error: 'Saldo insuficiente na conta de origem para o novo valor' },
          { status: 400 }
        )
      }
    }

    // Atualizar transferência
    const { data: transfer, error } = await supabase
      .from('financial_transfers')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .select(`
        *,
        from_account:financial_accounts!from_account_id(id, name, type),
        to_account:financial_accounts!to_account_id(id, name, type)
      `)
      .single()

    if (error) {
      console.error('Erro ao atualizar transferência:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar transferência' },
        { status: 500 }
      )
    }

    // Atualizar transações relacionadas se necessário
    if (updateData.amount || updateData.description || updateData.date) {
      const { data: accounts } = await supabase
        .from('financial_accounts')
        .select('id, name')
        .eq('company_id', profile.company_id)
        .in('id', [transfer.from_account_id, transfer.to_account_id])

      const fromAccount = accounts?.find(a => a.id === transfer.from_account_id)
      const toAccount = accounts?.find(a => a.id === transfer.to_account_id)

      // Atualizar transação de saída
      await supabase
        .from('financial_transactions')
        .update({
          amount: transfer.amount,
          description: `Transferência para ${toAccount?.name}${transfer.description ? ` - ${transfer.description}` : ''}`,
          date: transfer.date,
          updated_at: new Date().toISOString()
        })
        .eq('transfer_id', params.id)
        .eq('account_id', transfer.from_account_id)
        .eq('type', 'expense')

      // Atualizar transação de entrada
      await supabase
        .from('financial_transactions')
        .update({
          amount: transfer.amount,
          description: `Transferência de ${fromAccount?.name}${transfer.description ? ` - ${transfer.description}` : ''}`,
          date: transfer.date,
          updated_at: new Date().toISOString()
        })
        .eq('transfer_id', params.id)
        .eq('account_id', transfer.to_account_id)
        .eq('type', 'income')
    }

    return NextResponse.json({
      message: 'Transferência atualizada com sucesso',
      transfer
    })
  } catch (error) {
    console.error('Erro na API de transferência:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir transferência
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verificar se transferência existe
    const { data: existingTransfer } = await supabase
      .from('financial_transfers')
      .select('id')
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .single()

    if (!existingTransfer) {
      return NextResponse.json(
        { error: 'Transferência não encontrada' },
        { status: 404 }
      )
    }

    // Excluir transações relacionadas primeiro (devido às foreign keys)
    const { error: transactionsError } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('transfer_id', params.id)

    if (transactionsError) {
      console.error('Erro ao excluir transações da transferência:', transactionsError)
      return NextResponse.json(
        { error: 'Erro ao excluir transferência' },
        { status: 500 }
      )
    }

    // Excluir transferência
    const { error } = await supabase
      .from('financial_transfers')
      .delete()
      .eq('id', params.id)
      .eq('company_id', profile.company_id)

    if (error) {
      console.error('Erro ao excluir transferência:', error)
      return NextResponse.json(
        { error: 'Erro ao excluir transferência' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Transferência excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro na API de transferência:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}