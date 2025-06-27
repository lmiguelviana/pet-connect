import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema de validação para categoria
const CategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome muito longo'),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Tipo deve ser income ou expense' })
  }),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal (#RRGGBB)').optional(),
  icon: z.string().max(10, 'Ícone muito longo').optional()
})

// GET - Listar categorias
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

    // Parâmetros de filtro
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'income' | 'expense'
    
    let query = supabase
      .from('financial_categories')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('name')

    // Filtrar por tipo se especificado
    if (type && ['income', 'expense'].includes(type)) {
      query = query.eq('type', type)
    }

    const { data: categories, error } = await query

    if (error) {
      console.error('Erro ao buscar categorias:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Erro na API de categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar categoria
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
    const validationResult = CategorySchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { name, type, color, icon } = validationResult.data

    // Verificar se já existe categoria com mesmo nome e tipo
    const { data: existingCategory } = await supabase
      .from('financial_categories')
      .select('id')
      .eq('company_id', profile.company_id)
      .eq('name', name)
      .eq('type', type)
      .single()

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Já existe uma categoria com este nome e tipo' },
        { status: 409 }
      )
    }

    // Cores padrão por tipo
    const defaultColors = {
      income: '#10B981',
      expense: '#EF4444'
    }

    // Ícones padrão por tipo
    const defaultIcons = {
      income: '💰',
      expense: '🛒'
    }

    // Criar categoria
    const { data: category, error } = await supabase
      .from('financial_categories')
      .insert({
        name,
        type,
        color: color || defaultColors[type],
        icon: icon || defaultIcons[type],
        company_id: profile.company_id
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar categoria:', error)
      return NextResponse.json(
        { error: 'Erro ao criar categoria' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Categoria criada com sucesso',
        category 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro na API de categorias:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}