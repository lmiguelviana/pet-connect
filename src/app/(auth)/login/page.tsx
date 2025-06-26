'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowRightIcon, EyeIcon, EyeOffIcon, SparklesIcon } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error)
    } else {
      router.push('/dashboard')
    }
    
    setLoading(false)
  }

  return (
    <div className="relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-50 -z-10" />
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary-200/30 to-transparent rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-primary-300/20 to-transparent rounded-full blur-3xl -z-10" />
      
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-6 shadow-lg">
          <SparklesIcon className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-3">
          Bem-vindo de volta
        </h1>
        <p className="text-gray-600 text-lg">
          Acesse sua conta e transforme seu pet shop
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-8 border-red-200 bg-red-50">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700 font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="seu@email.com"
            className="h-12 border-gray-200 focus:border-primary-500 focus:ring-primary-500/20 bg-white/50 backdrop-blur-sm transition-all duration-200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-700 font-medium">
            Senha
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="h-12 pr-12 border-gray-200 focus:border-primary-500 focus:ring-primary-500/20 bg-white/50 backdrop-blur-sm transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <EyeOffIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors"
            />
            <label htmlFor="remember-me" className="ml-3 text-sm text-gray-700 font-medium">
              Lembrar de mim
            </label>
          </div>

          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Esqueceu a senha?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
          disabled={loading}
        >
          <span className="flex items-center justify-center">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Entrando...
              </>
            ) : (
              <>
                Entrar na conta
                <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </span>
        </Button>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500 font-medium">Novo por aqui?</span>
          </div>
        </div>

        <div className="mt-6">
          <Link href="/register">
            <Button 
              variant="outline" 
              className="w-full h-12 border-2 border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-gray-700 font-semibold rounded-xl transition-all duration-200 group"
            >
              <span className="flex items-center justify-center">
                Criar conta gratuita
                <SparklesIcon className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
              </span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
