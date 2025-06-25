import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-900 mb-6">
            🐾 Pet Connect
          </h1>
          <p className="text-xl md:text-2xl text-primary-700 mb-8 max-w-3xl mx-auto">
            Sistema completo de gestão para pet shops modernos
          </p>
          
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-800">
                🚀 Projeto em Desenvolvimento
              </CardTitle>
              <CardDescription className="text-lg">
                Estamos construindo a melhor solução para gestão de pet shops do Brasil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-left mb-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-primary-600">✅ Fase 1 - Setup Completo</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Next.js 14 + TypeScript</li>
                    <li>• Tailwind CSS + Design System</li>
                    <li>• Supabase SSR</li>
                    <li>• Estrutura de pastas</li>
                    <li>• Componentes UI base</li>
                    <li>• ESLint + Prettier</li>
                  </ul>
                </div>
              
                 <div className="space-y-2">
                   <h3 className="font-semibold text-orange-600">🔄 Próximas Fases</h3>
                   <ul className="text-sm text-gray-600 space-y-1">
                     <li>• Sistema de Autenticação</li>
                     <li>• Dashboard Principal</li>
                     <li>• Gestão de Clientes</li>
                     <li>• Gestão de Pets</li>
                   </ul>
                 </div>
               </div>
               
               <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                 <p className="text-sm text-primary-700">
                   <strong>Status:</strong> Fase 01 - Setup Completo ✅
                 </p>
               </div>
               
               <div className="flex gap-4 justify-center">
                 <Button className="bg-primary-600 hover:bg-primary-700">
                   Ver Documentação
                 </Button>
                 <Button variant="outline" className="border-primary-600 text-primary-600 hover:bg-primary-50">
                   GitHub
                 </Button>
               </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  )
}