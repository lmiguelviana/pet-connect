'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { ChevronDownIcon, HeartIcon } from '@heroicons/react/24/outline'
import { Avatar } from './avatar'
import { Pet } from '@/types/appointments'

interface PetSelectorProps {
  clientId: string
  value?: string
  onChange: (petId: string) => void
  disabled?: boolean
}

export function PetSelector({ clientId, value, onChange, disabled = false }: PetSelectorProps) {
  const { company } = useAuth()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  const selectedPet = pets.find(pet => pet.id === value)

  useEffect(() => {
    if (clientId) {
      loadPets()
    } else {
      setPets([])
      onChange('')
    }
  }, [clientId])

  const loadPets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pets')
        .select('id, name, species, breed, age, avatar_url')
        .eq('client_id', clientId)
        .eq('company_id', company!.id)
        .order('name')

      if (error) throw error
      setPets(data || [])
    } catch (error) {
      console.error('Erro ao carregar pets:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPets = pets.filter(pet =>
    pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pet.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pet.breed && pet.breed.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSelect = (petId: string) => {
    onChange(petId)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    onChange('')
    setIsOpen(false)
  }

  if (!clientId) {
    return (
      <div className="relative">
        <div className="w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-not-allowed">
          <span className="text-gray-400">Selecione um cliente primeiro</span>
        </div>
      </div>
    )
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
        {selectedPet ? (
          <div className="flex items-center space-x-3">
            <Avatar
              src={selectedPet.avatar_url}
              alt={selectedPet.name}
              fallback={selectedPet.name.charAt(0)}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedPet.name}
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" size="sm">
                  {selectedPet.species}
                </Badge>
                {selectedPet.breed && (
                  <span className="text-xs text-gray-500">
                    {selectedPet.breed}
                  </span>
                )}
                {selectedPet.age && (
                  <span className="text-xs text-gray-500">
                    {selectedPet.age} anos
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-500">
            {pets.length === 0 ? 'Nenhum pet cadastrado' : 'Selecione um pet (opcional)'}
          </span>
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
              placeholder="Buscar pet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
          </div>

          {/* Clear Selection Option */}
          <button
            type="button"
            onClick={handleClear}
            className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-gray-600 border-b border-gray-100"
          >
            <span className="text-sm">Nenhum pet selecionado</span>
          </button>

          {/* Pet List */}
          {filteredPets.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchTerm ? 'Nenhum pet encontrado' : 'Nenhum pet cadastrado para este cliente'}
            </div>
          ) : (
            filteredPets.map((pet) => (
              <button
                key={pet.id}
                type="button"
                onClick={() => handleSelect(pet.id)}
                className={`
                  w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none
                  ${value === pet.id ? 'bg-primary-50 text-primary-900' : 'text-gray-900'}
                `}
              >
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={pet.avatar_url}
                    alt={pet.name}
                    fallback={pet.name.charAt(0)}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {pet.name}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" size="sm">
                        {pet.species}
                      </Badge>
                      {pet.breed && (
                        <span className="text-xs text-gray-500">
                          {pet.breed}
                        </span>
                      )}
                      {pet.age && (
                        <span className="text-xs text-gray-500">
                          {pet.age} anos
                        </span>
                      )}
                    </div>
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