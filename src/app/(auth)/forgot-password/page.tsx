'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email) {
      setError('Digite seu email')
      setLoading(false)
      return
    }

    const { error } = await resetPassword(email)
    
    if (error) {
      setError(error)
    } else {
      setSuccess(true)
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email enviado!</h2>
          <p className="text-gray-600 mb-6">
            Enviamos um link de recuperação para <strong>{email}</strong>
          </p>
          
          <Alert className="mb-6">
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Verifique sua caixa de entrada e clique no link para redefinir sua senha.
            </AlertDescription>
          </Alert>
          
          <p className="text-sm text-gray-500 mb-6">
            Não recebeu o email? Verifique sua caixa de spam ou tente novamente.
          </p>
          
          <Button
            variant="outline"
            onClick={() => setSuccess(false)}
            className="w-full mb-4"
          >
            Tentar outro email
          </Button>
          
          <Link href="/auth/login">
            <Button variant="ghost" className="w-full">
              Voltar para o login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Esqueceu sua senha?</h2>
        <p className="text-gray-600 mt-2">
          Digite seu email e enviaremos um link para redefinir sua senha
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            className="mt-1"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Enviando...' : 'Enviar link de recuperação'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/auth/login"
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Voltar para o login
        </Link>
      </div>
    </div>
  )
}