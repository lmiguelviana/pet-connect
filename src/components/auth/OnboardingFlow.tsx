'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Card } from '@/components/UI/Card';
import { Alert } from '@/components/UI/Alert';

interface OnboardingData {
  userName: string;
  companyName: string;
  companyEmail?: string;
}

interface SetupResponse {
  success: boolean;
  company_id?: string;
  user_id?: string;
  error?: string;
}

export function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OnboardingData>({
    userName: '',
    companyName: '',
    companyEmail: ''
  });
  
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateStep1 = () => {
    if (!formData.userName.trim()) {
      setError('Nome é obrigatório');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.companyName.trim()) {
      setError('Nome da empresa é obrigatório');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user?.email) {
      setError('Usuário não autenticado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Chamar a função RPC para criar usuário e empresa
      const { data, error: rpcError } = await supabase
        .rpc('create_initial_user_and_company', {
          user_email: user.email,
          user_name: formData.userName,
          company_name: formData.companyName,
          company_email: formData.companyEmail || user.email
        });

      if (rpcError) {
        console.error('Erro RPC:', rpcError);
        setError(`Erro ao criar empresa: ${rpcError.message}`);
        return;
      }

      // Verificar resposta da função
      const response = data as SetupResponse;
      
      if (!response.success) {
        setError(response.error || 'Erro desconhecido ao criar empresa');
        return;
      }

      // Sucesso! Atualizar contexto de autenticação
      await refreshUser();
      
      // Redirecionar para dashboard
      router.push('/dashboard');
      
    } catch (err) {
      console.error('Erro no onboarding:', err);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Bem-vindo ao Pet Connect!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Vamos configurar sua conta em alguns passos simples
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 1 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            1
          </div>
          <div className={`w-16 h-1 ${
            step >= 2 ? 'bg-green-500' : 'bg-gray-200'
          }`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 2 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            2
          </div>
        </div>

        <Card className="p-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              {error}
            </Alert>
          )}

          {/* Step 1: Dados Pessoais */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Seus dados pessoais
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Email já confirmado na autenticação
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
                      Seu nome completo *
                    </label>
                    <Input
                      id="userName"
                      type="text"
                      value={formData.userName}
                      onChange={(e) => handleInputChange('userName', e.target.value)}
                      placeholder="Digite seu nome completo"
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleNext}
                className="w-full"
                disabled={!formData.userName.trim()}
              >
                Próximo
              </Button>
            </div>
          )}

          {/* Step 2: Dados da Empresa */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Dados da sua empresa
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                      Nome da empresa/pet shop *
                    </label>
                    <Input
                      id="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="Ex: Pet Shop do João"
                      className="mt-1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">
                      Email da empresa (opcional)
                    </label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={formData.companyEmail}
                      onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                      placeholder="contato@petshop.com"
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Se não informado, usaremos seu email pessoal
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <Button 
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={loading}
                >
                  Voltar
                </Button>
                
                <Button 
                  onClick={handleNext}
                  className="flex-1"
                  disabled={!formData.companyName.trim() || loading}
                  loading={loading}
                >
                  {loading ? 'Criando...' : 'Finalizar'}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Ao continuar, você concorda com nossos{' '}
            <a href="/termos" className="text-green-600 hover:text-green-500">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="/privacidade" className="text-green-600 hover:text-green-500">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default OnboardingFlow;