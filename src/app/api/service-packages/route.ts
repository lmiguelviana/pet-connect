import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
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
    const supabase = createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar empresa do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.company_id) {
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
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
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

    // Estatísticas detalhadas
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
      stats: statistics,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Erro na API de pacotes:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Criar pacote
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar empresa do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.company_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = createPackageSchema.parse(body)
    const { service_ids, ...packageData } = validatedData

    // Verificar se os serviços existem e pertencem à empresa
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, price')
      .eq('company_id', userData.company_id)
      .in('id', service_ids)

    if (servicesError || !services || services.length !== service_ids.length) {
      return NextResponse.json({ error: 'Um ou mais serviços não foram encontrados' }, { status: 400 })
    }

    // Calcular preço total dos serviços
    const totalServicesPrice = services.reduce((sum, service) => sum + service.price, 0)
    
    // Se não foi fornecido um preço, calcular com desconto
    let finalPrice = packageData.price
    if (!finalPrice && packageData.discount_percentage) {
      finalPrice = totalServicesPrice * (1 - packageData.discount_percentage / 100)
    } else if (!finalPrice) {
      finalPrice = totalServicesPrice
    }

    // Criar pacote
    const { data: servicePackage, error: packageError } = await supabase
      .from('service_packages')
      .insert({
        ...packageData,
        price: finalPrice,
        company_id: userData.company_id,
        created_by: user.id
      })
      .select()
      .single()

    if (packageError) {
      console.error('Erro ao criar pacote:', packageError)
      return NextResponse.json({ error: 'Erro ao criar pacote' }, { status: 500 })
    }

    // Criar relações com serviços
    const packageServices = service_ids.map(serviceId => ({
      package_id: servicePackage.id,
      service_id: serviceId
    }))

    const { error: servicesRelationError } = await supabase
      .from('package_services')
      .insert(packageServices)

    if (servicesRelationError) {
      console.error('Erro ao criar relações de serviços:', servicesRelationError)
      // Reverter criação do pacote
      await supabase.from('service_packages').delete().eq('id', servicePackage.id)
      return NextResponse.json({ error: 'Erro ao criar pacote' }, { status: 500 })
    }

    // Criar itens do pacote
    const packageItems = service_ids.map(serviceId => ({
      service_package_id: servicePackage.id,
      service_id: serviceId
    }))

    const { error: itemsError } = await supabase
      .from('service_package_items')
      .insert(packageItems)

    if (itemsError) {
      console.error('Erro ao criar itens do pacote:', itemsError)
      // Reverter criação do pacote
      await supabase
        .from('service_packages')
        .delete()
        .eq('id', servicePackage.id)
      
      return NextResponse.json({ error: 'Erro ao criar itens do pacote' }, { status: 500 })
    }

    // Buscar pacote completo com serviços
    const { data: completePackage } = await supabase
      .from('service_packages')
      .select(`
        *,
        service_package_items (
          service_id,
          services (
            id,
            name,
            price
          )
        )
      `)
      .eq('id', servicePackage.id)
      .single()

    return NextResponse.json({ package: completePackage }, { status: 201 })
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