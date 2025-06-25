# 🐾 Pet Connect

> Sistema completo de gestão para pet shops modernos

## 📋 Sobre o Projeto

O Pet Connect é um sistema SaaS desenvolvido especificamente para pet shops, oferecendo uma solução completa para gestão de clientes, pets, agendamentos e muito mais.

### 🎯 Funcionalidades Principais

- **Gestão de Clientes**: Cadastro completo de tutores com histórico
- **Gestão de Pets**: Perfis detalhados com fotos e histórico médico
- **Sistema de Agendamentos**: Calendário inteligente com notificações
- **Galeria de Fotos**: Upload e organização de fotos dos pets (Premium)
- **WhatsApp Integration**: Envio automático de lembretes e fotos (Premium)
- **Dashboard Analytics**: Relatórios e métricas do negócio
- **Multi-tenant**: Isolamento completo entre pet shops

### 💎 Planos Disponíveis

#### 🆓 Plano Gratuito
- Até 20 clientes
- Até 30 pets
- 1 usuário
- Funcionalidades básicas

#### ⭐ Plano Premium (R$ 39,90/mês)
- Clientes e pets ilimitados
- Usuários ilimitados
- Galeria de fotos ilimitada
- Integração WhatsApp
- Relatórios avançados
- Suporte prioritário

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **Deployment**: Vercel
- **Payments**: Stripe
- **WhatsApp**: WhatsApp Business API

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/pet-connect.git
cd pet-connect
```

### 2. Instale as dependências

```bash
npm install
# ou
yarn install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configure o banco de dados

1. Acesse seu projeto no [Supabase](https://supabase.com)
2. Execute os scripts SQL da pasta `docs/sql/`
3. Configure as políticas RLS

### 5. Execute o projeto

```bash
npm run dev
# ou
yarn dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
src/
├── app/                 # App Router (Next.js 14)
├── components/          # Componentes React
│   ├── Auth/           # Autenticação
│   ├── Layout/         # Layout e navegação
│   ├── UI/             # Componentes base
│   ├── Clients/        # Gestão de clientes
│   ├── Pets/           # Gestão de pets
│   └── Admin/          # Painel administrativo
├── contexts/           # React Contexts
├── hooks/              # Custom hooks
├── lib/                # Configurações e utilitários
├── types/              # Tipos TypeScript
└── utils/              # Funções utilitárias
```

## 🗄️ Banco de Dados

### Principais Tabelas

- `companies` - Pet shops cadastrados
- `users` - Usuários do sistema
- `clients` - Clientes (tutores)
- `pets` - Pets cadastrados
- `appointments` - Agendamentos
- `services` - Serviços oferecidos
- `transactions` - Transações financeiras

### RLS (Row Level Security)

Todas as tabelas implementam RLS para garantir isolamento total entre pet shops.

## 🔐 Autenticação

- Supabase Auth
- Login com email/senha
- Recuperação de senha
- Verificação de email
- Controle de acesso por roles

## 📱 Responsividade

- Design mobile-first
- Interface otimizada para tablets
- PWA ready

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório no Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras plataformas

- Netlify
- Railway
- DigitalOcean App Platform

## 📈 Roadmap

### Fase 1 - MVP ✅
- [x] Setup inicial
- [x] Autenticação
- [x] CRUD básico
- [x] Dashboard

### Fase 2 - Core Features 🔄
- [ ] Sistema de fotos
- [ ] Agendamentos
- [ ] WhatsApp integration
- [ ] Relatórios

### Fase 3 - Premium Features 📋
- [ ] Portal do cliente
- [ ] API pública
- [ ] Integrações avançadas
- [ ] Mobile app

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- 📧 Email: suporte@petconnect.com.br
- 💬 WhatsApp: (11) 99999-9999
- 📖 Documentação: [docs.petconnect.com.br](https://docs.petconnect.com.br)

---

**Desenvolvido com ❤️ para o mercado pet brasileiro**