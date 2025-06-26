'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

type Client = {
  id: string
  name: string
  email: string
  phone: string
  avatar_url?: string
  address?: string
  notes?: string
  is_active: boolean
  created_at: string
  company_id: string
}

const clientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  address: z.string().optional(),
  notes: z.string().optional()
})

type ClientFormData = z.infer<typeof clientSchema>

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [client, setClient] = useState<Client | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema)
  })

  useEffect(() => {
    loadClient()
  }, [clientId])

  const loadClient = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (error) {
        console.error('Erro ao carregar cliente:', error)
        toast.error('Erro ao carregar dados do cliente')
        router.push('/clients')
        return
      }

      setClient(data)
      reset({
        name: data.name,
        email: data.email || '',
        phone: data.phone,
        address: data.address || '',
        notes: data.notes || ''
      })
    } catch (error) {
      console.error('Erro ao carregar cliente:', error)
      toast.error('Erro ao carregar dados do cliente')
      router.push('/clients')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ClientFormData) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: data.name,
          email: data.email || null,
          phone: data.phone,
          address: data.address || null,
          notes: data.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)

      if (error) {
        console.error('Erro ao atualizar cliente:', error)
        toast.error('Erro ao atualizar cliente')
        return
      }

      toast.success('Cliente atualizado com sucesso!')
      router.push('/clients')
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)
      toast.error('Erro ao atualizar cliente')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Cliente não encontrado</p>
        <Button 
          onClick={() => router.push('/clients')} 
          className="mt-4"
        >
          Voltar para Clientes
        </Button>
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
          onClick={() => router.push('/clients')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Cliente</h1>
          <p className="text-gray-600">Atualize as informações do cliente</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Nome completo do cliente"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="email@exemplo.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="(11) 99999-9999"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              {/* Endereço */}
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="Endereço completo"
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address.message}</p>
                )}
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Observações sobre o cliente..."
                rows={4}
                className={errors.notes ? 'border-red-500' : ''}
              />
              {errors.notes && (
                <p className="text-sm text-red-500">{errors.notes.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/clients')}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}