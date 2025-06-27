import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

// Schema de validação para upload de foto
const uploadPhotoSchema = z.object({
  is_primary: z.boolean().default(false),
  caption: z.string().optional()
})

// Schema de validação para atualizar foto
const updatePhotoSchema = z.object({
  is_primary: z.boolean().optional(),
  caption: z.string().optional()
})

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

// Função para gerar nome único do arquivo
function generateFileName(originalName: string, serviceId: string): string {
  const timestamp = Date.now()
  const extension = originalName.split('.').pop()
  return `${serviceId}_${timestamp}.${extension}`
}

// Função para validar tipo de arquivo
function validateFileType(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  return allowedTypes.includes(file.type)
}

// Função para validar tamanho do arquivo (5MB max)
function validateFileSize(file: File): boolean {
  const maxSize = 5 * 1024 * 1024 // 5MB
  return file.size <= maxSize
}

// GET - Listar fotos do serviço
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

    // Buscar fotos do serviço
    const supabase = createClient()
    const { data: photos, error } = await supabase
      .from('service_photos')
      .select('*')
      .eq('service_id', serviceId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Erro ao buscar fotos:', error)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }

    return NextResponse.json({ photos })

  } catch (error) {
    console.error('Erro na API de fotos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST - Upload de nova foto
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Processar FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const metadata = formData.get('metadata') as string

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 })
    }

    // Validar arquivo
    if (!validateFileType(file)) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.' 
      }, { status: 400 })
    }

    if (!validateFileSize(file)) {
      return NextResponse.json({ 
        error: 'Arquivo muito grande. Tamanho máximo: 5MB.' 
      }, { status: 400 })
    }

    // Validar metadata
    let validatedMetadata = { is_primary: false, caption: undefined }
    if (metadata) {
      try {
        const parsedMetadata = JSON.parse(metadata)
        validatedMetadata = uploadPhotoSchema.parse(parsedMetadata)
      } catch (error) {
        return NextResponse.json({ 
          error: 'Metadados inválidos' 
        }, { status: 400 })
      }
    }

    const supabase = createClient()

    // Se esta foto será primária, remover flag primária das outras
    if (validatedMetadata.is_primary) {
      await supabase
        .from('service_photos')
        .update({ is_primary: false })
        .eq('service_id', serviceId)
    }

    // Gerar nome único para o arquivo
    const fileName = generateFileName(file.name, serviceId)
    const filePath = `services/${serviceId}/${fileName}`

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('service-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return NextResponse.json({ error: 'Erro ao fazer upload da foto' }, { status: 500 })
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('service-photos')
      .getPublicUrl(filePath)

    // Salvar registro no banco
    const { data: photo, error: dbError } = await supabase
      .from('service_photos')
      .insert({
        service_id: serviceId,
        photo_url: publicUrl,
        is_primary: validatedMetadata.is_primary,
        caption: validatedMetadata.caption
      })
      .select()
      .single()

    if (dbError) {
      console.error('Erro ao salvar foto no banco:', dbError)
      
      // Tentar remover arquivo do storage em caso de erro
      await supabase.storage
        .from('service-photos')
        .remove([filePath])
      
      return NextResponse.json({ error: 'Erro ao salvar foto' }, { status: 500 })
    }

    return NextResponse.json({ photo }, { status: 201 })

  } catch (error) {
    console.error('Erro na API de upload:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Excluir foto específica
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

    // Obter ID da foto dos parâmetros de query
    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get('photoId')

    if (!photoId) {
      return NextResponse.json({ error: 'ID da foto não fornecido' }, { status: 400 })
    }

    const supabase = createClient()

    // Buscar foto para obter URL
    const { data: photo, error: photoError } = await supabase
      .from('service_photos')
      .select('*')
      .eq('id', photoId)
      .eq('service_id', serviceId)
      .single()

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })
    }

    // Extrair caminho do arquivo da URL
    const urlParts = photo.photo_url.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const filePath = `services/${serviceId}/${fileName}`

    // Remover arquivo do storage
    const { error: storageError } = await supabase.storage
      .from('service-photos')
      .remove([filePath])

    if (storageError) {
      console.error('Erro ao remover arquivo do storage:', storageError)
    }

    // Remover registro do banco
    const { error: dbError } = await supabase
      .from('service_photos')
      .delete()
      .eq('id', photoId)
      .eq('service_id', serviceId)

    if (dbError) {
      console.error('Erro ao remover foto do banco:', dbError)
      return NextResponse.json({ error: 'Erro ao excluir foto' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Foto excluída com sucesso' })

  } catch (error) {
    console.error('Erro na API de exclusão de foto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PATCH - Atualizar foto (definir como principal ou alterar caption)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Obter ID da foto dos parâmetros de query
    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get('photoId')

    if (!photoId) {
      return NextResponse.json({ error: 'ID da foto não fornecido' }, { status: 400 })
    }

    // Validar dados de entrada
    const body = await request.json()
    const validatedData = updatePhotoSchema.parse(body)

    const supabase = createClient()

    // Verificar se a foto existe
    const { data: photo, error: photoError } = await supabase
      .from('service_photos')
      .select('*')
      .eq('id', photoId)
      .eq('service_id', serviceId)
      .single()

    if (photoError || !photo) {
      return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 })
    }

    // Se está definindo como principal, remover flag de outras fotos
    if (validatedData.is_primary === true) {
      await supabase
        .from('service_photos')
        .update({ is_primary: false })
        .eq('service_id', serviceId)
        .neq('id', photoId)
    }

    // Atualizar a foto
    const { data: updatedPhoto, error: updateError } = await supabase
      .from('service_photos')
      .update(validatedData)
      .eq('id', photoId)
      .eq('service_id', serviceId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar foto:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar foto' }, { status: 500 })
    }

    return NextResponse.json({ photo: updatedPhoto })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }
    
    console.error('Erro na API de atualização de foto:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}