# 🗄️ Instalação do Banco de Dados Pet Connect

## 📋 Nome Sugerido para o Projeto Supabase

**Nome do Projeto:** `pet-connect-production`

## 🚀 Ordem de Execução dos Scripts

Execute os scripts SQL na seguinte ordem no **SQL Editor** do Supabase Dashboard:

### 1️⃣ Tabelas Principais
```
01-companies-table.sql     # Empresas
02-users-table.sql         # Usuários/Funcionários
03-clients-table.sql       # Clientes
04-pets-table.sql          # Pets
05-pet-photos-table.sql    # Fotos dos Pets
06-services-table.sql      # Serviços
07-appointments-table.sql  # Agendamentos
08-transactions-table.sql  # Transações Financeiras
09-notifications-table.sql # Notificações
```

### 2️⃣ Configurações Finais
```
10-functions-triggers.sql  # Funções e Triggers
11-dashboard-view.sql      # View do Dashboard
12-final-setup.sql         # Configurações Finais
```

## 🔧 Como Executar

1. **Acesse o Supabase Dashboard**
   - Vá para [supabase.com](https://supabase.com)
   - Faça login na sua conta
   - Clique em "New Project"

2. **Crie o Projeto**
   - Nome: `pet-connect-production`
   - Senha do banco: (escolha uma senha forte)
   - Região: South America (São Paulo)

3. **Execute os Scripts**
   - Vá em "SQL Editor" no menu lateral
   - Abra cada arquivo `.sql` em ordem
   - Copie e cole o conteúdo
   - Clique em "Run" para executar
   - ✅ Aguarde a confirmação de sucesso antes do próximo

4. **Configure as Variáveis de Ambiente**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico
   ```

## 📊 Estrutura Criada

### Tabelas
- ✅ **companies** - Empresas/Pet Shops
- ✅ **users** - Usuários/Funcionários
- ✅ **clients** - Clientes
- ✅ **pets** - Animais de estimação
- ✅ **pet_photos** - Fotos dos pets
- ✅ **services** - Serviços oferecidos
- ✅ **appointments** - Agendamentos
- ✅ **transactions** - Transações financeiras
- ✅ **notifications** - Sistema de notificações

### Recursos
- 🔒 **Row Level Security (RLS)** em todas as tabelas
- 🔄 **Triggers** para `updated_at` automático
- 📈 **Índices** para performance otimizada
- 🎯 **View dashboard_metrics** para relatórios
- 🛡️ **Validações** de limite do plano gratuito

## 🎯 Limites do Plano Gratuito

- **Clientes:** Máximo 20 por empresa
- **Pets:** Máximo 30 por empresa
- **Funcionalidades Premium:** Desabilitadas

## 🧪 Teste da Instalação

Após executar todos os scripts, teste com:

```sql
-- Verificar se todas as tabelas foram criadas
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'companies', 'users', 'clients', 'pets', 'pet_photos',
  'services', 'appointments', 'transactions', 'notifications'
)
ORDER BY table_name;

-- Deve retornar 9 tabelas
```

## 🔑 Configuração de Autenticação

1. Vá em **Authentication > Settings**
2. Configure os provedores desejados (Email, Google, etc.)
3. Defina as URLs de redirecionamento:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

## 📁 Storage (Opcional)

Para fotos dos pets:
1. Vá em **Storage**
2. Crie um bucket chamado `pet-photos`
3. Configure as políticas de acesso

## 🆘 Problemas Comuns

### Erro de Permissão
- Verifique se está logado como owner do projeto
- Confirme que o RLS está configurado corretamente

### Erro de Referência
- Execute os scripts na ordem correta
- Verifique se todas as tabelas foram criadas

### Performance Lenta
- Execute `ANALYZE` nas tabelas após inserir dados
- Verifique se os índices foram criados

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no Supabase Dashboard
2. Confirme a ordem de execução dos scripts
3. Teste a conectividade com o banco

---

**✅ Instalação Completa!** Seu banco Pet Connect está pronto para uso! 🎉