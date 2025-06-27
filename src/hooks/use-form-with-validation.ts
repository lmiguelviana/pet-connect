import { useForm, UseFormProps, UseFormReturn, FieldValues, Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface UseFormWithValidationOptions<T extends FieldValues> extends UseFormProps<T> {
  schema: z.ZodSchema<T>
  onSubmit: (data: T) => Promise<void> | void
  successMessage?: string
  errorMessage?: string
  redirectTo?: string
  resetOnSuccess?: boolean
}

interface UseFormWithValidationReturn<T extends FieldValues> extends UseFormReturn<T> {
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>
  isSubmitting: boolean
  submitError: string | null
}

export function useFormWithValidation<T extends FieldValues>({
  schema,
  onSubmit: onSubmitCallback,
  successMessage = 'Dados salvos com sucesso!',
  errorMessage,
  redirectTo,
  resetOnSuccess = false,
  ...formOptions
}: UseFormWithValidationOptions<T>): UseFormWithValidationReturn<T> {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm<T>({
    resolver: zodResolver(schema),
    ...formOptions
  })

  const handleSubmit = form.handleSubmit(async (data: T) => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)
      
      await onSubmitCallback(data)
      
      toast.success(successMessage)
      
      if (resetOnSuccess) {
        form.reset()
      }
      
      if (redirectTo) {
        router.push(redirectTo)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : (errorMessage || 'Erro ao salvar dados')
      setSubmitError(message)
      toast.error(message)
      console.error('Erro no formulário:', error)
    } finally {
      setIsSubmitting(false)
    }
  })

  return {
    ...form,
    onSubmit: handleSubmit,
    isSubmitting,
    submitError
  }
}

// Hook específico para formulários de criação
export function useCreateForm<T extends FieldValues>({
  schema,
  onSubmit,
  entityName,
  redirectTo,
  ...options
}: Omit<UseFormWithValidationOptions<T>, 'successMessage'> & {
  entityName: string
}) {
  return useFormWithValidation({
    schema,
    onSubmit,
    successMessage: `${entityName} criado com sucesso!`,
    errorMessage: `Erro ao criar ${entityName.toLowerCase()}`,
    redirectTo,
    resetOnSuccess: true,
    ...options
  })
}

// Hook específico para formulários de edição
export function useEditForm<T extends FieldValues>({
  schema,
  onSubmit,
  entityName,
  redirectTo,
  ...options
}: Omit<UseFormWithValidationOptions<T>, 'successMessage'> & {
  entityName: string
}) {
  return useFormWithValidation({
    schema,
    onSubmit,
    successMessage: `${entityName} atualizado com sucesso!`,
    errorMessage: `Erro ao atualizar ${entityName.toLowerCase()}`,
    redirectTo,
    resetOnSuccess: false,
    ...options
  })
}

// Utilitário para criar schemas de validação comuns
export const commonSchemas = {
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  required: (message = 'Campo obrigatório') => z.string().min(1, message),
  optionalString: z.string().optional(),
  positiveNumber: z.number().positive('Deve ser um número positivo'),
  currency: z.number().min(0, 'Valor deve ser positivo'),
  date: z.date({ required_error: 'Data é obrigatória' }),
  optionalDate: z.date().optional(),
}

// Schema específico para serviços
export const serviceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  category: z.enum(['banho', 'tosa', 'veterinario', 'hotel', 'adestramento', 'outros'], {
    required_error: 'Categoria é obrigatória'
  }),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  duration_minutes: z.number().min(1, 'Duração deve ser maior que zero'),
  max_pets_per_session: z.number().min(1, 'Número máximo de pets deve ser maior que zero'),
  available_days: z.array(z.string()).min(1, 'Selecione pelo menos um dia da semana'),
  available_hours: z.object({
    start: z.string().min(1, 'Horário de início é obrigatório'),
    end: z.string().min(1, 'Horário de fim é obrigatório')
  }).refine(
    (data) => data.start < data.end,
    {
      message: 'Horário de início deve ser anterior ao horário de fim',
      path: ['start']
    }
  ),
  color: z.string().optional(),
  is_active: z.boolean().default(true),
  requires_appointment: z.boolean().default(true),
  photos: z.array(z.any()).optional()
})



// Utilitário para validação de campos específicos do Pet Connect
export const petConnectSchemas = {
  petName: z.string().min(1, 'Nome do pet é obrigatório'),
  clientName: z.string().min(2, 'Nome do cliente deve ter pelo menos 2 caracteres'),
  species: z.enum(['dog', 'cat', 'bird', 'other'], {
    required_error: 'Espécie é obrigatória'
  }),
  weight: z.number().min(0.1, 'Peso deve ser maior que 0').max(200, 'Peso muito alto'),
  age: z.number().min(0, 'Idade não pode ser negativa').max(50, 'Idade muito alta'),
  serviceType: z.string().min(1, 'Tipo de serviço é obrigatório'),
  appointmentDate: z.date().refine(
    (date) => date > new Date(),
    'Data deve ser no futuro'
  ),
  price: z.number().min(0, 'Preço deve ser positivo').max(10000, 'Preço muito alto')
}

// Função helper para criar mensagens de erro personalizadas
export function createFieldError<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldName: Path<T>
) {
  const error = form.formState.errors[fieldName]
  return error?.message as string | undefined
}

// Função helper para verificar se um campo tem erro
export function hasFieldError<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldName: Path<T>
): boolean {
  return !!form.formState.errors[fieldName]
}