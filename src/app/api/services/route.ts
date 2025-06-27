import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { z } from 'zod'

// Schema de validação para criação de serviço
const createServiceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().optional(),
  category: z.enum([
    'banho', 'tosa', 'banho-e-tosa', 'veterinario', 'consulta', 
    'vacina', 'cirurgia', 'estetica', 'spa', 'hotel', 'daycare', 
    'adestramento', 'outros'
  ]),
  price: z.number().min(0, 'Preço deve ser positivo'),
  duration: z.number().min(1, 'Duração deve ser pelo menos 1 minuto'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve ser um hex válido'),
  is_active: z.boolean().default(true),
  requires_appointment: z.boolean().default(true),
  max_pets_per_session: z.number().min(1, 'Deve permitir pelo menos 1 pet').max(10, 'Máximo 10 pets por sessão'),
  available_days: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])),
  available_hours: z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido')
  })
})

// GET - Listar serviços
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

    // Parâmetros de query
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || 'all'
    const status = searchParams.get('status') || 'all'
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Construir query
    let query = supabase
      .from('services')
      .select(`
        *,
        service_photos (
          id,
          photo_url,
          is_primary
        ),
        _count:appointments(count)
      `, { count: 'exact' })
      .eq('company_id', userData.company_id)

    // Filtros
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (category !== 'all') {
      query = query.eq('category', category)
    }

    if (status !== 'all') {
      const isActive = status === 'active'
      query = query.eq('is_active', isActive)
    }

    // Ordenação
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Paginação
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: services, error, count } = await query

    if (error) {
      console.error('Erro ao buscar serviços:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    // Buscar estatísticas detalhadas
    const { data: stats } = await supabase
      .from('services')
      .select('category, is_active, price, duration')
      .eq('company_id', userData.company_id)

    const statistics = {
      total: stats?.length || 0,
      active: stats?.filter(s => s.is_active).length || 0,
      inactive: stats?.filter(s => !s.is_active).length || 0,
      by_category: stats?.reduce((acc, service) => {
        acc[service.category] = (acc[service.category] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {},
      average_price: stats?.length ? stats.reduce((sum, s) => sum + s.price, 0) / stats.length : 0,
      average_duration: stats?.length ? stats.reduce((sum, s) => sum + s.duration, 0) / stats.length : 0
    }

    return NextResponse.json({
      services,
      stats: statistics,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Erro na API de serviços:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar novo serviço
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