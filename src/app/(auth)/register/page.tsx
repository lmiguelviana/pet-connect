'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companyEmail: '',
    phone: '',
    cnpj: '',
    address: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: Dados pessoais, 2: Dados da empresa
  const { signUp } = useAuth()
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNextStep = () => {
    if (step === 1) {
      // Validar dados pessoais
      if (!formData.ownerName || !formData.email || !formData.password) {
        setError('Preencha todos os campos obrigatórios')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem')
        return
      }
      if (formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres')
        return
      }
      setError('')
      setStep(2)
    }
  }

  const handlePrevStep = () => {
    setStep(1)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.companyName) {
      setError('Nome da empresa é obrigatório')
      setLoading(false)
      return
    }

    const { error } = await signUp(formData.email, formData.password, formData)
    
    if (error) {
      setError(error)
    } else {
      router.push('/dashboard?welcome=true')
    }
    
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Criar conta gratuita</h2>
        <p className="text-gray-600 mt-2">
          {step === 1 ? 'Seus dados pessoais' : 'Dados do seu pet shop'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex-1 h-2 rounded-full ${
            step >= 1 ? 'bg-primary-500' : 'bg-gray-200'
          }`} />
          <div className="mx-2 text-sm text-gray-500">1</div>
          <div className={`flex-1 h-2 rounded-full ${
            step >= 2 ? 'bg-primary-500' : 'bg-gray-200'
          }`} />
          <div className="mx-2 text-sm text-gray-500">2</div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === 1 ? (
        <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-6">
          <div>
            <Label htmlFor="ownerName">Seu nome completo *</Label>
            <Input
              id="ownerName"
              type="text"
              value={formData.ownerName}
              onChange={(e) => handleInputChange('ownerName', e.target.value)}
              required
              placeholder="João Silva"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              placeholder="joao@petshop.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Senha *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              placeholder="••••••••"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">Mínimo de 6 caracteres</p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar senha *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              required
              placeholder="••••••••"
              className="mt-1"
            />
          </div>

          <Button type="submit" className="w-full">
            Próximo
          </Button>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Já tem uma conta? Faça login
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="companyName">Nome do pet shop *</Label>
            <Input
              id="companyName"
              type="text"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              required
              placeholder="Pet Shop do João"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="companyEmail">Email da empresa</Label>
            <Input
              id="companyEmail"
              type="email"
              value={formData.companyEmail}
              onChange={(e) => handleInputChange('companyEmail', e.target.value)}
              placeholder="contato@petshop.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              type="text"
              value={formData.cnpj}
              onChange={(e) => handleInputChange('cnpj', e.target.value)}
              placeholder="00.000.000/0001-00"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Rua das Flores, 123 - Centro"
              className="mt-1"
            />
          </div>

          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}