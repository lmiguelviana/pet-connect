'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ServiceForm } from '@/components/services/service-form'
import { ServiceFormData } from '@/types/services'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

export default function NewServicePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: ServiceFormData) => {
    if (!user?.company_id) return

    try {
      setIsLoading(true)
      const supabase = createClient()

      // Criar serviço
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .insert({
          company_id: user.company_id,
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
          color: data.color
        })
        .select()
        .single()

      if (serviceError) throw serviceError

      // Upload de fotos (se houver)
      if (data.photos && data.photos.length > 0) {
        for (let i = 0; i < data.photos.length; i++) {
          const file = data.photos[i]
          const fileName = `${serviceData.id}/${Date.now()}-${file.name}`
          
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
              service_id: serviceData.id,
              company_id: user.company_id,
              url: publicUrl,
              is_primary: i === 0, // Primeira foto é a principal
              caption: `Foto ${i + 1}`
            })
        }
      }

      router.push('/services')
    } catch (error) {
      console.error('Erro ao criar serviço:', error)
      alert('Erro ao criar serviço')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/services')
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
          <h1 className="text-2xl font-bold text-gray-900">Novo Serviço</h1>
          <p className="text-gray-600">Cadastre um novo serviço para seu pet shop</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="max-w-4xl">
        <ServiceForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}