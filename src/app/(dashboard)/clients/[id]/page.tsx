'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Trash2, User, Mail, Phone, MapPin, FileText, Calendar, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { Database } from '@/types/database'

type Client = Database['public']['Tables']['clients']['Row']
type Pet = Database['public']['Tables']['pets']['Row']

export default function ClientDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<Client | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [deleting, setDeleting] = useState(false)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    loadClientData()
  }, [clientId])

  const loadClientData = async () => {
    try {
      // Carregar dados do cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError) {
        console.error('Erro ao carregar cliente:', clientError)
        toast.error('Cliente não encontrado')
        router.push('/clients')
        return
      }

      setClient(clientData)

      // Carregar pets do cliente
      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('name')

      if (petsError) {
        console.error('Erro ao carregar pets:', petsError)
      } else {
        setPets(petsData || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do cliente')
      router.push('/clients')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!client) return
    
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o cliente "${client.name}"?\n\nEsta ação não pode ser desfeita.`
    )
    
    if (!confirmed) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: false })
        .eq('id', clientId)

      if (error) {
        console.error('Erro ao excluir cliente:', error)
        toast.error('Erro ao excluir cliente')
        return
      }

      toast.success('Cliente excluído com sucesso')
      router.push('/clients')
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      toast.error('Erro ao excluir cliente')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
      <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              <Badge variant={client.is_active ? 'default' : 'secondary'}>
                {client.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-gray-600">Detalhes do cliente</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/clients/${clientId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Cliente */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome</label>
                  <p className="text-gray-900">{client.name}</p>
                </div>
                
                {client.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{client.email}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Telefone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{client.phone}</p>
                  </div>
                </div>
                
                {client.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Endereço</label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <p className="text-gray-900">{client.address}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {client.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Observações
                  </label>
                  <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                    {client.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pets do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Pets ({pets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {pets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pets.map((pet) => (
                    <div key={pet.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold">
                            {pet.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium">{pet.name}</h4>
                          <p className="text-sm text-gray-500">
                            {pet.species} • {pet.breed}
                          </p>
                          {pet.age && (
                            <p className="text-sm text-gray-500">
                              {pet.age} anos
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum pet cadastrado</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => router.push('/pets/new')}
                  >
                    Cadastrar Pet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Cadastrado em</label>
                <p className="text-gray-900">{formatDate(client.created_at)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Última atualização</label>
                <p className="text-gray-900">{formatDate(client.updated_at)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <Badge variant={client.is_active ? 'default' : 'secondary'}>
                  {client.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/pets/new')}
              >
                Cadastrar Pet
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/appointments/new')}
              >
                Agendar Serviço
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push(`/clients/${clientId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Cliente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}