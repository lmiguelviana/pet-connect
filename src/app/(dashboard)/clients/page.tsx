'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

type Client = {
  id: string
  name: string
  email: string
  phone: string
  avatar_url?: string
  is_active: boolean
  created_at: string
  company_id: string
  _count?: {
    pets: number
    appointments: number
  }
}

export default function ClientsPage() {
  const { company } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadClients()
    }
  }, [company?.id, searchQuery, statusFilter])

  const loadClients = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('clients')
        .select('*')
        .eq('company_id', company!.id)

      // Aplicar filtros
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active')
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
      }

      // Aplicar ordenação
      query = query.order('name', { ascending: true })

      const { data, error } = await query

      if (error) throw error

      setClients(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: false })
        .eq('id', clientId)

      if (error) throw error

      toast.success('Cliente removido com sucesso')
      loadClients()
    } catch (error) {
      console.error('Erro ao remover cliente:', error)
      toast.error('Erro ao remover cliente')
    }
  }

  const handleRestoreClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: true })
        .eq('id', clientId)

      if (error) throw error

      toast.success('Cliente restaurado com sucesso')
      loadClients()
    } catch (error) {
      console.error('Erro ao restaurar cliente:', error)
      toast.error('Erro ao restaurar cliente')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie os clientes do seu pet shop
          </p>
        </div>
        <Link href="/clients/new">
          <Button className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total de Clientes
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {clients.filter(c => c.is_active).length}
                </dd>
              </dl>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Clientes Ativos
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {clients.filter(c => c.is_active).length}
                </dd>
              </dl>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Clientes Inativos
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {clients.filter(c => !c.is_active).length}
                </dd>
              </dl>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Clients List */}
      <Card>
        <div className="px-4 py-5 sm:p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Carregando clientes...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum cliente encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || statusFilter !== 'active' 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece cadastrando seu primeiro cliente.'
                }
              </p>
              {!searchQuery && statusFilter === 'active' && (
                <div className="mt-6">
                  <Link href="/clients/new">
                    <Button>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Cadastrar Cliente
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cadastrado
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client.id} className={!client.is_active ? 'opacity-60 bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {client.avatar_url ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={client.avatar_url}
                                alt={client.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-600">
                                  {client.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {client.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.email}</div>
                        <div className="text-sm text-gray-500">{client.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          client.is_active 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {client.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(client.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link href={`/clients/${client.id}`}>
                            <Button variant="outline" size="sm">
                              Ver
                            </Button>
                          </Link>
                          <Link href={`/clients/${client.id}/edit`}>
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          </Link>
                          {client.is_active ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteClient(client.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Inativar
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRestoreClient(client.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              Ativar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}