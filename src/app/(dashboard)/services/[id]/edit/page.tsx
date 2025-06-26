'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ServiceForm } from '@/components/services/service-form'
import { Service, ServiceFormData } from '@/types/services'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

export default function EditServicePage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingService, setIsLoadingService] = useState(true)

  // Carregar serviço
  const loadService = async () => {
    if (!params.id || !user?.company_id) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', params.id)
        .eq('company_id', user.company_id)
        .single()

      if (error) throw error

      setService(data)
    } catch (error) {
      console.error('Erro ao carregar serviço:', error)
      alert('Serviço não encontrado')
      router.push('/services')
    } finally {
      setIsLoadingService(false)
    }
  }

  const handleSubmit = async (data: ServiceFormData) => {
    if (!service || !user?.company_id) return

    try {
      setIsLoading(true)
      const supabase = createClient()

      // Atualizar serviço
      const { error: serviceError } = await supabase
        .from('services')
        .update({
          name: data.name,
          description: data.description,
          category: data.category,
          price: data.price,
          duration_minutes: data.duration_minutes,
          is_active: data.is_active,
          requires_appointment: data.requires_appointment,
          max_pets_per_session: data.max_pets_per_session,
          available_days: data.available_days,
          available_hours: data.available_hours,
          color: data.color,
          updated_at: new Date().toISOString()
        })
        .eq('id', service.id)

      if (serviceError) throw serviceError

      // Upload de novas fotos (se houver)
      if (data.photos && data.photos.length > 0) {
        // Buscar fotos existentes para determinar se é a primeira
        const { data: existingPhotos } = await supabase
          .from('service_photos')
          .select('id')
          .eq('service_id', service.id)

        const isFirstPhoto = !existingPhotos || existingPhotos.length === 0

        for (let i = 0; i < data.photos.length; i++) {
          const file = data.photos[i]
          const fileName = `${service.id}/${Date.now()}-${file.name}`
          
          // Upload da foto
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('service-photos')
            .upload(fileName, file)

          if (uploadError) {
            console.error('Erro no upload da foto:', uploadError)
            continue
          }

          // Obter URL pública
          const { data: { publicUrl } } = supabase.storage
            .from('service-photos')
            .getPublicUrl(fileName)

          // Salvar referência no banco
          await supabase
            .from('service_photos')
            .insert({
              service_id: service.id,
              company_id: user.company_id,
              url: publicUrl,
              is_primary: isFirstPhoto && i === 0, // Primeira foto é a principal se não houver outras
              caption: `Foto ${i + 1}`
            })
        }
      }

      router.push('/services')
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error)
      alert('Erro ao atualizar serviço')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/services')
  }

  useEffect(() => {
    loadService()
  }, [params.id, user?.company_id])

  if (isLoadingService) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando serviço...</p>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Serviço não encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Serviço</h1>
          <p className="text-gray-600">Edite as informações do serviço {service.name}</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="max-w-4xl">
        <ServiceForm
          service={service}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}