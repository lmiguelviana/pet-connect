'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  HeartIcon,
  CalendarIcon,
  ScaleIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { Database } from '@/types/database'

type Pet = Database['public']['Tables']['pets']['Row'] & {
  clients?: {
    id: string
    name: string
  }
}

interface PetCardProps {
  pet: Pet
  onDelete: (id: string) => void
  onRestore: (id: string) => void
  loading?: boolean
}

export default function PetCard({ pet, onDelete, onRestore, loading = false }: PetCardProps) {
  const [imageError, setImageError] = useState(false)

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null
    
    const birth = new Date(birthDate)
    const today = new Date()
    const ageInYears = (today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    
    if (ageInYears < 1) {
      const ageInMonths = Math.floor(ageInYears * 12)
      return `${ageInMonths} ${ageInMonths === 1 ? 'mês' : 'meses'}`
    }
    
    const years = Math.floor(ageInYears)
    return `${years} ${years === 1 ? 'ano' : 'anos'}`
  }

  const getSpeciesIcon = (species: string) => {
    switch (species) {
      case 'dog':
        return '🐕'
      case 'cat':
        return '🐱'
      case 'bird':
        return '🐦'
      case 'rabbit':
        return '🐰'
      default:
        return '🐾'
    }
  }

  const getSpeciesLabel = (species: string) => {
    switch (species) {
      case 'dog':
        return 'Cão'
      case 'cat':
        return 'Gato'
      case 'bird':
        return 'Ave'
      case 'rabbit':
        return 'Coelho'
      default:
        return 'Outro'
    }
  }

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'Macho'
      case 'female':
        return 'Fêmea'
      default:
        return 'N/I'
    }
  }

  const getSizeLabel = (size: string) => {
    switch (size) {
      case 'small':
        return 'Pequeno'
      case 'medium':
        return 'Médio'
      case 'large':
        return 'Grande'
      case 'extra_large':
        return 'Extra Grande'
      default:
        return 'N/I'
    }
  }

  const age = calculateAge(pet.birth_date)

  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${
      pet.is_active ? 'bg-white' : 'bg-gray-50 opacity-75'
    }`}>
      {/* Header com foto e status */}
      <div className="relative">
        {/* Foto do pet */}
        <div className="aspect-w-16 aspect-h-9 bg-gray-200">
          {pet.avatar_url && !imageError ? (
            <img
              src={pet.avatar_url}
              alt={pet.name}
              className="w-full h-48 object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">{getSpeciesIcon(pet.species || 'other')}</div>
                <p className="text-sm text-gray-600">Sem foto</p>
              </div>
            </div>
          )}
        </div>

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            pet.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {pet.is_active ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        {/* Espécie badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-90 text-gray-800">
            {getSpeciesLabel(pet.species || 'other')}
          </span>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        {/* Nome e tutor */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {pet.name}
          </h3>
          {pet.clients && (
            <div className="flex items-center text-sm text-gray-600">
              <UserIcon className="h-4 w-4 mr-1" />
              <span>Tutor: {pet.clients.name}</span>
            </div>
          )}
        </div>

        {/* Informações básicas */}
        <div className="space-y-2 mb-4">
          {pet.breed && (
            <div className="flex items-center text-sm text-gray-600">
              <HeartIcon className="h-4 w-4 mr-2" />
              <span>{pet.breed} • {getGenderLabel(pet.gender || 'unknown')}</span>
            </div>
          )}
          
          {age && (
            <div className="flex items-center text-sm text-gray-600">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span>{age}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            {pet.weight && (
              <div className="flex items-center">
                <ScaleIcon className="h-4 w-4 mr-1" />
                <span>{pet.weight} kg</span>
              </div>
            )}
            
            {pet.size && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {getSizeLabel(pet.size)}
              </span>
            )}
          </div>
        </div>

        {/* Informações adicionais */}
        {(pet.color || pet.temperament) && (
          <div className="mb-4 space-y-1">
            {pet.color && (
              <p className="text-xs text-gray-500">
                <span className="font-medium">Cor:</span> {pet.color}
              </p>
            )}
            {pet.temperament && (
              <p className="text-xs text-gray-500 truncate" title={pet.temperament}>
                <span className="font-medium">Temperamento:</span> {pet.temperament}
              </p>
            )}
          </div>
        )}

        {/* Alertas médicos */}
        {(pet.allergies || pet.medications || pet.special_needs) && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800 font-medium mb-1">⚠️ Atenção Médica</p>
            {pet.allergies && (
              <p className="text-xs text-yellow-700">Alergias: {pet.allergies}</p>
            )}
            {pet.medications && (
              <p className="text-xs text-yellow-700">Medicamentos: {pet.medications}</p>
            )}
            {pet.special_needs && (
              <p className="text-xs text-yellow-700">Necessidades especiais: {pet.special_needs}</p>
            )}
          </div>
        )}

        {/* Data de cadastro */}
        <div className="text-xs text-gray-400 mb-4">
          Cadastrado em {new Date(pet.created_at).toLocaleDateString('pt-BR')}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Link href={`/pets/${pet.id}`}>
            <Button variant="outline" size="sm" className="flex-1 mr-2">
              <PencilIcon className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </Link>
          
          {pet.is_active ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(pet.id)}
              disabled={loading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRestore(pet.id)}
              disabled={loading}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}