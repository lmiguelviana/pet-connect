'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Trash2, Upload, Star, StarOff } from 'lucide-react'
import { Pet, PetFormData, PetPhoto, PET_SPECIES_OPTIONS, PET_SIZE_OPTIONS, PET_GENDER_OPTIONS } from '@/types/pets'
import { Client } from '@/types'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

interface PetFormProps {
  pet?: Pet
  clients: Client[]
  onSubmit: (data: PetFormData) => Promise<void>
  onPhotoUpload?: (file: File) => Promise<string>
  onPhotoDelete?: (photoId: string) => Promise<void>
  onSetProfilePhoto?: (photoId: string) => Promise<void>
  isLoading?: boolean
}

export function PetForm({
  pet,
  clients,
  onSubmit,
  onPhotoUpload,
  onPhotoDelete,
  onSetProfilePhoto,
  isLoading = false
}: PetFormProps) {
  const [formData, setFormData] = useState<PetFormData>({
    name: pet?.name || '',
    client_id: pet?.client_id || '',
    species: pet?.species || 'dog',
    breed: pet?.breed || '',
    gender: pet?.gender || 'male',
    birth_date: pet?.birth_date || '',
    weight: pet?.weight || undefined,
    color: pet?.color || '',
    size: pet?.size || 'medium',
    medical_history: pet?.medical_history || '',
    allergies: pet?.allergies || '',
    medications: pet?.medications || '',
    veterinarian_contact: pet?.veterinarian_contact || '',
    temperament: pet?.temperament || ''
  })

  const [photos, setPhotos] = useState<PetPhoto[]>(pet?.photos || [])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    
    if (!formData.client_id) {
      toast.error('Cliente é obrigatório')
      return
    }

    await onSubmit(formData)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onPhotoUpload) return

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.')
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.')
      return
    }

    setUploadingPhoto(true)
    try {
      const photoUrl = await onPhotoUpload(file)
      
      // Recarregar fotos se estivermos editando
      if (pet?.id) {
        const supabase = createClient()
        const { data: updatedPhotos } = await supabase
          .from('pet_photos')
          .select('*')
          .eq('pet_id', pet.id)
          .order('created_at', { ascending: false })
        
        if (updatedPhotos) {
          setPhotos(updatedPhotos)
        }
      }
      
      toast.success('Foto enviada com sucesso!')
    } catch (error) {
      console.error('Erro ao enviar foto:', error)
      toast.error('Erro ao enviar foto')
    } finally {
      setUploadingPhoto(false)
      // Limpar input
      e.target.value = ''
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!onPhotoDelete) return
    
    try {
      await onPhotoDelete(photoId)
      setPhotos(photos.filter(p => p.id !== photoId))
      toast.success('Foto removida com sucesso!')
    } catch (error) {
      console.error('Erro ao remover foto:', error)
      toast.error('Erro ao remover foto')
    }
  }

  const handleSetProfilePhoto = async (photoId: string) => {
    if (!onSetProfilePhoto) return
    
    try {
      await onSetProfilePhoto(photoId)
      
      // Atualizar estado local
      setPhotos(photos.map(p => ({
        ...p,
        is_profile_photo: p.id === photoId
      })))
      
      toast.success('Foto de perfil definida!')
    } catch (error) {
      console.error('Erro ao definir foto de perfil:', error)
      toast.error('Erro ao definir foto de perfil')
    }
  }

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
    
    if (ageInMonths < 12) {
      return `${ageInMonths} ${ageInMonths === 1 ? 'mês' : 'meses'}`
    } else {
      const years = Math.floor(ageInMonths / 12)
      const months = ageInMonths % 12
      if (months === 0) {
        return `${years} ${years === 1 ? 'ano' : 'anos'}`
      } else {
        return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do pet"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="client_id">Tutor *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tutor" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="species">Espécie</Label>
              <Select
                value={formData.species}
                onValueChange={(value: Pet['species']) => setFormData({ ...formData, species: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PET_SPECIES_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="breed">Raça</Label>
              <Input
                id="breed"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                placeholder="Raça do pet"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gender">Gênero</Label>
              <Select
                value={formData.gender}
                onValueChange={(value: Pet['gender']) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PET_GENDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              />
              {formData.birth_date && (
                <p className="text-sm text-muted-foreground">
                  Idade: {calculateAge(formData.birth_date)}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                value={formData.weight || ''}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="Peso em kg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Cor do pet"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="size">Porte</Label>
              <Select
                value={formData.size}
                onValueChange={(value: Pet['size']) => setFormData({ ...formData, size: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PET_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="temperament">Temperamento</Label>
              <Input
                id="temperament"
                value={formData.temperament}
                onChange={(e) => setFormData({ ...formData, temperament: e.target.value })}
                placeholder="Ex: Dócil, Agitado, Tímido"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Médicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Médicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="medical_history">Histórico Médico</Label>
            <Textarea
              id="medical_history"
              value={formData.medical_history}
              onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
              placeholder="Histórico médico, cirurgias, tratamentos..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="allergies">Alergias</Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              placeholder="Alergias conhecidas..."
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="medications">Medicações</Label>
            <Textarea
              id="medications"
              value={formData.medications}
              onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
              placeholder="Medicações em uso..."
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="veterinarian_contact">Contato do Veterinário</Label>
            <Input
              id="veterinarian_contact"
              value={formData.veterinarian_contact}
              onChange={(e) => setFormData({ ...formData, veterinarian_contact: e.target.value })}
              placeholder="Nome e telefone do veterinário"
            />
          </div>
        </CardContent>
      </Card>

      {/* Fotos */}
      {pet && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Fotos
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                  disabled={uploadingPhoto}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  disabled={uploadingPhoto}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingPhoto ? 'Enviando...' : 'Adicionar Foto'}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {photos.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma foto adicionada ainda.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <div className="aspect-square relative overflow-hidden rounded-lg border">
                      <img
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pet-photos/${photo.photo_url}`}
                        alt={photo.caption || 'Foto do pet'}
                        className="w-full h-full object-cover"
                      />
                      {photo.is_profile_photo && (
                        <Badge className="absolute top-2 left-2 bg-yellow-500">
                          Perfil
                        </Badge>
                      )}
                    </div>
                    
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSetProfilePhoto(photo.id)}
                        disabled={photo.is_profile_photo}
                      >
                        {photo.is_profile_photo ? (
                          <Star className="h-4 w-4 fill-current" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeletePhoto(photo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {photo.caption && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botões */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : pet ? 'Atualizar Pet' : 'Cadastrar Pet'}
        </Button>
      </div>
    </form>
  )
}