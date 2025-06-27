import { useCallback } from 'react'
import { toast as sonnerToast } from 'sonner'

interface ToastOptions {
  duration?: number
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  action?: {
    label: string
    onClick: () => void
  }
  cancel?: {
    label: string
    onClick?: () => void
  }
  onDismiss?: () => void
  onAutoClose?: () => void
}

export const useToast = () => {
  const success = useCallback((message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      action: options?.action,
      cancel: options?.cancel,
      onDismiss: options?.onDismiss,
      onAutoClose: options?.onAutoClose,
    })
  }, [])

  const error = useCallback((message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      duration: options?.duration || 6000,
      position: options?.position || 'top-right',
      action: options?.action,
      cancel: options?.cancel,
      onDismiss: options?.onDismiss,
      onAutoClose: options?.onAutoClose,
    })
  }, [])

  const info = useCallback((message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      action: options?.action,
      cancel: options?.cancel,
      onDismiss: options?.onDismiss,
      onAutoClose: options?.onAutoClose,
    })
  }, [])

  const warning = useCallback((message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      duration: options?.duration || 5000,
      position: options?.position || 'top-right',
      action: options?.action,
      cancel: options?.cancel,
      onDismiss: options?.onDismiss,
      onAutoClose: options?.onAutoClose,
    })
  }, [])

  const loading = useCallback((message: string, options?: Omit<ToastOptions, 'duration'>) => {
    return sonnerToast.loading(message, {
      position: options?.position || 'top-right',
      action: options?.action,
      cancel: options?.cancel,
      onDismiss: options?.onDismiss,
      onAutoClose: options?.onAutoClose,
    })
  }, [])

  const promise = useCallback(<T>(
    promise: Promise<T>,
    {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
      ...options
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    } & ToastOptions
  ) => {
    return sonnerToast.promise(promise, {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      action: options?.action,
      cancel: options?.cancel,
      onDismiss: options?.onDismiss,
      onAutoClose: options?.onAutoClose,
    })
  }, [])

  const dismiss = useCallback((toastId?: string | number) => {
    return sonnerToast.dismiss(toastId)
  }, [])

  return {
    success,
    error,
    info,
    warning,
    loading,
    promise,
    dismiss,
    toast: sonnerToast
  }
}
