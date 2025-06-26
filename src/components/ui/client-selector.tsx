'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { ChevronDownIcon, UserIcon } from '@heroicons/react/24/outline'
import { Avatar } from './avatar'
import { Client } from '@/types/appointments'

interface ClientSelectorProps {
  value: string
  onChange: (clientId: string) => void
  disabled?: boolean
}

export function ClientSelector({ value, onChange, disabled = false }: ClientSelectorProps) {
  const { company } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  const selectedClient = clients.find(client => client.id === value)

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, phone, avatar_url')
        .eq('company_id', company!.id)
        .order('name')

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  )

  const handleSelect = (clientId: string) => {
    onChange(clientId)
    setIsOpen(false)
    setSearchTerm('')
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded-md"></div>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm
          ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {selectedClient ? (
          <div className="flex items-center space-x-3">
            <Avatar
              src={selectedClient.avatar_url}
              alt={selectedClient.name}
              fallback={selectedClient.name.charAt(0)}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedClient.name}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {selectedClient.email}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <UserIcon className="h-8 w-8 text-gray-400" />
            </div>
            <span className="text-gray-500">Selecione um cliente</span>
          </div>
        )}
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {/* Search Input */}
          <div className="sticky top-0 z-10 bg-white px-3 py-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
          </div>

          {/* Client List */}
          {filteredClients.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </div>
          ) : (
            filteredClients.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => handleSelect(client.id)}
                className={`
                  w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none
                  ${value === client.id ? 'bg-primary-50 text-primary-900' : 'text-gray-900'}
                `}
              >
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
              </button>
            ))
          )}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}