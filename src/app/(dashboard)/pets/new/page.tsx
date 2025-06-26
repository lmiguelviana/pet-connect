'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { PetForm } from '@/components/forms/pet-form'
import type { PetFormData } from '@/types/pets'
import type { Client } from '@/types'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'

export default function NewPetPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()
      
      if (!userData?.company_id) return
      
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, phone')
        .eq('company_id', userData.company_id)
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      toast.error('Erro ao carregar clientes')
    }
  }

  const handleSubmit = async (data: PetFormData) => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')
      
      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()
      
      if (!userData?.company_id) throw new Error('Empresa não encontrada')
      
      const { error } = await supabase
        .from('pets')
        .insert({
          ...data,
          company_id: userData.company_id
        })
      
      if (error) throw error
      
      toast.success('Pet cadastrado com sucesso!')
      router.push('/pets')
    } catch (error) {
      console.error('Erro ao cadastrar pet:', error)
      toast.error('Erro ao cadastrar pet')
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Pet</h1>
          <p className="text-gray-600">Cadastre um novo pet no sistema</p>
        </div>
      </div>

      {/* Formulário */}
      <PetForm
        clients={clients}
        onSubmit={handleSubmit}
        isLoading={loading}
      />
    </div>
  )
}