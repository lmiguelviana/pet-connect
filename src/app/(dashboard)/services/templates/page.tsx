'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ServiceTemplates } from '@/components/services/service-templates'
import { ServiceForm } from '@/components/services/service-form'
import { ServiceFormData } from '@/types/services'
import { useServices } from '@/hooks/use-services'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ServiceTemplate {
  id: string
  name: string
  category: string
  description: string
  price: number
  duration_minutes: number
  icon: React.ReactNode
  popular?: boolean
  data: Partial<ServiceFormData>
}

export default function ServiceTemplatesPage() {
  const router = useRouter()
  const { createService, isLoading } = useServices({ autoLoad: false })
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleSelectTemplate = (template: ServiceTemplate) => {
    setSelectedTemplate(template)
    setShowForm(true)
  }

  const handleSubmit = async (data: ServiceFormData) => {
    const service = await createService(data)
    
    if (service) {
      router.push('/services')
    }
  }

  const handleCancel = () => {
    if (showForm) {
      setShowForm(false)
      setSelectedTemplate(null)
    } else {
      router.push('/services')
    }
  }

  const handleCreateFromScratch = () => {
    router.push('/services/new')
  }

  // Preparar dados iniciais do formulário baseado no template
  const getInitialFormData = (): Partial<ServiceFormData> => {
    if (!selectedTemplate) return {}

    return {
      name: selectedTemplate.name,
      description: selectedTemplate.description,
      category: selectedTemplate.category as any,
      price: selectedTemplate.price,
      duration_minutes: selectedTemplate.duration_minutes,
      ...selectedTemplate.data
    }
  }

  if (showForm && selectedTemplate) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos Templates
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Novo Serviço - {selectedTemplate.name}
            </h1>
            <p className="text-gray-600">
              Personalize o template selecionado
            </p>
          </div>
        </div>

        {/* Formulário */}
        <div className="max-w-4xl">
          <ServiceForm
            service={getInitialFormData() as any}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Templates de Serviços</h1>
          <p className="text-gray-600">
            Escolha um template para criar seu serviço rapidamente
          </p>
        </div>
      </div>

      {/* Templates */}
      <ServiceTemplates
        onSelectTemplate={handleSelectTemplate}
        onClose={handleCreateFromScratch}
      />
    </div>
  )
}