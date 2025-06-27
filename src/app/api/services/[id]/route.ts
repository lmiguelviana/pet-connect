import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { z } from 'zod'

// Schema de validação para atualização de serviço
const updateServiceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').optional(),
  description: z.string().optional(),
  category: z.enum([
    'banho', 'tosa', 'banho-e-tosa', 'veterinario', 'consulta', 
    'vacina', 'cirurgia', 'estetica', 'spa', 'hotel', 'daycare', 
    'adestramento', 'outros'
  ]).optional(),
  price: z.number().min(0, 'Preço deve ser positivo').optional(),
  duration: z.number().min(1, 'Duração deve ser pelo menos 1 minuto').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve ser um hex válido').optional(),
  is_active: z.boolean().optional(),
  requires_appointment: z.boolean().optional(),
  max_pets_per_session: z.number().min(1, 'Deve permitir pelo menos 1 pet').max(10, 'Máximo 10 pets por sessão').optional(),
  available_days: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).optional(),
  available_hours: z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido')
  }).optional()
})

interface RouteParams {
  params: {
    id: string
  }
}

// Função auxiliar para verificar autenticação e obter company_id
async function getAuthenticatedUser() {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Não autorizado', status: 401 }
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (userError || !userData?.company_id) {
    return { error: 'Usuário não associado a uma empresa', status: 400 }
  }

  return { user, companyId: userData.company_id }
}

// Função auxiliar para verificar se o serviço pertence à empresa
async function verifyServiceOwnership(serviceId: string, companyId: string) {
  const supabase = createClient()
  
  const { data: service, error } = await supabase
    .from('services')
    .select('id, company_id')
    .eq('id', serviceId)
    .eq('company_id', companyId)
    .single()

  if (error || !service) {
    return { error: 'Serviço não encontrado', status: 404 }
  }

  return { service }
}

// GET - Buscar serviço específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await getAuthenticatedUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { companyId } = authResult
    const serviceId = params.id

    // Verificar se o serviço existe e pertence à empresa
    const ownershipResult = await verifyServiceOwnership(serviceId, companyId)
    if ('error' in ownershipResult) {
      return NextResponse.json({ error: ownershipResult.error }, { status: ownershipResult.status })
    }

    // Buscar serviço com fotos
    const supabase = createClient()
    const { data: service, error } = await supabase
      .from('services')
      .select(`
        *,
        service_photos (
          id,
          photo_url,
          is_primary
        )
      `)
      .eq('id', serviceId)
      .eq('company_id', companyId)
      .single()

    if (error) {
      console.error('Erro ao buscar serviço:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    return NextResponse.json({ service })

  } catch (error) {
    console.error('Erro na API de serviço:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT - Atualizar serviço
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await getAuthenticatedUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { companyId } = authResult
    const serviceId = params.id

    // Verificar se o serviço existe e pertence à empresa
    const ownershipResult = await verifyServiceOwnership(serviceId, companyId)
    if ('error' in ownershipResult) {
      return NextResponse.json({ error: ownershipResult.error }, { status: ownershipResult.status })
    }

    // Validar dados
    const body = await request.json()
    const validatedData = updateServiceSchema.parse(body)

    // Atualizar serviço
    const supabase = createClient()
    const { data: service, error } = await supabase
      .from('services')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId)
      .eq('company_id', companyId)
      .select(`
        *,
        service_photos (
          id,
          photo_url,
          is_primary
        )
      `)
      .single()

    if (error) {
      console.error('Erro ao atualizar serviço:', error)
      return NextResponse.json({ error: 'Erro ao atualizar serviço' }, { status: 500 })
    }

    return NextResponse.json({ service })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: error.errors 
      }, { status: 400 })
    }

    console.error('Erro na API de serviço:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Excluir serviço
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await getAuthenticatedUser()
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { companyId } = authResult
    const serviceId = params.id

    // Verificar se o serviço existe e pertence à empresa
    const ownershipResult = await verifyServiceOwnership(serviceId, companyId)
    if ('error' in ownershipResult) {
      return NextResponse.json({ error: ownershipResult.error }, { status: ownershipResult.status })
    }

    const supabase = createClient()

    // Verificar se há agendamentos associados
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .eq('service_id', serviceId)
      .limit(1)

    if (appointmentsError) {
      console.error('Erro ao verificar agendamentos:', appointmentsError)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    if (appointments && appointments.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir serviço com agendamentos associados. Desative o serviço em vez de excluí-lo.' 
      }, { status: 400 })
    }

    // Excluir fotos do storage primeiro
    const { data: photos } = await supabase
      .from('service_photos')
      .select('photo_url')
      .eq('service_id', serviceId)

    if (photos && photos.length > 0) {
      for (const photo of photos) {
        // Extrair o caminho do arquivo da URL
        const urlParts = photo.photo_url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const filePath = `services/${serviceId}/${fileName}`
        
        await supabase.storage
          .from('service-photos')
          .remove([filePath])
      }
    }

    // Excluir registros de fotos
    await supabase
      .from('service_photos')
      .delete()
      .eq('service_id', serviceId)

    // Excluir serviço
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)
      .eq('company_id', companyId)

    if (error) {
      console.error('Erro ao excluir serviço:', error)
      return NextResponse.json({ error: 'Erro ao excluir serviço' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Serviço excluído com sucesso' })

  } catch (error) {
    console.error('Erro na API de serviço:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}