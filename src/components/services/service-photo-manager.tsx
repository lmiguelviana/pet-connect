'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useServices } from '@/hooks/use-services'
import { ServicePhoto } from '@/types/services'
import { 
  Upload, 
  X, 
  Star, 
  StarOff, 
  Image as ImageIcon,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface ServicePhotoManagerProps {
  serviceId: string
  photos: ServicePhoto[]
  onPhotosUpdate?: () => void
  maxPhotos?: number
}

export function ServicePhotoManager({ 
  serviceId, 
  photos, 
  onPhotosUpdate,
  maxPhotos = 10 
}: ServicePhotoManagerProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const { uploadPhoto, deletePhoto, setPrimaryPhoto } = useServices({ autoLoad: false })

  // Validar arquivo
  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.'
    }

    if (file.size > maxSize) {
      return 'Arquivo muito grande. Máximo 5MB.'
    }

    return null
  }

  // Selecionar arquivos
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles: File[] = []
    const errors: string[] = []

    // Verificar limite total
    if (photos.length + files.length > maxPhotos) {
      toast.error(`Máximo de ${maxPhotos} fotos permitidas`)
      return
    }

    // Validar cada arquivo
    files.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      toast.error(errors.join('\n'))
    }

    setSelectedFiles(prev => [...prev, ...validFiles])
    
    // Limpar input
    event.target.value = ''
  }, [photos.length, maxPhotos])

  // Remover arquivo selecionado
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Upload das fotos
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    try {
      setIsUploading(true)
      
      for (const file of selectedFiles) {
        const metadata = {
          is_primary: photos.length === 0 && selectedFiles.indexOf(file) === 0,
          caption: file.name.split('.')[0]
        }

        await uploadPhoto(serviceId, file, metadata)
      }

      setSelectedFiles([])
      onPhotosUpdate?.()
      toast.success(`${selectedFiles.length} foto(s) enviada(s) com sucesso!`)

    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error('Erro ao enviar fotos')
    } finally {
      setIsUploading(false)
    }
  }

  // Excluir foto
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta foto?')) return

    try {
      await deletePhoto(serviceId, photoId)
      onPhotosUpdate?.()
    } catch (error) {
      console.error('Erro ao excluir foto:', error)
    }
  }

  // Definir como foto principal
  const handleSetPrimary = async (photoId: string) => {
    if (!serviceId) return
    
    const success = await setPrimaryPhoto(serviceId, photoId)
    if (success && onPhotosUpdate) {
      onPhotosUpdate()
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload de novas fotos */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Fotos do Serviço</Label>
              <p className="text-sm text-gray-600">
                {photos.length}/{maxPhotos} fotos • Máximo 5MB por foto
              </p>
            </div>
            <Badge variant="outline">
              {photos.length > 0 ? 'Com fotos' : 'Sem fotos'}
            </Badge>
          </div>

          {/* Input de arquivo */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <Input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              id="photo-upload"
              disabled={photos.length >= maxPhotos}
            />
            <Label 
              htmlFor="photo-upload" 
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-gray-400" />
              <span className="text-sm font-medium">
                {photos.length >= maxPhotos 
                  ? 'Limite de fotos atingido'
                  : 'Clique para selecionar fotos'
                }
              </span>
              <span className="text-xs text-gray-500">
                JPEG, PNG ou WebP até 5MB
              </span>
            </Label>
          </div>

          {/* Arquivos selecionados */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Arquivos selecionados:</Label>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(1)}MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSelectedFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  `Enviar ${selectedFiles.length} foto(s)`
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Galeria de fotos existentes */}
      {photos.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Fotos Atuais</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Foto do serviço'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Overlay com ações */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSetPrimary(photo.id)}
                        title={photo.is_primary ? 'Foto principal' : 'Definir como principal'}
                      >
                        {photo.is_primary ? (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeletePhoto(photo.id)}
                        title="Excluir foto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Badge de foto principal */}
                  {photo.is_primary && (
                    <Badge 
                      className="absolute top-2 left-2 bg-yellow-500 text-white"
                      variant="secondary"
                    >
                      Principal
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}