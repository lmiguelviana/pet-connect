'use client'

import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Database, Key, Globe } from 'lucide-react'

export default function SetupGuide() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pet Connect - Configuração Inicial</h1>
          <p className="text-gray-600">Configure suas variáveis de ambiente para começar</p>
        </div>

        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            As variáveis de ambiente do Supabase não estão configuradas. Siga os passos abaixo para configurar seu projeto.
          </AlertDescription>
        </Alert>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-green-600" />
            Configuração do Supabase
          </h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">1. Crie um projeto no Supabase</h3>
              <p className="text-sm text-gray-600 mb-2">Acesse <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">supabase.com</a> e crie um novo projeto.</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">2. Configure as variáveis de ambiente</h3>
              <p className="text-sm text-gray-600 mb-3">Edite o arquivo <code className="bg-gray-200 px-1 rounded">.env.local</code> na raiz do projeto:</p>
              
              <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto">
                <div className="space-y-1">
                  <div>NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co</div>
                  <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui</div>
                  <div>SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">3. Onde encontrar as chaves</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>URL do projeto:</strong> Settings → API → Project URL</li>
                <li>• <strong>Anon key:</strong> Settings → API → Project API keys → anon public</li>
                <li>• <strong>Service role key:</strong> Settings → API → Project API keys → service_role</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-medium mb-2 text-green-800">4. Reinicie o servidor</h3>
              <p className="text-sm text-green-700">Após configurar as variáveis, reinicie o servidor de desenvolvimento:</p>
              <code className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm mt-1 block">npm run dev</code>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Próximos Passos
          </h2>
          
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Após a configuração, você poderá acessar o sistema de autenticação</p>
            <p>• Criar sua conta de pet shop</p>
            <p>• Começar a gerenciar clientes e pets</p>
            <p>• Configurar agendamentos e serviços</p>
          </div>
        </Card>
      </div>
    </div>
  )
}