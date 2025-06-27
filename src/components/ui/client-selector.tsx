'use client'

import { UserIcon } from '@heroicons/react/24/outline'
import { Avatar } from './avatar'
import { GenericSelector } from './generic-selector'
import { useSupabaseTable } from '@/hooks/use-supabase-query'
import { Client } from '@/types/appointments'

interface ClientSelectorProps {
  value: string
  onChange: (clientId: string) => void
  disabled?: boolean
}

export function ClientSelector({ value, onChange, disabled = false }: ClientSelectorProps) {
  const { data: clients, loading } = useSupabaseTable<Client>(
    'clients',
    'id, name, email, phone, avatar_url',
    {},
    { column: 'name', ascending: true }
  )

  const getLabel = (client: Client) => client.name
  
  const getSearchFields = (client: Client) => [
    client.name,
    client.email,
    client.phone || ''
   ]

  const renderItem = (client: Client) => (
    <div className="flex items-center space-x-3">
      <Avatar
        src={client.avatar_url}
        alt={client.name}
        fallback={client.name.charAt(0)}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {client.name}
        </p>
        <p className="text-sm text-gray-500 truncate">
          {client.email}
        </p>
        <p className="text-xs text-gray-400">
          {client.phone}
        </p>
      </div>
    </div>
  )

  const renderSelected = (client: Client) => (
    <div className="flex items-center space-x-3">
      <Avatar
        src={client.avatar_url}
        alt={client.name}
        fallback={client.name.charAt(0)}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {client.name}
        </p>
        <p className="text-sm text-gray-500 truncate">
          {client.email}
        </p>
      </div>
    </div>
  )

  return (
    <GenericSelector
      items={clients || []}
      value={value}
      onChange={onChange}
      getLabel={getLabel}
      getSearchFields={getSearchFields}
      renderItem={renderItem}
      renderSelected={renderSelected}
      placeholder="Selecione um cliente"
      disabled={disabled}
      loading={loading}
      emptyMessage="Nenhum cliente encontrado"
      searchPlaceholder="Buscar cliente..."
      allowClear
      icon={<UserIcon className="h-5 w-5" />}
    />
  )
}