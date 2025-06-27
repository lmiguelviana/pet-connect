import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckIcon, StarIcon, HeartIcon, CalendarIcon, CameraIcon, DollarSignIcon, SparklesIcon, ArrowRightIcon, PlayIcon } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🐾</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                Pet Connect
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button variant="ghost" className="hover:bg-primary-50">Entrar</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all duration-200">
                  Começar Grátis
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-primary-50/30 to-primary-100/50 py-24 lg:py-32">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary-400/20 to-primary-600/20 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-primary-200/50 rounded-full px-4 py-2 mb-8 shadow-lg">
              <SparklesIcon className="h-4 w-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">Novo: Sistema de fotos automático</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Transforme seu{' '}
              <span className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 bg-clip-text text-transparent">
                Pet Shop
              </span>
              <br />
              em um negócio digital
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
              Sistema completo de gestão para pet shops modernos. Gerencie clientes, pets, 
              agendamentos e muito mais em uma plataforma intuitiva e poderosa.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-4">
                  Começar Grátis Agora
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-2 border-gray-300 hover:border-primary-300 hover:bg-primary-50 text-lg px-8 py-4 transition-all duration-300">
                <PlayIcon className="mr-2 h-5 w-5" />
                Ver Demo
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>30 dias grátis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>Suporte incluído</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-primary-100/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <SparklesIcon className="h-4 w-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">Recursos Exclusivos</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Por que escolher o{' '}
              <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                Pet Connect?
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Desenvolvido especialmente para pet shops que querem crescer e se destacar no mercado digital
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group relative p-8 hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-primary-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <CalendarIcon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Agendamento Inteligente</h3>
                <p className="text-gray-600 leading-relaxed">
                  Sistema de agendamento automático com notificações por WhatsApp e email. 
                  Reduza faltas e otimize sua agenda com IA.
                </p>
              </div>
            </Card>
            
            <Card className="group relative p-8 hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-primary-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <HeartIcon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Gestão de Clientes</h3>
                <p className="text-gray-600 leading-relaxed">
                  Cadastro completo de clientes e pets com histórico de serviços, 
                  preferências e informações importantes em tempo real.
                </p>
              </div>
            </Card>
            
            <Card className="group relative p-8 hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-primary-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <CameraIcon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Sistema de Fotos</h3>
                <p className="text-gray-600 leading-relaxed">
                  Compartilhe momentos especiais com os tutores através de 
                  galeria automática e notificações instantâneas.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50/50 to-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-slate-100/50 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-primary-100/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <DollarSignIcon className="h-4 w-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">Preços Transparentes</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Planos que{' '}
              <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                cabem no seu orçamento
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Escolha o plano ideal para o seu pet shop e comece a transformar seu negócio hoje mesmo
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 justify-center">
            {/* Plano Gratuito */}
            <Card className="group relative p-8 hover:shadow-2xl transition-all duration-500 border-2 border-gray-200 hover:border-primary-300 bg-white text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl mb-6 shadow-lg mx-auto">
                  <StarIcon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl mb-2">Gratuito</CardTitle>
                <CardDescription className="mb-4">Perfeito para começar</CardDescription>
                <div className="text-4xl font-bold mb-8">R$ 0<span className="text-lg font-normal">/mês</span></div>
                <ul className="space-y-4 mb-10 mx-auto text-left">
                  <li className="flex items-center justify-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <CheckIcon className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-base text-gray-700">Até 20 clientes</span>
                  </li>
                  <li className="flex items-center justify-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <CheckIcon className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-base text-gray-700">Até 30 pets</span>
                  </li>
                  <li className="flex items-center justify-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <CheckIcon className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-base text-gray-700">1 usuário</span>
                  </li>
                  <li className="flex items-center justify-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <CheckIcon className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-base text-gray-700">Agendamentos básicos</span>
                  </li>
                  <li className="flex items-center justify-center">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <CheckIcon className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-base text-gray-700">Suporte por email</span>
                  </li>
                </ul>
                
                <Link href="/register?plan=free">
                  <Button variant="outline" className="w-full py-3 text-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300">
                    Começar Grátis
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Plano Básico */}
            

            {/* Plano Premium */}
            <Card className="group relative p-8 hover:shadow-2xl transition-all duration-500 border-2 border-primary-300 bg-gradient-to-br from-white to-primary-50/30 hover:-translate-y-2 text-center">
              
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-primary-600/20 rounded-lg opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
              
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-6 shadow-xl mx-auto">
                  <StarIcon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl mb-2 text-gray-900">Premium</CardTitle>
                <CardDescription className="mb-4 text-gray-600">Para pet shops em crescimento</CardDescription>
                <div className="text-4xl font-bold mb-2 text-gray-900">
                  R$ 39,90<span className="text-lg font-normal text-gray-600">/mês</span>
                </div>
                <p className="text-sm text-primary-600 font-medium mb-8">30 dias grátis para testar</p>
                
                <ul className="space-y-4 mb-10 mx-auto text-left">
                  <li className="flex items-center justify-center">
                    <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <CheckIcon className="h-3 w-3 text-primary-600" />
                    </div>
                    <span className="text-base text-gray-700 font-medium">Clientes ilimitados</span>
                  </li>
                  <li className="flex items-center justify-center">
                    <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <CheckIcon className="h-3 w-3 text-primary-600" />
                    </div>
                    <span className="text-base text-gray-700 font-medium">Pets ilimitados</span>
                  </li>
                  <li className="flex items-center justify-center">
                    <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <CheckIcon className="h-3 w-3 text-primary-600" />
                    </div>
                    <span className="text-base text-gray-700 font-medium">Usuários ilimitados</span>
                  </li>
                  <li className="flex items-center justify-center">
                    <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <CheckIcon className="h-3 w-3 text-primary-600" />
                    </div>
                    <span className="text-base text-gray-700 font-medium">Todas as funcionalidades avançadas</span>
                  </li>
                  <li className="flex items-center justify-center">
                    <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <CheckIcon className="h-3 w-3 text-primary-600" />
                    </div>
                    <span className="text-base text-gray-700 font-medium">Upload de fotos ilimitado</span>
                  </li>
                  <li className="flex items-center justify-center">
                    <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <CheckIcon className="h-3 w-3 text-primary-600" />
                    </div>
                    <span className="text-base text-gray-700 font-medium">Relatórios completos</span>
                  </li>
                  <li className="flex items-center justify-center">
                    <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <CheckIcon className="h-3 w-3 text-primary-600" />
                    </div>
                    <span className="text-base text-gray-700 font-medium">WhatsApp automático</span>
                  </li>
                </ul>
                
                <Link href="/register?plan=premium">
                  <Button className="w-full py-3 text-lg bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-xl hover:shadow-2xl transition-all duration-300">
                    Começar Teste Grátis
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] -z-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
            <SparklesIcon className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">Transformação Digital</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Pronto para{' '}
            <span className="bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent">
              transformar
            </span>
            <br />
            seu pet shop?
          </h2>
          
          <p className="text-xl md:text-2xl text-primary-100 mb-12 max-w-4xl mx-auto leading-relaxed">
            Junte-se a centenas de pet shops que já estão usando o Pet Connect 
            para revolucionar seus negócios e encantar seus clientes
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Link href="/register">
              <Button size="lg" className="bg-white text-primary-700 hover:bg-gray-50 shadow-2xl hover:shadow-3xl transition-all duration-300 text-lg px-10 py-4 font-bold">
                Começar Grátis Agora
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-2 border-white/50 text-white hover:bg-white/10 backdrop-blur-sm text-lg px-10 py-4 transition-all duration-300">
              <PlayIcon className="mr-2 h-5 w-5" />
              Ver Demonstração
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-primary-100">
            <div className="flex items-center gap-2">
              <CheckIcon className="h-5 w-5" />
              <span>Setup em 5 minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="h-5 w-5" />
              <span>Suporte especializado</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="h-5 w-5" />
              <span>Sem compromisso</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,white,transparent)] -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🐾</span>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Pet Connect
                </h3>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                Transformando pet shops em negócios digitais modernos, eficientes e lucrativos.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors duration-300 cursor-pointer">
                  <span className="text-sm">📧</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors duration-300 cursor-pointer">
                  <span className="text-sm">📱</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors duration-300 cursor-pointer">
                  <span className="text-sm">💬</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-white">Produto</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors duration-200">Funcionalidades</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors duration-200">Preços</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors duration-200">Demo Interativa</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors duration-200">Integrações</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-white">Suporte</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors duration-200">Central de Ajuda</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors duration-200">Contato</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors duration-200">Status do Sistema</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors duration-200">Treinamentos</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-6 text-white">Empresa</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors duration-200">Sobre Nós</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors duration-200">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors duration-200">Carreiras</a></li>
                <li><a href="#" className="text-gray-400 hover:text-primary-400 transition-colors duration-200">Parceiros</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700/50 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                &copy; 2024 Pet Connect. Todos os direitos reservados.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-primary-400 text-sm transition-colors duration-200">Privacidade</a>
                <a href="#" className="text-gray-400 hover:text-primary-400 text-sm transition-colors duration-200">Termos</a>
                <a href="#" className="text-gray-400 hover:text-primary-400 text-sm transition-colors duration-200">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}