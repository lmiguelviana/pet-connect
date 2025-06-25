# 👥 Fase 04 - Gestão de Clientes

## 📋 Objetivos da Fase

- Implementar CRUD completo de clientes
- Criar formulários de cadastro e edição
- Implementar listagem com filtros e busca
- Adicionar validações e tratamento de erros
- Implementar upload de foto do cliente
- Criar histórico de atividades do cliente

## ⏱️ Estimativa: 4-5 dias

## 🛠️ Tarefas Detalhadas

### 1. Estrutura Base do Módulo de Clientes

#### 1.1 Layout da Página de Clientes
```typescript
// src/app/(dashboard)/clients/layout.tsx
export default function ClientsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      {children}
    </div>
  )
}
```

#### 1.2 Página Principal de Clientes
```typescript
// src/app/(dashboard)/clients/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { ClientsList } from '@/components/clients/clients-list'
import { ClientsFilters } from '@/components/clients/clients-filters'
import { ClientsStats } from '@/components/clients/clients-stats'
import { Button } from '@/components/ui/button'
import { PlusIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  birth_date: string | null
  notes: string | null
  photo_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
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
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'updated_at'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const supabase = createClient()

  useEffect(() => {
    if (company?.id) {
      loadClients()
    }
  }, [company?.id, searchQuery, statusFilter, sortBy, sortOrder])

  const loadClients = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('clients')
        .select(`
          *,
          pets:pets(count),
          appointments:appointments(count)
        `)
        .eq('company_id', company!.id)

      // Aplicar filtros
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active')
      }

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
      }

      // Aplicar ordenação
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error } = await query

      if (error) throw error

      // Processar contagens
      const processedClients = data?.map(client => ({
        ...client,
        _count: {
          pets: client.pets?.[0]?.count || 0,
          appointments: client.appointments?.[0]?.count || 0,
        }
      })) || []

      setClients(processedClients)
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
        .eq('company_id', company!.id)

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
        .eq('company_id', company!.id)

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
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie todos os clientes do seu pet shop
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link href="/clients/new">
            <Button className="inline-flex items-center">
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Novo Cliente
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <ClientsStats clients={clients} loading={loading} />

      {/* Filters */}
      <ClientsFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      {/* Clients List */}
      <ClientsList
        clients={clients}
        loading={loading}
        onDelete={handleDeleteClient}
        onRestore={handleRestoreClient}
        onRefresh={loadClients}
      />
    </div>
  )
}
```

### 2. Componentes de Listagem e Filtros

#### 2.1 Lista de Clientes
```typescript
// src/components/clients/clients-list.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Client } from '@/app/(dashboard)/clients/page'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import { clsx } from 'clsx'

interface ClientsListProps {
  clients: Client[]
  loading: boolean
  onDelete: (clientId: string) => void
  onRestore: (clientId: string) => void
  onRefresh: () => void
}

export function ClientsList({ clients, loading, onDelete, onRestore, onRefresh }: ClientsListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const handleDeleteClick = (clientId: string) => {
    setSelectedClientId(clientId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedClientId) {
      onDelete(selectedClientId)
      setDeleteDialogOpen(false)
      setSelectedClientId(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum cliente encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece cadastrando seu primeiro cliente.
            </p>
            <div className="mt-6">
              <Link href="/clients/new">
                <Button>
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Novo Cliente
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        {/* Header com controles de visualização */}
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {clients.length} cliente{clients.length !== 1 ? 's' : ''} encontrado{clients.length !== 1 ? 's' : ''}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={onRefresh}
                className="p-2 text-gray-400 hover:text-gray-500"
                title="Atualizar"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={clsx(
                    'px-3 py-2 text-sm font-medium rounded-l-md border',
                    viewMode === 'grid'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  )}
                >
                  Grade
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={clsx(
                    'px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b',
                    viewMode === 'table'
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  )}
                >
                  Tabela
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="px-4 py-5 sm:p-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {clients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onDelete={() => handleDeleteClick(client.id)}
                  onRestore={() => onRestore(client.id)}
                />
              ))}
            </div>
          ) : (
            <ClientTable
              clients={clients}
              onDelete={handleDeleteClick}
              onRestore={onRestore}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remover Cliente"
        description="Tem certeza que deseja remover este cliente? Esta ação pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  )
}

function ClientCard({ client, onDelete, onRestore }: {
  client: Client
  onDelete: () => void
  onRestore: () => void
}) {
  return (
    <div className={clsx(
      'relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400',
      !client.is_active && 'opacity-60 bg-gray-50'
    )}>
      {/* Status indicator */}
      <div className="absolute top-4 right-4">
        <span className={clsx(
          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
          client.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        )}>
          {client.is_active ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {client.photo_url ? (
            <img
              className="h-12 w-12 rounded-full object-cover"
              src={client.photo_url}
              alt={client.name}
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-lg font-medium text-primary-600">
                {client.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {client.name}
          </p>
          <div className="flex items-center mt-1">
            <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-1" />
            <p className="text-sm text-gray-500 truncate">
              {client.email}
            </p>
          </div>
          <div className="flex items-center mt-1">
            <PhoneIcon className="h-4 w-4 text-gray-400 mr-1" />
            <p className="text-sm text-gray-500">
              {client.phone}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">
            {client._count?.pets || 0}
          </p>
          <p className="text-xs text-gray-500">Pets</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">
            {client._count?.appointments || 0}
          </p>
          <p className="text-xs text-gray-500">Agendamentos</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex justify-between">
        <div className="flex space-x-2">
          <Link href={`/clients/${client.id}`}>
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <EyeIcon className="h-4 w-4" />
            </button>
          </Link>
          <Link href={`/clients/${client.id}/edit`}>
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <PencilIcon className="h-4 w-4" />
            </button>
          </Link>
        </div>
        <div>
          {client.is_active ? (
            <button
              onClick={onDelete}
              className="p-2 text-red-400 hover:text-red-500"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onRestore}
              className="p-2 text-green-400 hover:text-green-500"
              title="Restaurar cliente"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        Cadastrado em {format(new Date(client.created_at), 'dd/MM/yyyy', { locale: ptBR })}
      </div>
    </div>
  )
}

function ClientTable({ clients, onDelete, onRestore }: {
  clients: Client[]
  onDelete: (clientId: string) => void
  onRestore: (clientId: string) => void
}) {
  return (
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
              Pets
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
            <tr key={client.id} className={clsx(!client.is_active && 'opacity-60 bg-gray-50')}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    {client.photo_url ? (
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={client.photo_url}
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
                    <div className="text-sm text-gray-500">
                      {client.city}, {client.state}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{client.email}</div>
                <div className="text-sm text-gray-500">{client.phone}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {client._count?.pets || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={clsx(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  client.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                )}>
                  {client.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(client.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <Link href={`/clients/${client.id}`}>
                    <button className="text-primary-600 hover:text-primary-900">
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </Link>
                  <Link href={`/clients/${client.id}/edit`}>
                    <button className="text-primary-600 hover:text-primary-900">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </Link>
                  {client.is_active ? (
                    <button
                      onClick={() => onDelete(client.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onRestore(client.id)}
                      className="text-green-600 hover:text-green-900"
                      title="Restaurar cliente"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

#### 2.2 Filtros de Clientes
```typescript
// src/components/clients/clients-filters.tsx
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { clsx } from 'clsx'

interface ClientsFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: 'all' | 'active' | 'inactive'
  onStatusFilterChange: (status: 'all' | 'active' | 'inactive') => void
  sortBy: 'name' | 'created_at' | 'updated_at'
  onSortByChange: (sortBy: 'name' | 'created_at' | 'updated_at') => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (order: 'asc' | 'desc') => void
}

export function ClientsFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
}: ClientsFiltersProps) {
  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Ativos' },
    { value: 'inactive', label: 'Inativos' },
  ]

  const sortOptions = [
    { value: 'name', label: 'Nome' },
    { value: 'created_at', label: 'Data de Cadastro' },
    { value: 'updated_at', label: 'Última Atualização' },
  ]

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Buscar clientes
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                name="search"
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Nome, email ou telefone..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordenar por
            </label>
            <div className="flex space-x-2">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value as 'name' | 'created_at' | 'updated_at')}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={clsx(
                  'px-3 py-2 border border-gray-300 rounded-md text-sm font-medium',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                  sortOrder === 'asc'
                    ? 'bg-primary-50 text-primary-700 border-primary-300'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                )}
                onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 3. Formulário de Cadastro/Edição

#### 3.1 Página de Novo Cliente
```typescript
// src/app/(dashboard)/clients/new/page.tsx
'use client'

import { ClientForm } from '@/components/clients/client-form'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/clients"
          className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Voltar para clientes
        </Link>
      </div>

      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
            Novo Cliente
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Cadastre um novo cliente no sistema
          </p>
        </div>
      </div>

      {/* Form */}
      <ClientForm />
    </div>
  )
}
```

#### 3.2 Componente do Formulário
```typescript
// src/components/clients/client-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/components/ui/image-upload'
import { toast } from 'react-hot-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const clientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
  zip_code: z.string().min(8, 'CEP deve ter 8 dígitos'),
  birth_date: z.string().optional(),
  notes: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

interface ClientFormProps {
  initialData?: Partial<ClientFormData & { id: string; photo_url: string }>
  isEditing?: boolean
}

export function ClientForm({ initialData, isEditing = false }: ClientFormProps) {
  const router = useRouter()
  const { company } = useAuth()
  const [loading, setLoading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(initialData?.photo_url || '')
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      zip_code: initialData?.zip_code || '',
      birth_date: initialData?.birth_date || '',
      notes: initialData?.notes || '',
    },
  })

  const onSubmit = async (data: ClientFormData) => {
    try {
      setLoading(true)

      const clientData = {
        ...data,
        photo_url: photoUrl || null,
        company_id: company!.id,
        birth_date: data.birth_date || null,
        notes: data.notes || null,
      }

      if (isEditing && initialData?.id) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', initialData.id)
          .eq('company_id', company!.id)

        if (error) throw error
        toast.success('Cliente atualizado com sucesso!')
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([clientData])

        if (error) throw error
        toast.success('Cliente cadastrado com sucesso!')
      }

      router.push('/clients')
    } catch (error: any) {
      console.error('Erro ao salvar cliente:', error)
      toast.error(error.message || 'Erro ao salvar cliente')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `clients/${company!.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath)

      setPhotoUrl(data.publicUrl)
      toast.success('Foto carregada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao fazer upload da foto:', error)
      toast.error('Erro ao carregar foto')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Photo Upload */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto do Cliente
              </label>
              <ImageUpload
                currentImage={photoUrl}
                onUpload={handlePhotoUpload}
                onRemove={() => setPhotoUrl('')}
              />
            </div>

            {/* Name */}
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome Completo *
              </label>
              <input
                type="text"
                id="name"
                {...register('name')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Digite o nome completo"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                type="email"
                id="email"
                {...register('email')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="email@exemplo.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefone *
              </label>
              <input
                type="tel"
                id="phone"
                {...register('phone')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="(11) 99999-9999"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Birth Date */}
            <div>
              <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
                Data de Nascimento
              </label>
              <input
                type="date"
                id="birth_date"
                {...register('birth_date')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {errors.birth_date && (
                <p className="mt-1 text-sm text-red-600">{errors.birth_date.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Endereço *
              </label>
              <input
                type="text"
                id="address"
                {...register('address')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Rua, número, complemento"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                Cidade *
              </label>
              <input
                type="text"
                id="city"
                {...register('city')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Nome da cidade"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
              )}
            </div>

            {/* State */}
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                Estado *
              </label>
              <select
                id="state"
                {...register('state')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">Selecione o estado</option>
                <option value="AC">Acre</option>
                <option value="AL">Alagoas</option>
                <option value="AP">Amapá</option>
                <option value="AM">Amazonas</option>
                <option value="BA">Bahia</option>
                <option value="CE">Ceará</option>
                <option value="DF">Distrito Federal</option>
                <option value="ES">Espírito Santo</option>
                <option value="GO">Goiás</option>
                <option value="MA">Maranhão</option>
                <option value="MT">Mato Grosso</option>
                <option value="MS">Mato Grosso do Sul</option>
                <option value="MG">Minas Gerais</option>
                <option value="PA">Pará</option>
                <option value="PB">Paraíba</option>
                <option value="PR">Paraná</option>
                <option value="PE">Pernambuco</option>
                <option value="PI">Piauí</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="RN">Rio Grande do Norte</option>
                <option value="RS">Rio Grande do Sul</option>
                <option value="RO">Rondônia</option>
                <option value="RR">Roraima</option>
                <option value="SC">Santa Catarina</option>
                <option value="SP">São Paulo</option>
                <option value="SE">Sergipe</option>
                <option value="TO">Tocantins</option>
              </select>
              {errors.state && (
                <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
              )}
            </div>

            {/* ZIP Code */}
            <div>
              <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700">
                CEP *
              </label>
              <input
                type="text"
                id="zip_code"
                {...register('zip_code')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="00000-000"
                maxLength={9}
              />
              {errors.zip_code && (
                <p className="mt-1 text-sm text-red-600">{errors.zip_code.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Observações
              </label>
              <textarea
                id="notes"
                rows={3}
                {...register('notes')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Informações adicionais sobre o cliente..."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {isEditing ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
```

## ✅ Critérios de Aceitação

- [ ] CRUD completo de clientes implementado
- [ ] Listagem com filtros e busca funcionando
- [ ] Formulário de cadastro/edição validado
- [ ] Upload de foto implementado
- [ ] Soft delete (inativação) funcionando
- [ ] Visualização em grid e tabela
- [ ] Responsividade implementada
- [ ] Tratamento de erros adequado
- [ ] Validações client-side e server-side
- [ ] Integração com Supabase funcionando

## 🔄 Próximos Passos

Após completar esta fase:
1. **Fase 05**: Implementar gestão de pets
2. Criar página de detalhes do cliente
3. Implementar histórico de atividades

## 📝 Notas Importantes

- Implementar máscara para telefone e CEP
- Adicionar validação de CPF (opcional)
- Configurar backup automático de fotos
- Implementar busca avançada
- Otimizar queries para grandes volumes de dados
- Adicionar exportação de dados (CSV/PDF)

---

**Tempo estimado: 4-5 dias**  
**Complexidade: Média-Alta**  
**Dependências: Fase 03 concluída**