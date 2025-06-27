import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

const createPackageSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  services: z.array(z.object({
    service_id: z.string().uuid(),
    quantity: z.number().min(1),
    unit_price: z.number().min(0),
    total_price: z.number().min(0)
  })).min(1, 'Pelo menos um serviço é obrigatório'),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().min(0),
  total_price: z.number().min(0),
  final_price: z.number().min(0),
  is_active: z.boolean().default(true),
  valid_until: z.string().optional()
})

// GET - Listar pacotes
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar empresa do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') // 'active', 'inactive', 'all'
    const offset = (page - 1) * limit

    // Query base
    let query = supabase
      .from('service_packages')
      .select(`
        *,
        package_services (
          service_id,
          quantity,
          unit_price,
          total_price,
          services (
            id,
            name,
            price,
            duration,
            category
          )
        )
      `, { count: 'exact' })
      .eq('company_id', userData.company_id)

    // Filtros
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    if (status && status !== 'all') {
      query = query.eq('is_active', status === 'active')
    }

    // Ordenação e paginação
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: packages, error, count } = await query

    if (error) {
      console.error('Erro ao buscar pacotes:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    // Transformar dados para incluir serviços
    const transformedPackages = packages?.map(pkg => ({
      ...pkg,
      services: pkg.package_services?.map((ps: any) => ({
        service_id: ps.service_id,
        service: ps.services,
        quantity: ps.quantity,
        unit_price: ps.unit_price,
        total_price: ps.total_price
      })) || []
    })) || []

    // Estatísticas
    const { data: stats } = await supabase
      .from('service_packages')
      .select('is_active, final_price')
      .eq('company_id', userData.company_id)

    const statistics = {
      total: stats?.length || 0,
      active: stats?.filter(s => s.is_active).length || 0,
      inactive: stats?.filter(s => !s.is_active).length || 0,
      total_value: stats?.reduce((sum, s) => sum + (s.final_price || 0), 0) || 0
    }

    return NextResponse.json({
      packages: transformedPackages,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      statistics
    })

  } catch (error) {
    console.error('Erro na API de pacotes:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar pacote
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar empresa do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!userData?.company_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = createPackageSchema.parse(body)

    // Verificar se os serviços pertencem à empresa
    const serviceIds = validatedData.services.map(s => s.service_id)
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id')
      .eq('company_id', userData.company_id)
      .in('id', serviceIds)

    if (servicesError || services?.length !== serviceIds.length) {
      return NextResponse.json({ error: 'Serviços inválidos' }, { status: 400 })
    }

    // Criar pacote
    const { data: packageData, error: packageError } = await supabase
      .from('service_packages')
      .insert({
        company_id: userData.company_id,
        name: validatedData.name,
        description: validatedData.description,
        discount_type: validatedData.discount_type,
        discount_value: validatedData.discount_value,
        total_price: validatedData.total_price,
        final_price: validatedData.final_price,
        is_active: validatedData.is_active,
        valid_until: validatedData.valid_until
      })
      .select()
      .single()

    if (packageError) {
      console.error('Erro ao criar pacote:', packageError)
      return NextResponse.json({ error: 'Erro ao criar pacote' }, { status: 500 })
    }

    // Criar relações com serviços
    const packageServices = validatedData.services.map(service => ({
      package_id: packageData.id,
      service_id: service.service_id,
      quantity: service.quantity,
      unit_price: service.unit_price,
      total_price: service.total_price
    }))

    const { error: servicesRelationError } = await supabase
      .from('package_services')
      .insert(packageServices)

    if (servicesRelationError) {
      console.error('Erro ao criar relações de serviços:', servicesRelationError)
      // Reverter criação do pacote
      await supabase.from('service_packages').delete().eq('id', packageData.id)
      return NextResponse.json({ error: 'Erro ao criar pacote' }, { status: 500 })
    }

    return NextResponse.json({ package: packageData }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Erro na API de pacotes:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}