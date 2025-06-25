# Pet Connect - Sistema de Gestão para Pet Shops

## 🐾 Visão Geral

O **Pet Connect** é um sistema SaaS completo de gestão para pet shops, desenvolvido com foco na experiência do usuário e na eficiência operacional. O sistema oferece dois planos distintos (Gratuito e Premium) para atender diferentes necessidades de negócio.

### 🎯 Objetivo Principal
Fornece uma solução completa e moderna para pet shops gerenciarem clientes, pets, agendamentos, serviços e finanças de forma integrada e eficiente.

### 💰 Modelo de Negócio
- **Plano Gratuito**: Funcionalidades básicas com limitações
- **Plano Premium**: R$ 39,90/mês - Funcionalidades completas e ilimitadas

## 🚀 Funcionalidades Principais

### Plano Gratuito (Limitações)
- ✅ Até 20 clientes cadastrados
- ✅ Até 30 pets cadastrados
- ✅ 1 usuário do sistema
- ✅ Agendamentos básicos (até 10/mês)
- ❌ Sem upload de fotos
- ❌ Sem relatórios financeiros

### Plano Premium (R$ 39,90/mês)
- ✅ Clientes e pets ilimitados
- ✅ Usuários ilimitados
- ✅ Todas as funcionalidades avançadas
- ✅ Upload de fotos ilimitado
- ✅ Relatórios completos
- ✅ WhatsApp automático

## 📋 Módulos do Sistema

### 1. 📊 Dashboard
- Métricas em tempo real
- Agendamentos do dia
- Alertas importantes
- Gráficos de performance (Premium)

### 2. 👥 Gestão de Clientes
- Cadastro completo com foto de perfil
- Dados pessoais e contato
- Histórico de atendimentos
- Sistema de conta corrente (Premium)

### 3. 🐕 Gestão de Pets
- Cadastro detalhado (nome, espécie, raça, idade, peso)
- Upload de múltiplas fotos (Premium)
- Galeria organizada por data
- Histórico médico completo
- Compartilhamento de fotos via WhatsApp (Premium)

### 4. 📅 Agendamentos
- Calendário interativo
- Status dos agendamentos
- Recorrência automática (Premium)
- Notificações WhatsApp (Premium)

### 5. 🛠️ Serviços
- Cadastro de serviços oferecidos
- Controle de preços e duração
- Pacotes e combos (Premium)

### 6. 💰 Financeiro (Premium)
- Fluxo de caixa
- Contas a pagar/receber
- Relatórios de rentabilidade
- Comissões por funcionário

### 7. 📈 Relatórios (Premium)
- Análise de clientes
- Produtividade da equipe
- Frequência dos pets
- Métricas de crescimento

### 8. ⚙️ Módulo Administrativo
Portal exclusivo para administração do SaaS:
- Dashboard com total de clientes do sistema
- Controle de assinaturas
- Status do banco Supabase
- Receita recorrente mensal (MRR)
- Logs de sistema e performance
- Gestão de suporte técnico

## 🎨 Design System

### Paleta de Cores
- **Verde Principal**: #10B981
- **Verde Claro**: #6EE7B7
- **Verde Escuro**: #047857
- **Branco**: #FFFFFF
- **Cinza Claro**: #F9FAFB
- **Cinza Médio**: #6B7280
- **Cinza Escuro**: #374151

### Princípios de UX
- Layout limpo e profissional
- Ícones intuitivos relacionados a pets
- Espaçamento generoso e bem estruturado
- Carregamento otimizado com skeletons
- Feedback visual para todas as ações
- Modais de confirmação personalizados
- Tipografia clara e legível

## 🔧 Stack Tecnológica

### Frontend
- **Next.js 14+** com TypeScript
- **Tailwind CSS** para estilização
- Componentes reutilizáveis
- Interface responsiva mobile-first
- Upload de imagens otimizado

### Backend
- **Supabase** como BaaS
- Autenticação integrada
- Row Level Security (RLS)
- Storage para fotos
- Real-time subscriptions
- Edge functions

## 🔒 Segurança
- Login por email/senha
- Verificação de email
- Recuperação de senha
- Controle de acesso por plano
- Isolamento total de dados entre empresas
- Backup automático
- Row Level Security (RLS)

## 📚 Documentação Disponível

### 🏗️ Arquitetura e Planejamento
- [`arquitetura.md`](./arquitetura.md) - Visão geral da arquitetura
- [`banco-dados.md`](./banco-dados.md) - Estrutura completa do banco
- [`banco-dados-reset.md`](./banco-dados-reset.md) - Script de reset e configuração
- [`supabase-setup-completo.md`](./supabase-setup-completo.md) - Guia completo de setup

### 📋 Fases de Desenvolvimento
- [`fases/`](./fases/) - Todas as fases planejadas
- [`Fases Concluidas/`](./Fases%20Concluidas/) - Fases já implementadas

## 📁 Estrutura da Documentação

- `README.md` - Visão geral do projeto
- `arquitetura.md` - Arquitetura técnica detalhada
- `banco-dados.md` - Estrutura do banco de dados
- `fases/` - Fases detalhadas de desenvolvimento
  - `fase-01-setup.md` - Configuração inicial
  - `fase-02-autenticacao.md` - Sistema de autenticação
  - `fase-03-dashboard.md` - Dashboard principal
  - `fase-04-clientes.md` - Gestão de clientes
  - `fase-05-pets.md` - Gestão de pets
  - `fase-06-agendamentos.md` - Sistema de agendamentos
  - `fase-07-servicos.md` - Gestão de serviços
  - `fase-08-financeiro.md` - Módulo financeiro
  - `fase-09-relatorios.md` - Sistema de relatórios
  - `fase-10-admin.md` - Painel administrativo
  - `fase-11-deploy.md` - Deploy e produção

---

**Desenvolvido com ❤️ para revolucionar a gestão de pet shops**