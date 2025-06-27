import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Avatar } from './avatar'
import { Badge } from './badge'

interface GenericSelectorProps<T> {
  items: T[]
  value?: string
  onChange: (id: string) => void
  getLabel: (item: T) => string
  getSearchFields: (item: T) => string[]
  renderItem?: (item: T) => React.ReactNode
  renderSelected?: (item: T) => React.ReactNode
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  emptyMessage?: string
  searchPlaceholder?: string
  allowClear?: boolean
  groupBy?: (item: T) => string
  icon?: React.ReactNode
}

export function GenericSelector<T extends { id: string }>({
  items,
  value,
  onChange,
  getLabel,
  getSearchFields,
  renderItem,
  renderSelected,
  placeholder = 'Selecione uma opção',
  disabled = false,
  loading = false,
  emptyMessage = 'Nenhum item encontrado',
  searchPlaceholder = 'Buscar...',
  allowClear = false,
  groupBy,
  icon
}: GenericSelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectedItem = items.find(item => item.id === value)

  // Filtrar itens baseado no termo de busca
  const filteredItems = items.filter(item => {
    if (!searchTerm) return true
    const searchFields = getSearchFields(item)
    return searchFields.some(field => 
      field.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  // Agrupar itens se necessário
  const groupedItems = groupBy 
    ? filteredItems.reduce((groups, item) => {
        const group = groupBy(item)
        if (!groups[group]) {
          groups[group] = []
        }
        groups[group].push(item)
        return groups
      }, {} as Record<string, T[]>)
    : { '': filteredItems }

  const handleSelect = (itemId: string) => {
    onChange(itemId)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setIsOpen(false)
  }

  const handleToggle = () => {
    if (disabled || loading) return
    setIsOpen(!isOpen)
  }

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focar no input de busca quando abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded-md"></div>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm
          ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
          ${isOpen ? 'ring-1 ring-primary-500 border-primary-500' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {icon && (
              <div className="flex-shrink-0 text-gray-400">
                {icon}
              </div>
            )}
            {selectedItem ? (
              renderSelected ? renderSelected(selectedItem) : (
                <span className="block truncate">{getLabel(selectedItem)}</span>
              )
            ) : (
              <span className="block truncate text-gray-500">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {allowClear && selectedItem && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <ChevronDownIcon 
              className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                isOpen ? 'transform rotate-180' : ''
              }`} 
            />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {/* Campo de busca */}
          <div className="sticky top-0 z-10 bg-white px-3 py-2 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Lista de itens */}
          <div className="max-h-48 overflow-auto">
            {Object.keys(groupedItems).length === 0 || filteredItems.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-center">
                {emptyMessage}
              </div>
            ) : (
              Object.entries(groupedItems).map(([groupName, groupItems]) => (
                <div key={groupName}>
                  {groupName && (
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                      {groupName}
                    </div>
                  )}
                  {groupItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      className={`
                        w-full text-left px-3 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100
                        ${selectedItem?.id === item.id ? 'bg-primary-50 text-primary-600' : 'text-gray-900'}
                      `}
                    >
                      {renderItem ? renderItem(item) : (
                        <span className="block truncate">{getLabel(item)}</span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}