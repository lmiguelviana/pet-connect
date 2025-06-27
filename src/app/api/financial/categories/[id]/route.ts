import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema de validação para atualização de categoria
const UpdateCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome muito longo').optional(),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Tipo deve ser income ou expense' })
  }).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal (#RRGGBB)').optional(),
  icon: z.string().max(10, 'Ícone muito longo').optional()
})

// GET - Buscar categoria específica
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

    // Buscar categoria
    const { data: category, error } = await supabase
      .from('financial_categories')
      .select('*')
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .single()

    if (error || !category) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Erro na API de categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar categoria
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

    // Verificar se categoria existe
    const { data: existingCategory } = await supabase
      .from('financial_categories')
      .select('*')
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .single()

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Validar dados
    const body = await request.json()
    const validationResult = UpdateCategorySchema.safeParse(body)
    
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

    // Se está alterando nome ou tipo, verificar duplicatas
    if (updateData.name || updateData.type) {
      const newName = updateData.name || existingCategory.name
      const newType = updateData.type || existingCategory.type
      
      const { data: duplicateCategory } = await supabase
        .from('financial_categories')
        .select('id')
        .eq('company_id', profile.company_id)
        .eq('name', newName)
        .eq('type', newType)
        .neq('id', params.id)
        .single()

      if (duplicateCategory) {
        return NextResponse.json(
          { error: 'Já existe uma categoria com este nome e tipo' },
          { status: 409 }
        )
      }
    }

    // Atualizar categoria
    const { data: category, error } = await supabase
      .from('financial_categories')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar categoria:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar categoria' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Categoria atualizada com sucesso',
      category
    })
  } catch (error) {
    console.error('Erro na API de categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir categoria
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

    // Verificar se categoria existe
    const { data: existingCategory } = await supabase
      .from('financial_categories')
      .select('id')
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .single()

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se categoria está sendo usada em transações
    const { data: transactions, error: transactionError } = await supabase
      .from('financial_transactions')
      .select('id')
      .eq('category_id', params.id)
      .limit(1)

    if (transactionError) {
      console.error('Erro ao verificar transações:', transactionError)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (transactions && transactions.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir categoria que possui transações associadas' },
        { status: 409 }
      )
    }

    // Excluir categoria
    const { error } = await supabase
      .from('financial_categories')
      .delete()
      .eq('id', params.id)
      .eq('company_id', profile.company_id)

    if (error) {
      console.error('Erro ao excluir categoria:', error)
      return NextResponse.json(
        { error: 'Erro ao excluir categoria' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Categoria excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro na API de categoria:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}