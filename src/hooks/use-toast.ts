import { toast } from 'sonner'

export interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
}

export interface UseToastReturn {
  toast: (options: ToastOptions) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

export function useToast(): UseToastReturn {
  return {
    toast: ({ title, description, variant = 'default' }: ToastOptions) => {
      if (variant === 'destructive') {
        toast.error(title || description || 'Erro')
      } else if (variant === 'success') {
        toast.success(title || description || 'Sucesso')
      } else {
        toast(title || description || 'Informação')
      }
    },
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    info: (message: string) => toast(message)
  }
}