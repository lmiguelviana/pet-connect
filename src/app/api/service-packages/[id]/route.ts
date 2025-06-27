import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'

const updatePackageSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  description: z.string().optional(),
  services: z.array(z.object({
    service_id: z.string().uuid(),
    quantity: z.number().min(1),
    unit_price: z.number().min(0),
    total_price: z.number().min(0)
  })).min(1, 'Pelo menos um serviço é obrigatório').optional(),
  discount_type: z.enum(['percentage', 'fixed']).optional(),
  discount_value: z.number().min(0).optional(),
  total_price: z.number().min(0).optional(),
  final_price: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
  valid_until: z.string().optional()
})

// Função auxiliar para verificar autenticação e propriedade
async function getAuthenticatedPackage(packageId: string) {
  const supabase = createServerSupabaseClient()
  
  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Não autorizado', status: 401 }
  }

  // Buscar empresa do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) {
    return { error: 'Empresa não encontrada', status: 404 }
  }

  // Buscar pacote
  const { data: packageData, error: packageError } = await supabase
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
    `)
    .eq('id', packageId)
    .eq('company_id', profile.company_id)
    .single()

  if (packageError || !packageData) {
    return { error: 'Pacote não encontrado', status: 404 }
  }

  return { 
    packageData, 
    companyId: profile.company_id, 
    supabase 
  }
}

// GET - Buscar pacote específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getAuthenticatedPackage(params.id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const { packageData } = result

    // Transformar dados para incluir serviços
    const transformedPackage = {
      ...packageData,
      services: packageData.package_services?.map((ps: any) => ({
        service_id: ps.service_id,
        service: ps.services,
        quantity: ps.quantity,
        unit_price: ps.unit_price,
        total_price: ps.total_price
      })) || []
    }

    return NextResponse.json({ package: transformedPackage })

  } catch (error) {
    console.error('Erro ao buscar pacote:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar pacote
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getAuthenticatedPackage(params.id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const { supabase, companyId } = result
    const body = await request.json()
    const validatedData = updatePackageSchema.parse(body)

    // Se serviços foram fornecidos, verificar se pertencem à empresa
    if (validatedData.services) {
      const serviceIds = validatedData.services.map(s => s.service_id)
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id')
        .eq('company_id', companyId)
        .in('id', serviceIds)

      if (servicesError || services?.length !== serviceIds.length) {
        return NextResponse.json({ error: 'Serviços inválidos' }, { status: 400 })
      }
    }

    // Atualizar pacote
    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.discount_type !== undefined) updateData.discount_type = validatedData.discount_type
    if (validatedData.discount_value !== undefined) updateData.discount_value = validatedData.discount_value
    if (validatedData.total_price !== undefined) updateData.total_price = validatedData.total_price
    if (validatedData.final_price !== undefined) updateData.final_price = validatedData.final_price
    if (validatedData.is_active !== undefined) updateData.is_active = validatedData.is_active
    if (validatedData.valid_until !== undefined) updateData.valid_until = validatedData.valid_until

    const { data: updatedPackage, error: updateError } = await supabase
      .from('service_packages')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar pacote:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar pacote' }, { status: 500 })
    }

    // Se serviços foram fornecidos, atualizar relações
    if (validatedData.services) {
      // Remover relações existentes
      await supabase
        .from('package_services')
        .delete()
        .eq('package_id', params.id)

      // Criar novas relações
      const packageServices = validatedData.services.map(service => ({
        package_id: params.id,
        service_id: service.service_id,
        quantity: service.quantity,
        unit_price: service.unit_price,
        total_price: service.total_price
      }))

      const { error: servicesRelationError } = await supabase
        .from('package_services')
        .insert(packageServices)

      if (servicesRelationError) {
        console.error('Erro ao atualizar relações de serviços:', servicesRelationError)
        return NextResponse.json({ error: 'Erro ao atualizar serviços do pacote' }, { status: 500 })
      }
    }

    return NextResponse.json({ package: updatedPackage })

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

// DELETE - Excluir pacote
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await getAuthenticatedPackage(params.id)
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const { supabase } = result

    // Verificar se há agendamentos usando este pacote
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .eq('package_id', params.id)
      .limit(1)

    if (appointmentsError) {
      console.error('Erro ao verificar agendamentos:', appointmentsError)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    if (appointments && appointments.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir pacote com agendamentos associados' 
      }, { status: 400 })
    }

    // Excluir relações de serviços primeiro
    const { error: servicesDeleteError } = await supabase
      .from('package_services')
      .delete()
      .eq('package_id', params.id)

    if (servicesDeleteError) {
      console.error('Erro ao excluir relações de serviços:', servicesDeleteError)
      return NextResponse.json({ error: 'Erro ao excluir pacote' }, { status: 500 })
    }

    // Excluir pacote
    const { error: deleteError } = await supabase
      .from('service_packages')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Erro ao excluir pacote:', deleteError)
      return NextResponse.json({ error: 'Erro ao excluir pacote' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Pacote excluído com sucesso' })

  } catch (error) {
    console.error('Erro na API de pacotes:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}