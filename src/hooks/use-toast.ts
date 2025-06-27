import { useCallback } from 'react'
import { toast as sonnerToast } from 'sonner'

interface ToastOptions {
  duration?: number
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  dismissible?: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

interface UseToastReturn {
  success: (message: string, options?: ToastOptions) => void
  error: (message: string, options?: ToastOptions) => void
  info: (message: string, options?: ToastOptions) => void
  warning: (message: string, options?: ToastOptions) => void
  loading: (message: string, options?: ToastOptions) => string | number
  dismiss: (toastId?: string | number) => void
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading?: string
      success?: string | ((data: T) => string)
      error?: string | ((error: any) => string)
    }
  ) => Promise<T>
}

export const useToast = (): UseToastReturn => {
  const success = useCallback((message: string, options?: ToastOptions) => {
    sonnerToast.success(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      dismissible: options?.dismissible !== false,
      action: options?.action
    })
  }, [])

  const error = useCallback((message: string, options?: ToastOptions) => {
    sonnerToast.error(message, {
      duration: options?.duration || 5000,
      position: options?.position || 'top-right',
      dismissible: options?.dismissible !== false,
      action: options?.action
    })
  }, [])

  const info = useCallback((message: string, options?: ToastOptions) => {
    sonnerToast.info(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      dismissible: options?.dismissible !== false,
      action: options?.action
    })
  }, [])

  const warning = useCallback((message: string, options?: ToastOptions) => {
    sonnerToast.warning(message, {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
      dismissible: options?.dismissible !== false,
      action: options?.action
    })
  }, [])

  const loading = useCallback((message: string, options?: ToastOptions) => {
    return sonnerToast.loading(message, {
      duration: options?.duration || Infinity,
      position: options?.position || 'top-right',
      dismissible: options?.dismissible !== false,
      action: options?.action
    })
  }, [])

  const dismiss = useCallback((toastId?: string | number) => {
    if (toastId) {
      sonnerToast.dismiss(toastId)
    } else {
      sonnerToast.dismiss()
    }
  }, [])

  const promise = useCallback(<T>(
    promise: Promise<T>,
    {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
    }: {
      loading?: string
      success?: string | ((data: T) => string)
      error?: string | ((error: any) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: loadingMessage || 'Carregando...',
      success: successMessage || 'Sucesso!',
      error: errorMessage || 'Erro!'
    })
  }, [])

  return {
    success,
    error,
    info,
    warning,
    loading,
    dismiss,
    promise
  }
}

// Hook específico para operações CRUD
export const useCRUDToast = () => {
  const toast = useToast()

  return {
    creating: (entity: string) => toast.loading(`Criando ${entity}...`),
    created: (entity: string) => toast.success(`${entity} criado com sucesso!`),
    updating: (entity: string) => toast.loading(`Atualizando ${entity}...`),
    updated: (entity: string) => toast.success(`${entity} atualizado com sucesso!`),
    deleting: (entity: string) => toast.loading(`Excluindo ${entity}...`),
    deleted: (entity: string) => toast.success(`${entity} excluído com sucesso!`),
    error: (message: string) => toast.error(message),
    dismiss: toast.dismiss
  }
}

// Hook específico para autenticação
export const useAuthToast = () => {
  const toast = useToast()

  return {
    loginSuccess: () => toast.success('Login realizado com sucesso!'),
    loginError: (message?: string) => toast.error(message || 'Erro ao fazer login'),
    logoutSuccess: () => toast.success('Logout realizado com sucesso!'),
    registerSuccess: () => toast.success('Conta criada com sucesso!'),
    registerError: (message?: string) => toast.error(message || 'Erro ao criar conta'),
    passwordResetSent: () => toast.success('Email de recuperação enviado!'),
    passwordResetError: () => toast.error('Erro ao enviar email de recuperação'),
    sessionExpired: () => toast.warning('Sessão expirada. Faça login novamente.'),
    unauthorized: () => toast.error('Acesso não autorizado')
  }
}

// Hook específico para upload de arquivos
export const useUploadToast = () => {
  const toast = useToast()

  return {
    uploading: (fileName: string) => toast.loading(`Enviando ${fileName}...`),
    uploaded: (fileName: string) => toast.success(`${fileName} enviado com sucesso!`),
    uploadError: (fileName: string, error?: string) => 
      toast.error(`Erro ao enviar ${fileName}: ${error || 'Erro desconhecido'}`),
    fileTooLarge: (maxSize: string) => 
      toast.error(`Arquivo muito grande. Tamanho máximo: ${maxSize}`),
    invalidFileType: (allowedTypes: string) => 
      toast.error(`Tipo de arquivo inválido. Tipos permitidos: ${allowedTypes}`),
    multipleUploaded: (count: number) => 
      toast.success(`${count} arquivos enviados com sucesso!`)
  }
}

// Hook específico para planos e assinaturas
export const usePlanToast = () => {
  const toast = useToast()

  return {
    upgradeSuccess: (planName: string) => 
      toast.success(`Plano atualizado para ${planName} com sucesso!`),
    upgradeError: (message?: string) => 
      toast.error(message || 'Erro ao atualizar plano'),
    downgradeSuccess: (planName: string) => 
      toast.success(`Plano alterado para ${planName}`),
    cancelSuccess: () => toast.success('Assinatura cancelada com sucesso'),
    cancelError: () => toast.error('Erro ao cancelar assinatura'),
    limitReached: (feature: string) => 
      toast.warning(`Limite do plano atingido para ${feature}. Considere fazer upgrade.`),
    trialExpired: () => 
      sonnerToast.warning('Seu período de teste expirou. Faça upgrade para continuar usando todas as funcionalidades.', {
        duration: 8000,
        action: {
          label: 'Fazer Upgrade',
          onClick: () => window.location.href = '/billing'
        }
      })
  }
}

// Hook específico para WhatsApp
export const useWhatsAppToast = () => {
  const toast = useToast()

  return {
    messageSent: (contact: string) => 
      toast.success(`Mensagem enviada para ${contact} via WhatsApp!`),
    messageError: (error?: string) => 
      toast.error(`Erro ao enviar mensagem: ${error || 'Erro desconhecido'}`),
    notConfigured: () => 
      sonnerToast.warning('WhatsApp não configurado. Configure nas configurações da empresa.', {
        duration: 6000,
        action: {
          label: 'Configurar',
          onClick: () => window.location.href = '/settings/whatsapp'
        }
      }),
    photosSent: (count: number, contact: string) => 
      toast.success(`${count} fotos enviadas para ${contact} via WhatsApp!`)
  }
}

// Hook específico para validação de formulários
export const useFormToast = () => {
  const toast = useToast()

  return {
    validationError: (field: string) => 
      toast.error(`Por favor, verifique o campo: ${field}`),
    requiredField: (field: string) => 
      toast.error(`O campo ${field} é obrigatório`),
    invalidFormat: (field: string, format: string) => 
      toast.error(`${field} deve estar no formato: ${format}`),
    saveSuccess: () => toast.success('Dados salvos com sucesso!'),
    saveError: (message?: string) => 
      toast.error(message || 'Erro ao salvar dados')
  }
}

export default useToast