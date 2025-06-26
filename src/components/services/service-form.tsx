'use client'

import { useState, useEffect } from 'react'
import { ServiceFormProps, ServiceFormData, SERVICE_CATEGORIES, CATEGORY_LABELS, SERVICE_COLORS, WEEKDAYS, WEEKDAY_LABELS } from '@/types/services'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  X, 
  Upload, 
  Image as ImageIcon,
  Trash2,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Palette,
  Tag
} from 'lucide-react'

export function ServiceForm({ service, onSubmit, onCancel, isLoading }: ServiceFormProps) {
  const [formData, setFormData] = useState<ServiceFormData>({
    name: service?.name || '',
    description: service?.description || '',
    category: service?.category || 'banho',
    price: service?.price || 0,
    duration_minutes: service?.duration_minutes || 60,
    is_active: service?.is_active ?? true,
    requires_appointment: service?.requires_appointment ?? true,
    max_pets_per_session: service?.max_pets_per_session || 1,
    available_days: service?.available_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    available_hours: service?.available_hours || { start: '08:00', end: '18:00' },
    color: service?.color || SERVICE_COLORS[0],
    photos: []
  })

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (formData.price <= 0) {
      newErrors.price = 'Preço deve ser maior que zero'
    }

    if (formData.duration_minutes <= 0) {
      newErrors.duration_minutes = 'Duração deve ser maior que zero'
    }

    if (formData.max_pets_per_session <= 0) {
      newErrors.max_pets_per_session = 'Número de pets deve ser maior que zero'
    }

    if (formData.available_days.length === 0) {
      newErrors.available_days = 'Selecione pelo menos um dia'
    }

    if (!formData.available_hours.start || !formData.available_hours.end) {
      newErrors.available_hours = 'Horários são obrigatórios'
    }

    if (formData.available_hours.start >= formData.available_hours.end) {
      newErrors.available_hours = 'Horário de início deve ser menor que o de fim'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Manipular upload de fotos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/')
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB
      return isValidType && isValidSize
    })

    if (validFiles.length !== files.length) {
      alert('Alguns arquivos foram ignorados. Apenas imagens até 5MB são aceitas.')
    }

    setSelectedFiles(prev => [...prev, ...validFiles])
    setFormData(prev => ({ ...prev, photos: [...(prev.photos || []), ...validFiles] }))

    // Criar URLs de preview
    validFiles.forEach(file => {
      const url = URL.createObjectURL(file)
      setPreviewUrls(prev => [...prev, url])
    })
  }

  // Remover foto
  const removePhoto = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setFormData(prev => ({ 
      ...prev, 
      photos: prev.photos?.filter((_, i) => i !== index) || []
    }))
    
    // Revogar URL do preview
    URL.revokeObjectURL(previewUrls[index])
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  // Manipular dias da semana
  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      available_days: prev.available_days.includes(day)
        ? prev.available_days.filter(d => d !== day)
        : [...prev.available_days, day]
    }))
  }

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    await onSubmit(formData)
  }

  // Cleanup URLs de preview
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Informações Básicas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="name">Nome do Serviço *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Banho e Tosa Completa"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o serviço oferecido..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria *</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {SERVICE_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="color">Cor de Identificação</Label>
            <div className="flex items-center gap-2 mt-1">
              {SERVICE_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Preços e Duração */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Preços e Duração
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="price">Preço (R$) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              placeholder="0,00"
              className={errors.price ? 'border-red-500' : ''}
            />
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
          </div>

          <div>
            <Label htmlFor="duration">Duração (minutos) *</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={formData.duration_minutes}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
              placeholder="60"
              className={errors.duration_minutes ? 'border-red-500' : ''}
            />
            {errors.duration_minutes && <p className="text-red-500 text-sm mt-1">{errors.duration_minutes}</p>}
          </div>

          <div>
            <Label htmlFor="max_pets">Máximo de Pets *</Label>
            <Input
              id="max_pets"
              type="number"
              min="1"
              value={formData.max_pets_per_session}
              onChange={(e) => setFormData(prev => ({ ...prev, max_pets_per_session: parseInt(e.target.value) || 0 }))}
              placeholder="1"
              className={errors.max_pets_per_session ? 'border-red-500' : ''}
            />
            {errors.max_pets_per_session && <p className="text-red-500 text-sm mt-1">{errors.max_pets_per_session}</p>}
          </div>
        </div>
      </Card>

      {/* Disponibilidade */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Disponibilidade
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label>Dias da Semana *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {WEEKDAYS.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    formData.available_days.includes(day)
                      ? 'bg-green-100 border-green-300 text-green-800'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {WEEKDAY_LABELS[day]}
                </button>
              ))}
            </div>
            {errors.available_days && <p className="text-red-500 text-sm mt-1">{errors.available_days}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Horário de Início *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.available_hours.start}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  available_hours: { ...prev.available_hours, start: e.target.value }
                }))}
                className={errors.available_hours ? 'border-red-500' : ''}
              />
            </div>

            <div>
              <Label htmlFor="end_time">Horário de Fim *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.available_hours.end}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  available_hours: { ...prev.available_hours, end: e.target.value }
                }))}
                className={errors.available_hours ? 'border-red-500' : ''}
              />
            </div>
          </div>
          {errors.available_hours && <p className="text-red-500 text-sm mt-1">{errors.available_hours}</p>}
        </div>
      </Card>

      {/* Configurações */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Configurações
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Serviço ativo (disponível para agendamento)
            </Label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="requires_appointment"
              checked={formData.requires_appointment}
              onChange={(e) => setFormData(prev => ({ ...prev, requires_appointment: e.target.checked }))}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <Label htmlFor="requires_appointment" className="cursor-pointer">
              Requer agendamento prévio
            </Label>
          </div>
        </div>
      </Card>

      {/* Upload de Fotos */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Fotos do Serviço
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="photos">Adicionar Fotos</Label>
            <div className="mt-2">
              <input
                type="file"
                id="photos"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('photos')?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Selecionar Fotos
              </Button>
              <p className="text-sm text-gray-600 mt-1">
                Máximo 5MB por foto. Formatos: JPG, PNG, WebP
              </p>
            </div>
          </div>

          {/* Preview das Fotos */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {index === 0 && (
                    <Badge className="absolute bottom-1 left-1 text-xs">
                      Principal
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Ações */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {service ? 'Atualizar Serviço' : 'Criar Serviço'}
        </Button>
      </div>
    </form>
  )
}