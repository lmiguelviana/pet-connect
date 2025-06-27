'use client'

import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ServiceForm } from '@/components/services/service-form'
import { ServiceFormData } from '@/types/services'
import { useServices, useService } from '@/hooks/use-services'

export default function EditServicePage() {
  const router = useRouter()
  const params = useParams()
  const serviceId = params.id as string
  
  const { service, isLoading: isLoadingService, error } = useService(serviceId)
  const { updateService, isLoading } = useServices({ autoLoad: false })

  const handleSubmit = async (data: ServiceFormData) => {
    const updatedService = await updateService(serviceId, data)
    
    if (updatedService) {
      router.push('/services')
    }
  }

  const handleCancel = () => {
    router.push('/services')
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-red-600">Erro ao carregar serviço</p>
        </div>
      </div>
    )
  }

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