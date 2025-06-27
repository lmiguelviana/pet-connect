import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema de validação para atualização de transação
const UpdateTransactionSchema = z.object({
  account_id: z.string().uuid('ID da conta inválido').optional(),
  category_id: z.string().uuid('ID da categoria inválido').optional(),
  amount: z.number().positive('Valor deve ser positivo').optional(),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Tipo deve ser income ou expense' })
  }).optional(),
  description: z.string().max(200, 'Descrição muito longa').optional(),
  date: z.string().datetime('Data inválida').optional(),
  appointment_id: z.string().uuid('ID do agendamento inválido').optional().nullable()
})

// GET - Buscar transação específica
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

    // Buscar transação com joins
    const { data: transaction, error } = await supabase
      .from('financial_transactions')
      .select(`
        *,
        financial_accounts!inner(id, name, type),
        financial_categories!inner(id, name, type, color, icon),
        appointments(id, service_type, date_time)
      `)
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .single()

    if (error || !transaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Erro na API de transação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar transação
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

    // Verificar se transação existe
    const { data: existingTransaction } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .single()

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    // Validar dados
    const body = await request.json()
    const validationResult = UpdateTransactionSchema.safeParse(body)
    
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

    // Validações específicas se campos estão sendo alterados
    if (updateData.account_id) {
      const { data: account } = await supabase
        .from('financial_accounts')
        .select('id')
        .eq('id', updateData.account_id)
        .eq('company_id', profile.company_id)
        .single()

      if (!account) {
        return NextResponse.json(
          { error: 'Conta não encontrada' },
          { status: 404 }
        )
      }
    }

    if (updateData.category_id || updateData.type) {
      const categoryId = updateData.category_id || existingTransaction.category_id
      const transactionType = updateData.type || existingTransaction.type

      const { data: category } = await supabase
        .from('financial_categories')
        .select('id, type')
        .eq('id', categoryId)
        .eq('company_id', profile.company_id)
        .single()

      if (!category) {
        return NextResponse.json(
          { error: 'Categoria não encontrada' },
          { status: 404 }
        )
      }

      if (category.type !== transactionType) {
        return NextResponse.json(
          { error: 'Tipo da transação deve corresponder ao tipo da categoria' },
          { status: 400 }
        )
      }
    }

    if (updateData.appointment_id) {
      const { data: appointment } = await supabase
        .from('appointments')
        .select('id')
        .eq('id', updateData.appointment_id)
        .eq('company_id', profile.company_id)
        .single()

      if (!appointment) {
        return NextResponse.json(
          { error: 'Agendamento não encontrado' },
          { status: 404 }
        )
      }
    }

    // Atualizar transação
    const { data: transaction, error } = await supabase
      .from('financial_transactions')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .select(`
        *,
        financial_accounts!inner(id, name, type),
        financial_categories!inner(id, name, type, color, icon),
        appointments(id, service_type, date_time)
      `)
      .single()

    if (error) {
      console.error('Erro ao atualizar transação:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar transação' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Transação atualizada com sucesso',
      transaction
    })
  } catch (error) {
    console.error('Erro na API de transação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir transação
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

    // Verificar se transação existe
    const { data: existingTransaction } = await supabase
      .from('financial_transactions')
      .select('id, appointment_id')
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .single()

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transação não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se é uma transação automática (vinculada a agendamento)
    if (existingTransaction.appointment_id) {
      return NextResponse.json(
        { error: 'Não é possível excluir transação gerada automaticamente por agendamento' },
        { status: 409 }
      )
    }

    // Excluir transação
    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', params.id)
      .eq('company_id', profile.company_id)

    if (error) {
      console.error('Erro ao excluir transação:', error)
      return NextResponse.json(
        { error: 'Erro ao excluir transação' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Transação excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro na API de transação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}