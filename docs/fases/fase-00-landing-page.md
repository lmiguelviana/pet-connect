# 🌟 Fase 00 - Landing Page do Pet Connect

## 📋 Visão Geral

**Objetivo:** Criar uma página de apresentação profissional do Pet Connect com informações sobre benefícios, planos e acesso ao sistema.

**Tempo estimado:** 2-3 dias  
**Status:** 🟡 Pendente

## 🎯 Funcionalidades

### 1. Hero Section
- Título impactante sobre gestão para pet shops
- Subtítulo explicando os benefícios principais
- Botões de "Começar Grátis" e "Ver Demo"
- Imagem/ilustração de pet shop moderno

### 2. Seção de Benefícios
- **Gestão Completa**: Clientes, pets, agendamentos em um só lugar
- **Sistema de Fotos**: Compartilhe momentos especiais com os tutores
- **Preço Acessível**: Planos que cabem no seu orçamento
- **Fácil de Usar**: Interface intuitiva, sem complicações

### 3. Comparação de Planos

#### Plano Gratuito
- ✅ Até 20 clientes
- ✅ Até 30 pets
- ✅ 1 usuário
- ✅ Agendamentos básicos
- ✅ Suporte por email
- 💰 **R$ 0/mês**

#### Plano Premium
- ✅ Clientes ilimitados
- ✅ Pets ilimitados
- ✅ Usuários ilimitados
- ✅ Agendamentos avançados
- ✅ Relatórios completos
- ✅ Integração WhatsApp
- ✅ Suporte prioritário
- 💰 **R$ 39,90/mês**

### 4. Seção de Recursos
- **Dashboard Intuitivo**: Visualize tudo que importa
- **Agendamentos**: Calendário integrado com notificações
- **Gestão de Clientes**: Histórico completo de cada tutor
- **Controle Financeiro**: Acompanhe receitas e despesas
- **Relatórios**: Insights para crescer seu negócio

### 5. Depoimentos
- Casos de sucesso de pet shops reais
- Fotos dos estabelecimentos
- Resultados obtidos com o sistema

### 6. Call-to-Action Final
- Botão principal "Começar Grátis Agora"
- Garantia de 30 dias
- Sem cartão de crédito necessário

### 7. Footer
- Links para documentação
- Contato e suporte
- Redes sociais
- Política de privacidade

## 🛠️ Tarefas Detalhadas

### 1. Estrutura da Landing Page

#### 1.1 Layout Responsivo
```typescript
// src/app/landing/page.tsx
import { Button } from '@/components/ui/button'
import { CheckIcon, StarIcon } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-primary-600">
                🐾 Pet Connect
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" href="/auth/login">
                Entrar
              </Button>
              <Button href="/auth/register">
                Começar Grátis
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transforme seu
              <span className="text-primary-600"> Pet Shop </span>
              em um negócio digital
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Sistema completo de gestão para pet shops. Gerencie clientes, pets, 
              agendamentos e muito mais em uma plataforma moderna e fácil de usar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" href="/auth/register">
                Começar Grátis Agora
              </Button>
              <Button variant="outline" size="lg">
                Ver Demo
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              ✨ Sem cartão de crédito • 30 dias grátis • Suporte incluído
            </p>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Por que escolher o Pet Connect?
            </h2>
            <p className="text-xl text-gray-600">
              Desenvolvido especialmente para pet shops modernos
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestão Completa</h3>
              <p className="text-gray-600">
                Clientes, pets, agendamentos e financeiro em um só lugar
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📸</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sistema de Fotos</h3>
              <p className="text-gray-600">
                Compartilhe momentos especiais com os tutores dos pets
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Preço Justo</h3>
              <p className="text-gray-600">
                Planos acessíveis que cabem no orçamento do seu pet shop
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fácil de Usar</h3>
              <p className="text-gray-600">
                Interface intuitiva, sem complicações ou treinamentos longos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Escolha o plano ideal
            </h2>
            <p className="text-xl text-gray-600">
              Comece grátis e evolua conforme seu negócio cresce
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plano Gratuito */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Gratuito</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  R$ 0
                  <span className="text-lg font-normal text-gray-600">/mês</span>
                </div>
                <p className="text-gray-600">Perfeito para começar</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-primary-500 mr-3" />
                  Até 20 clientes
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-primary-500 mr-3" />
                  Até 30 pets
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-primary-500 mr-3" />
                  1 usuário
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-primary-500 mr-3" />
                  Agendamentos básicos
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-primary-500 mr-3" />
                  1 foto por pet
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-primary-500 mr-3" />
                  Suporte por email
                </li>
              </ul>
              
              <Button variant="outline" className="w-full" href="/auth/register">
                Começar Grátis
              </Button>
            </div>
            
            {/* Plano Premium */}
            <div className="bg-primary-600 rounded-lg shadow-lg p-8 text-white relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                  Mais Popular
                </span>
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <div className="text-4xl font-bold mb-2">
                  R$ 39,90
                  <span className="text-lg font-normal opacity-80">/mês</span>
                </div>
                <p className="opacity-80">Para pet shops em crescimento</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-white mr-3" />
                  Clientes ilimitados
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-white mr-3" />
                  Pets ilimitados
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-white mr-3" />
                  Usuários ilimitados
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-white mr-3" />
                  Agendamentos avançados
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-white mr-3" />
                  1 foto por pet
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-white mr-3" />
                  Relatórios completos
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-white mr-3" />
                  Integração WhatsApp
                </li>
                <li className="flex items-center">
                  <CheckIcon className="h-5 w-5 text-white mr-3" />
                  Suporte prioritário
                </li>
              </ul>
              
              <Button variant="secondary" className="w-full" href="/auth/register?plan=premium">
                Começar Teste Grátis
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-primary-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para transformar seu pet shop?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Junte-se a centenas de pet shops que já usam o Pet Connect
          </p>
          <Button size="lg" variant="secondary" href="/auth/register">
            Começar Grátis Agora
          </Button>
          <p className="text-sm text-primary-200 mt-4">
            ✨ 30 dias grátis • Sem compromisso • Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-xl font-bold mb-4">🐾 Pet Connect</div>
              <p className="text-gray-400">
                Sistema de gestão completo para pet shops modernos.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-white">Preços</a></li>
                <li><a href="#" className="hover:text-white">Demo</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Documentação</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacidade</a></li>
                <li><a href="#" className="hover:text-white">Termos</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Pet Connect. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
```

#### 1.2 Componentes Reutilizáveis
```typescript
// src/components/landing/FeatureCard.tsx
interface FeatureCardProps {
  icon: string
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="text-center">
      <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
```

```typescript
// src/components/landing/PricingCard.tsx
import { Button } from '@/components/ui/button'
import { CheckIcon } from 'lucide-react'

interface PricingCardProps {
  name: string
  price: string
  description: string
  features: string[]
  popular?: boolean
  ctaText: string
  ctaLink: string
}

export function PricingCard({ 
  name, 
  price, 
  description, 
  features, 
  popular, 
  ctaText, 
  ctaLink 
}: PricingCardProps) {
  return (
    <div className={`rounded-lg shadow-lg p-8 relative ${
      popular ? 'bg-primary-600 text-white' : 'bg-white'
    }`}>
      {popular && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
            Mais Popular
          </span>
        </div>
      )}
      
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        <div className="text-4xl font-bold mb-2">
          {price}
          <span className={`text-lg font-normal ${
            popular ? 'opacity-80' : 'text-gray-600'
          }`}>/mês</span>
        </div>
        <p className={popular ? 'opacity-80' : 'text-gray-600'}>
          {description}
        </p>
      </div>
      
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <CheckIcon className={`h-5 w-5 mr-3 ${
              popular ? 'text-white' : 'text-primary-500'
            }`} />
            {feature}
          </li>
        ))}
      </ul>
      
      <Button 
        variant={popular ? 'secondary' : 'outline'} 
        className="w-full" 
        href={ctaLink}
      >
        {ctaText}
      </Button>
    </div>
  )
}
```

### 2. SEO e Performance

#### 2.1 Metadados
```typescript
// src/app/landing/layout.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pet Connect - Sistema de Gestão para Pet Shops',
  description: 'Sistema completo de gestão para pet shops. Gerencie clientes, pets, agendamentos e muito mais. Comece grátis!',
  keywords: 'pet shop, gestão, sistema, pets, clientes, agendamentos',
  openGraph: {
    title: 'Pet Connect - Transforme seu Pet Shop',
    description: 'Sistema completo de gestão para pet shops modernos',
    images: ['/og-image.jpg'],
  },
}
```

#### 2.2 Otimizações
- Lazy loading para imagens
- Compressão de assets
- Critical CSS inline
- Preload de fontes importantes

### 3. Analytics e Conversão

#### 3.1 Tracking de Eventos
```typescript
// src/lib/analytics.ts
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, properties)
  }
  
  // Outras ferramentas de analytics
}

// Eventos importantes:
// - landing_page_view
// - cta_click
// - plan_select
// - demo_request
// - signup_start
```

## 🎨 Design System

### Cores
- **Primary**: Verde #10B981 (confiança, crescimento)
- **Secondary**: Cinza #64748B (profissionalismo)
- **Accent**: Amarelo #F59E0B (destaque, urgência)

### Tipografia
- **Headings**: Inter Bold
- **Body**: Inter Regular
- **Monospace**: JetBrains Mono

### Componentes
- Botões com estados hover/focus
- Cards com sombras suaves
- Gradientes sutis
- Ícones consistentes

## 📱 Responsividade

- **Mobile First**: Design otimizado para celular
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch Targets**: Mínimo 44px para botões
- **Navegação**: Menu hamburger em mobile

## 🔄 Próximos Passos

Após completar esta fase:
1. **Fase 01**: Setup e configuração inicial
2. Implementar sistema de autenticação
3. Conectar CTAs com fluxo de registro
4. Configurar analytics e tracking

## 📝 Notas Importantes

- Focar na conversão e clareza da proposta de valor
- Testar diferentes versões dos CTAs
- Otimizar para velocidade de carregamento
- Garantir acessibilidade (WCAG 2.1)
- Implementar schema markup para SEO

---

**Tempo estimado: 2-3 dias**  
**Complexidade: Média**  
**Dependências: Design system básico**