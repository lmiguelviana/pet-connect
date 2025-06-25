# 🏗️ Arquitetura Técnica - Pet Connect

## 📋 Visão Geral da Arquitetura

O Pet Connect utiliza uma arquitetura moderna baseada em **JAMstack** com **Supabase** como Backend-as-a-Service (BaaS), proporcionando escalabilidade, segurança e performance otimizada.

## 🔧 Stack Tecnológica Completa

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Componentes**: Radix UI + Headless UI
- **Ícones**: Lucide React
- **Formulários**: React Hook Form + Zod
- **Estado Global**: Zustand
- **Upload de Arquivos**: React Dropzone
- **Calendário**: React Big Calendar
- **Gráficos**: Recharts
- **Notificações**: React Hot Toast

### Backend (Supabase)
- **Banco de Dados**: PostgreSQL
- **Autenticação**: Supabase Auth
- **Storage**: Supabase Storage
- **API**: Auto-generated REST API
- **Real-time**: WebSocket subscriptions
- **Edge Functions**: Deno runtime
- **Segurança**: Row Level Security (RLS)

### Integrações Externas
- **WhatsApp API**: Para notificações automáticas
- **Upload de Imagens**: Compressão automática
- **Pagamentos**: Stripe (para assinaturas Premium)
- **Email**: Resend ou SendGrid

## 🏛️ Arquitetura de Componentes

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Pages     │  │ Components  │  │   Hooks     │    │
│  │             │  │             │  │             │    │
│  │ • Dashboard │  │ • UI Kit    │  │ • useAuth   │    │
│  │ • Clientes  │  │ • Forms     │  │ • useData   │    │
│  │ • Pets      │  │ • Tables    │  │ • useUpload │    │
│  │ • Agenda    │  │ • Modals    │  │ • useRealtime│   │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
├─────────────────────────────────────────────────────────┤
│                   MIDDLEWARE LAYER                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Supabase    │  │ Auth Guard  │  │ Plan Guard  │    │
│  │ Client      │  │             │  │             │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Supabase)                    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ PostgreSQL  │  │ Auth System │  │   Storage   │    │
│  │             │  │             │  │             │    │
│  │ • Tables    │  │ • JWT       │  │ • Images    │    │
│  │ • RLS       │  │ • Sessions  │  │ • Files     │    │
│  │ • Functions │  │ • Roles     │  │ • Buckets   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
├─────────────────────────────────────────────────────────┤
│                  EDGE FUNCTIONS                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ WhatsApp    │  │ Email       │  │ Webhooks    │    │
│  │ Integration │  │ Notifications│  │ Stripe      │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Segurança e Autenticação

### Row Level Security (RLS)
Todas as tabelas implementam RLS para garantir isolamento total entre empresas:

```sql
-- Exemplo de política RLS para tabela clients
CREATE POLICY "Users can only see their company's clients" 
ON clients FOR ALL 
USING (company_id = auth.jwt() ->> 'company_id');
```

### Controle de Acesso
- **Autenticação**: JWT tokens via Supabase Auth
- **Autorização**: Baseada em roles e planos
- **Isolamento**: Dados separados por company_id
- **Validação**: Middleware para verificar planos

## 📊 Estrutura de Dados

### Hierarquia Principal
```
Company (Pet Shop)
├── Users (Funcionários)
├── Clients (Tutores)
│   └── Pets
│       ├── Pet Photos
│       └── Medical History
├── Services
├── Appointments
└── Transactions
```

### Relacionamentos
- **1:N** - Company → Users, Clients, Services
- **1:N** - Client → Pets
- **1:N** - Pet → Pet Photos
- **N:1** - Appointment → Client, Pet, Service
- **1:N** - Company → Transactions

## 🚀 Performance e Otimização

### Frontend
- **Code Splitting**: Carregamento sob demanda
- **Image Optimization**: Next.js Image component
- **Caching**: SWR para cache de dados
- **Lazy Loading**: Componentes e rotas
- **Bundle Analysis**: Webpack Bundle Analyzer

### Backend
- **Indexação**: Índices otimizados no PostgreSQL
- **Connection Pooling**: PgBouncer
- **CDN**: Supabase Edge Network
- **Caching**: Redis para dados frequentes

### Database Optimization
```sql
-- Índices importantes
CREATE INDEX idx_clients_company_id ON clients(company_id);
CREATE INDEX idx_pets_client_id ON pets(client_id);
CREATE INDEX idx_appointments_date ON appointments(date_time);
CREATE INDEX idx_appointments_company_date ON appointments(company_id, date_time);
```

## 📱 Responsividade e Mobile

### Breakpoints Tailwind
- **sm**: 640px (Mobile landscape)
- **md**: 768px (Tablet)
- **lg**: 1024px (Desktop)
- **xl**: 1280px (Large desktop)

### Mobile-First Approach
- Design responsivo desde o início
- Touch-friendly interfaces
- Otimização para dispositivos móveis
- PWA capabilities (futuro)

## 🔄 Real-time Features

### Supabase Subscriptions
```typescript
// Exemplo de subscription para agendamentos
const subscription = supabase
  .channel('appointments')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'appointments',
    filter: `company_id=eq.${companyId}`
  }, (payload) => {
    // Atualizar estado em tempo real
  })
  .subscribe();
```

### Funcionalidades Real-time
- Novos agendamentos
- Atualizações de status
- Notificações do sistema
- Chat de suporte (futuro)

## 🧪 Testes e Qualidade

### Estratégia de Testes
- **Unit Tests**: Jest + Testing Library
- **Integration Tests**: Cypress
- **E2E Tests**: Playwright
- **API Tests**: Supabase Test Suite

### Code Quality
- **ESLint**: Linting JavaScript/TypeScript
- **Prettier**: Formatação de código
- **Husky**: Git hooks
- **TypeScript**: Type safety

## 🚀 Deploy e DevOps

### Ambientes
- **Development**: Local + Supabase local
- **Staging**: Vercel + Supabase staging
- **Production**: Vercel + Supabase production

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
```

## 📈 Monitoramento e Analytics

### Ferramentas
- **Vercel Analytics**: Performance do frontend
- **Supabase Dashboard**: Métricas do backend
- **Sentry**: Error tracking
- **LogRocket**: Session replay

### Métricas Importantes
- Core Web Vitals
- Database performance
- API response times
- Error rates
- User engagement

## 🔮 Escalabilidade Futura

### Horizontal Scaling
- Microserviços com Edge Functions
- CDN global
- Database sharding (se necessário)
- Load balancing

### Vertical Scaling
- Upgrade de planos Supabase
- Otimização de queries
- Caching avançado
- Connection pooling

---

**Esta arquitetura garante um sistema robusto, escalável e maintível para o Pet Connect.**