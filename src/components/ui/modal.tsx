import React from 'react'
import { X } from 'lucide-react'
import { Button } from './button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string | React.ReactNode
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true 
}: ModalProps) {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={`relative w-full ${sizeClasses[size]} transform overflow-hidden rounded-lg bg-white shadow-xl transition-all`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex-1">
              {typeof title === 'string' ? (
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              ) : (
                title
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 ml-4"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Content */}
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook para controlar modais
export function useModal() {
  const [isOpen, setIsOpen] = React.useState(false)
  
  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)
  
  return {
    isOpen,
    openModal,
    closeModal
  }
}