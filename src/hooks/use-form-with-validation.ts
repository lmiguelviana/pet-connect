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
}

export function useFormWithValidation<T extends FieldValues>(
  options: UseFormWithValidationOptions<T>
): UseFormWithValidationReturn<T> {
  const {
    schema,
    onSubmit: onSubmitCallback,
    successMessage = 'Operação realizada com sucesso!',
    errorMessage = 'Erro ao realizar operação',
    redirectTo,
    resetOnSuccess = false,
    ...formOptions
  } = options

  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<T>({
    resolver: zodResolver(schema),
    ...formOptions
  })

  const handleSubmit = form.handleSubmit(async (data: T) => {
    setIsSubmitting(true)
    
    try {
      await onSubmitCallback(data)
      
      toast.success(successMessage)
      
      if (resetOnSuccess) {
        form.reset()
      }
      
      if (redirectTo) {
        router.push(redirectTo)
      }
    } catch (error) {
      console.error('Form submission error:', error)
      
      const message = error instanceof Error ? error.message : errorMessage
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  })

  return {
    ...form,
    onSubmit: handleSubmit,
    isSubmitting
  }
}

// Hook para validação de campos individuais
export function useFieldValidation<T extends FieldValues>(
  schema: z.ZodSchema<T>,
  fieldName: Path<T>
) {
  const validateField = (value: any): string | undefined => {
    try {
      const fieldSchema = schema.shape[fieldName as keyof typeof schema.shape]
      if (fieldSchema) {
        fieldSchema.parse(value)
      }
      return undefined
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message
      }
      return 'Valor inválido'
    }
  }

  return { validateField }
}
