import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const createServiceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.number().min(0, 'Preço deve ser maior que zero'),
  duration: z.number().min(1, 'Duração deve ser maior que zero'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  is_active: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar company_id do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.company_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma empresa' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const isActive = searchParams.get('is_active')
    
    const offset = (page - 1) * limit

    // Construir query
    let query = supabase
      .from('services')
      .select('*', { count: 'exact' })
      .eq('company_id', userData.company_id)
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    
    if (category) {
      query = query.eq('category', category)
    }
    
    if (isActive !== null && isActive !== '') {
      query = query.eq('is_active', isActive === 'true')
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1)

    const { data: services, error, count } = await query

    if (error) {
      console.error('Erro ao buscar serviços:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    // Buscar estatísticas
    const { data: stats } = await supabase
      .from('services')
      .select('is_active')
      .eq('company_id', userData.company_id)

    const totalActive = stats?.filter(s => s.is_active).length || 0
    const totalInactive = stats?.filter(s => !s.is_active).length || 0

    return NextResponse.json({
      services,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: {
        total: count || 0,
        active: totalActive,
        inactive: totalInactive
      }
    })
  } catch (error) {
    console.error('Erro na API de serviços:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar company_id do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.company_id) {
      return NextResponse.json({ error: 'Usuário não associado a uma empresa' }, { status: 400 })
    }

    const body = await request.json()
    
    // Validar dados
    const validatedData = createServiceSchema.parse(body)

    // Criar serviço
    const { data: service, error } = await supabase
      .from('services')
      .insert({
        ...validatedData,
        company_id: userData.company_id,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar serviço:', error)
      return NextResponse.json({ error: 'Erro ao criar serviço' }, { status: 500 })
    }

    return NextResponse.json({ service }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Erro na API de serviços:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}