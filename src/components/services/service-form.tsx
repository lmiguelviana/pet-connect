'use client'

import { useState, useEffect } from 'react'
import { ServiceFormProps, ServiceFormData, SERVICE_CATEGORIES, CATEGORY_LABELS, SERVICE_COLORS, WEEKDAYS, WEEKDAY_LABELS, ServicePhoto } from '@/types/services'
import { ServicePhotoManager } from './service-photo-manager'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useFormWithValidation, serviceSchema } from '@/hooks/use-form-with-validation'
import { useCRUDToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase'
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
  const toast = useCRUDToast()
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [photos, setPhotos] = useState<ServicePhoto[]>([])
  const [shouldRefreshPhotos, setShouldRefreshPhotos] = useState(0)

  // Função de submissão que será chamada pelo react-hook-form
  const onSubmitForm = async (data: ServiceFormData) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!userData) throw new Error('Dados do usuário não encontrados');

      // Upload das fotos
      const photoUrls: string[] = [];
      for (const file of selectedFiles) {
        const fileName = `${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('service-photos')
          .upload(`${userData.company_id}/${fileName}`, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('service-photos')
          .getPublicUrl(uploadData.path);

        photoUrls.push(publicUrl);
      }

      // Preparar dados do serviço
      const serviceData = {
        ...data,
        company_id: userData.company_id,
        photos: photoUrls
      };

      await onSubmit(serviceData);
      toast.success(service ? 'Serviço atualizado!' : 'Serviço criado!');
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      toast.error('Erro ao salvar serviço');
    }
  }
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useFormWithValidation<ServiceFormData>({
    schema: serviceSchema,
    defaultValues: {
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
    },
    onSubmit: onSubmitForm
  })
  
  const formData = watch()



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
    setValue('photos', [...(watch('photos') || []), ...validFiles])

    // Criar URLs de preview
    validFiles.forEach(file => {
      const url = URL.createObjectURL(file)
      setPreviewUrls(prev => [...prev, url])
    })
  }

  // Remover foto
  const removePhoto = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setValue('photos', watch('photos')?.filter((_, i) => i !== index) || [])
    
    // Revogar URL do preview
    URL.revokeObjectURL(previewUrls[index])
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }





  // Cleanup URLs de preview
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
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
              {...register('name')}
              placeholder="Ex: Banho e Tosa Completa"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descreva o serviço oferecido..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria *</Label>
            <select
              id="category"
              {...register('category')}
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
                  onClick={() => setValue('color', color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    watch('color') === color ? 'border-gray-900 scale-110' : 'border-gray-300'
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
              {...register('price', { valueAsNumber: true })}
              placeholder="0,00"
              className={errors.price ? 'border-red-500' : ''}
            />
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
          </div>

          <div>
            <Label htmlFor="duration">Duração (minutos) *</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              {...register('duration_minutes', { valueAsNumber: true })}
              placeholder="60"
              className={errors.duration_minutes ? 'border-red-500' : ''}
            />
            {errors.duration_minutes && <p className="text-red-500 text-sm mt-1">{errors.duration_minutes.message}</p>}
          </div>

          <div>
            <Label htmlFor="max_pets">Máximo de Pets *</Label>
            <Input
              id="max_pets"
              type="number"
              min="1"
              {...register('max_pets_per_session', { valueAsNumber: true })}
              placeholder="1"
              className={errors.max_pets_per_session ? 'border-red-500' : ''}
            />
            {errors.max_pets_per_session && <p className="text-red-500 text-sm mt-1">{errors.max_pets_per_session.message}</p>}
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
                  onClick={() => {
                    const currentDays = watch('available_days') || [];
                    const newDays = currentDays.includes(day)
                      ? currentDays.filter(d => d !== day)
                      : [...currentDays, day];
                    setValue('available_days', newDays);
                  }}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    (watch('available_days') || []).includes(day)
                      ? 'bg-green-100 border-green-300 text-green-800'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {WEEKDAY_LABELS[day]}
                </button>
              ))}
            </div>
            {errors.available_days && <p className="text-red-500 text-sm mt-1">{errors.available_days.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Horário de Início *</Label>
              <Input
                id="start_time"
                type="time"
                {...register('available_hours.start')}
                className={errors.available_hours ? 'border-red-500' : ''}
              />
            </div>

            <div>
              <Label htmlFor="end_time">Horário de Fim *</Label>
              <Input
                id="end_time"
                type="time"
                {...register('available_hours.end')}
                className={errors.available_hours ? 'border-red-500' : ''}
              />
            </div>
          </div>
          {errors.available_hours && <p className="text-red-500 text-sm mt-1">{errors.available_hours.message}</p>}
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
              {...register('is_active')}
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
              {...register('requires_appointment')}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <Label htmlFor="requires_appointment" className="cursor-pointer">
              Requer agendamento prévio
            </Label>
          </div>
        </div>
      </Card>

      {/* Sistema de Fotos */}
      {service?.id && (
        <ServicePhotoManager
          serviceId={service.id}
          photos={photos}
          onPhotosUpdate={() => setShouldRefreshPhotos(prev => prev + 1)}
          maxPhotos={10}
        />
      )}

      {/* Upload de Fotos (apenas para novos serviços) */}
      {!service?.id && (
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
      )}

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
          {isLoading ? 'Salvando...' : service ? 'Atualizar Serviço' : 'Criar Serviço'}
        </Button>
      </div>
    </form>
  )
}