'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { PetForm } from '@/components/forms/pet-form'
import type { Pet, PetFormData } from '@/types/pets'
import type { Client } from '@/types'

export default function EditPetPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  
  const [pet, setPet] = useState<Pet | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadPet()
      loadClients()
    }
  }, [params.id])

  const loadPet = async () => {
    try {
      setLoading(true)
      
      const { data: pet, error } = await supabase
        .from('pets')
        .select(`
          *,
          client:clients(id, name),
          photos:pet_photos(*)
        `)
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Erro ao carregar pet:', error)
        toast.error('Erro ao carregar dados do pet')
        return
      }

      setPet(pet)
    } catch (error) {
      console.error('Erro ao carregar pet:', error)
      toast.error('Erro ao carregar dados do pet')
    } finally {
      setLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      // Obter company_id do usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!userData?.company_id) return
      
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', userData.company_id)
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Erro ao carregar clientes:', error)
        return
      }

      setClients(clients || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const handlePhotoUpload = async (file: File): Promise<string> => {
    try {
      // Obter company_id do usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!userData?.company_id) throw new Error('Company ID não encontrado')

      const fileExt = file.name.split('.').pop()
      const fileName = `${params.id}-${Date.now()}.${fileExt}`
      const filePath = `pets/${userData.company_id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('pet-photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(filePath)

      // Salvar referência da foto na tabela pet_photos
      const { error: photoError } = await supabase
        .from('pet_photos')
        .insert({
          pet_id: params.id as string,
          photo_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          is_profile_photo: !pet?.photos?.length // Primeira foto é profile
        })

      if (photoError) throw photoError

      return publicUrl
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error)
      throw error
    }
  }

  const handlePhotoDelete = async (photoId: string) => {
    try {
      // Obter dados da foto
      const { data: photo } = await supabase
        .from('pet_photos')
        .select('photo_url, is_profile_photo')
        .eq('id', photoId)
        .single()

      if (!photo) throw new Error('Foto não encontrada')

      // Extrair caminho do arquivo da URL
      const urlParts = photo.photo_url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const folderPath = urlParts.slice(-3, -1).join('/') // pets/company_id
      const filePath = `${folderPath}/${fileName}`

      // Deletar arquivo do storage
      const { error: storageError } = await supabase.storage
        .from('pet-photos')
        .remove([filePath])

      if (storageError) {
        console.error('Erro ao deletar arquivo do storage:', storageError)
      }

      // Deletar registro da tabela
      const { error: dbError } = await supabase
        .from('pet_photos')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError
      
      // Se era a foto de perfil, atualizar o pet
      if (photo.is_profile_photo) {
        await supabase
          .from('pets')
          .update({ avatar_url: null })
          .eq('id', params.id)
      }

    } catch (error) {
      console.error('Erro ao deletar foto:', error)
      throw error
    }
  }

  const handleSetProfilePhoto = async (photoId: string) => {
    try {
      // Obter URL da foto
      const { data: photo } = await supabase
        .from('pet_photos')
        .select('photo_url')
        .eq('id', photoId)
        .single()

      if (!photo) throw new Error('Foto não encontrada')

      // Remover flag de profile de todas as fotos
      await supabase
        .from('pet_photos')
        .update({ is_profile_photo: false })
        .eq('pet_id', params.id)

      // Definir nova foto de perfil
      await supabase
        .from('pet_photos')
        .update({ is_profile_photo: true })
        .eq('id', photoId)

      // Atualizar avatar do pet
      await supabase
        .from('pets')
        .update({ avatar_url: photo.photo_url })
        .eq('id', params.id)

    } catch (error) {
      console.error('Erro ao definir foto de perfil:', error)
      throw error
    }
  }

  const handleSubmit = async (data: PetFormData) => {
    try {
      setSaving(true)
      
      // Atualizar dados do pet
      const { error } = await supabase
        .from('pets')
        .update({
          name: data.name,
          species: data.species,
          breed: data.breed || null,
          gender: data.gender,
          birth_date: data.birth_date || null,
          weight: data.weight ? parseFloat(data.weight) : null,
          color: data.color || null,
          size: data.size,
          client_id: data.client_id,
          medical_history: data.medical_history || null,
          allergies: data.allergies || null,
          medications: data.medications || null,
          veterinarian_contact: data.veterinarian_contact || null,
          temperament: data.temperament || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) {
        console.error('Erro ao atualizar pet:', error)
        toast.error('Erro ao atualizar pet')
        return
      }

      toast.success('Pet atualizado com sucesso!')
      router.push('/pets')
    } catch (error) {
      console.error('Erro ao atualizar pet:', error)
      toast.error('Erro ao atualizar pet')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Carregando pet...</p>
        </div>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Pet não encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/pets">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Editar Pet: {pet.name}
          </h1>
          <p className="text-sm text-gray-500">
            Atualize as informações do pet
          </p>
        </div>
      </div>

      <PetForm
        pet={pet}
        clients={clients}
        onSubmit={handleSubmit}
        onPhotoUpload={handlePhotoUpload}
        onPhotoDelete={handlePhotoDelete}
        onSetProfilePhoto={handleSetProfilePhoto}
        isLoading={saving}
      />
    </div>
  )
}