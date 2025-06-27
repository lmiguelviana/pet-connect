'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ServiceForm } from '@/components/services/service-form'
import { ServiceFormData } from '@/types/services'
import { useServices } from '@/hooks/use-services'

export default function NewServicePage() {
  const router = useRouter()
  const { createService, isLoading } = useServices({ autoLoad: false })

  const handleSubmit = async (data: ServiceFormData) => {
    const service = await createService(data)
    
    if (service) {
      router.push('/services')
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