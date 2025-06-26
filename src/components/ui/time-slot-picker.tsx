'use client'

import { useState } from 'react'
import { ChevronDownIcon, ClockIcon } from '@heroicons/react/24/outline'

interface TimeSlotPickerProps {
  availableSlots: string[]
  selectedSlot?: string
  onSlotSelect: (slot: string) => void
  disabled?: boolean
}

export function TimeSlotPicker({
  availableSlots,
  selectedSlot,
  onSlotSelect,
  disabled = false
}: TimeSlotPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (slot: string) => {
    onSlotSelect(slot)
    setIsOpen(false)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
  }

  const getTimeLabel = (time: string) => {
    const [hours] = time.split(':')
    const hour = parseInt(hours)
    
    if (hour < 12) {
      return 'Manhã'
    } else if (hour < 18) {
      return 'Tarde'
    } else {
      return 'Noite'
    }
  }

  // Group slots by period
  const groupedSlots = availableSlots.reduce((groups, slot) => {
    const period = getTimeLabel(slot)
    if (!groups[period]) {
      groups[period] = []
    }
    groups[period].push(slot)
    return groups
  }, {} as Record<string, string[]>)

  const periodOrder = ['Manhã', 'Tarde', 'Noite']
  const sortedPeriods = periodOrder.filter(period => groupedSlots[period])

  if (disabled) {
    return (
      <div className="relative">
        <div className="w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-not-allowed">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4 text-gray-400" />
            <span className="text-gray-400">
              Selecione uma data e serviço primeiro
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
      >
        {selectedSlot ? (
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4 text-gray-500" />
            <span className="text-gray-900">
              {formatTime(selectedSlot)}
            </span>
            <span className="text-xs text-gray-500">
              ({getTimeLabel(selectedSlot)})
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">
              {availableSlots.length === 0 ? 'Nenhum horário disponível' : 'Selecione um horário'}
            </span>
          </div>
        )}
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {availableSlots.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              Nenhum horário disponível para esta data
            </div>
          ) : (
            <div className="space-y-1">
              {sortedPeriods.map((period) => (
                <div key={period}>
                  {/* Period Header */}
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                    {period}
                  </div>
                  
                  {/* Time Slots Grid */}
                  <div className="grid grid-cols-3 gap-1 p-2">
                    {groupedSlots[period].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => handleSelect(slot)}
                        className={`
                          px-3 py-2 text-sm rounded-md border transition-colors duration-150
                          ${
                            selectedSlot === slot
                              ? 'bg-primary-100 border-primary-300 text-primary-800'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                          }
                          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
                        `}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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