# 🔧 Solução para Problema de RLS - Pet Connect

## 📋 Diagnóstico do Problema

### ❌ Problema Identificado
O sistema permite criar usuários na autenticação, mas **não consegue adicionar dados** nas páginas de:
- ✅ Dashboard
- ❌ Clientes 
- ❌ Pets
- ❌ Agendamentos
- ❌ Serviços

### 🔍 Causa Raiz
As **políticas RLS (Row Level Security)** estão mal configuradas:

1. **Problema Principal**: Todas as políticas dependem de `auth.jwt() ->> 'company_id'`
2. **Realidade**: O JWT do Supabase **não inclui** `company_id` por padrão
3. **Resultado**: Todas as consultas são bloqueadas, criando um **deadlock circular**

### 🔄 Ciclo Vicioso
```
Usuário faz login → AuthContext tenta buscar dados do usuário → 
RLS bloqueia consulta (sem company_id no JWT) → 
Não consegue obter company_id → 
Todas as operações falham
```

## 🛠️ Solução Completa

### Passo 1: Executar Diagnóstico
```sql
-- Execute no Supabase SQL Editor
-- Arquivo: diagnose_database.sql
```

### Passo 2: Corrigir Políticas RLS
```sql
-- Execute no Supabase SQL Editor
-- Arquivo: fix_rls_policies.sql
```

### Passo 3: Corrigir Fluxo de Autenticação
```sql
-- Execute no Supabase SQL Editor
-- Arquivo: fix_auth_flow.sql
```

### Passo 4: Testar a Solução
```sql
-- Criar dados de teste
SELECT create_test_data();

-- Verificar se funcionou
SELECT * FROM get_current_user_data();

-- Limpar dados de teste
SELECT clean_test_data();
```

## 📝 Mudanças Implementadas

### 🔐 Novas Políticas RLS

#### Tabela `users`
- **Antes**: `auth.jwt() ->> 'company_id' = company_id::text`
- **Depois**: `auth.uid() = id` (permite acesso aos próprios dados)

#### Tabela `companies`
- **Antes**: `auth.jwt() ->> 'company_id' = id::text`
- **Depois**: `id = auth.get_user_company_id()` (usa função helper)

#### Demais Tabelas
- **Antes**: `auth.jwt() ->> 'company_id' = company_id::text`
- **Depois**: `company_id = auth.get_user_company_id()` (usa função helper)

### 🔧 Função Helper Criada
```sql
CREATE FUNCTION auth.get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;
```

### 🚀 Trigger de Criação de Usuários
- **Automático**: Quando usuário se registra, cria empresa e usuário automaticamente
- **Flexível**: Suporta criação de nova empresa ou adição a empresa existente
- **Seguro**: Usa `SECURITY DEFINER` para bypass temporário do RLS

## 🧪 Como Testar

### 1. Verificar Estado Atual
```bash
# No Supabase SQL Editor
# Execute: diagnose_database.sql
```

### 2. Aplicar Correções
```bash
# Execute em ordem:
# 1. fix_rls_policies.sql
# 2. fix_auth_flow.sql
```

### 3. Testar Funcionalidades
```sql
-- Criar dados de teste
SELECT create_test_data();

-- Verificar criação
SELECT * FROM companies;
SELECT * FROM users;
SELECT * FROM clients;
SELECT * FROM pets;
```

### 4. Testar no Frontend
1. **Login**: Fazer login no sistema
2. **Dashboard**: Verificar se carrega dados
3. **Clientes**: Tentar adicionar novo cliente
4. **Pets**: Tentar adicionar novo pet
5. **Agendamentos**: Tentar criar agendamento
6. **Serviços**: Tentar adicionar serviço

## 🔍 Verificações Pós-Implementação

### ✅ Checklist de Funcionamento
- [ ] Login funciona normalmente
- [ ] Dashboard carrega dados da empresa
- [ ] Consegue adicionar clientes
- [ ] Consegue adicionar pets
- [ ] Consegue criar agendamentos
- [ ] Consegue adicionar serviços
- [ ] RLS ainda protege dados entre empresas

### 🚨 Sinais de Problema
- Erro: "new row violates row-level security policy"
- Erro: "permission denied for table"
- Dados não aparecem no dashboard
- Formulários não salvam

## 🔄 Rollback (Se Necessário)

### Para Reverter as Mudanças
```sql
-- Remover políticas novas
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
-- ... (remover todas as novas políticas)

-- Remover função helper
DROP FUNCTION IF EXISTS auth.get_user_company_id();

-- Remover trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recriar políticas antigas (se necessário)
-- Execute os scripts originais da pasta docs/banco de dados/
```

## 📚 Arquivos Relacionados

### 📁 Scripts Criados
- `diagnose_database.sql` - Diagnóstico completo
- `fix_rls_policies.sql` - Correção das políticas RLS
- `fix_auth_flow.sql` - Correção do fluxo de autenticação
- `SOLUCAO_PROBLEMA_RLS.md` - Este guia

### 📁 Arquivos Analisados
- `docs/README.md` - Documentação do projeto
- `docs/arquitetura.md` - Arquitetura do sistema
- `docs/banco de dados/*.sql` - Scripts originais do banco
- `src/contexts/auth-context.tsx` - Contexto de autenticação
- `src/lib/supabase.ts` - Configuração do Supabase

## 🎯 Próximos Passos

1. **Executar** os scripts de correção
2. **Testar** todas as funcionalidades
3. **Monitorar** logs de erro
4. **Documentar** mudanças no changelog
5. **Implementar** melhorias de UX baseadas nos testes

## 💡 Lições Aprendidas

### ❌ O que Não Fazer
- Nunca depender de dados customizados no JWT sem configurá-los
- Não criar políticas RLS sem testar o fluxo completo
- Evitar dependências circulares em políticas de segurança

### ✅ Melhores Práticas
- Sempre usar `auth.uid()` como base para políticas de usuário
- Criar funções helper para lógica complexa de RLS
- Implementar triggers para automação de criação de dados
- Manter políticas simples e testáveis

---

**🚀 Com essas correções, o Pet Connect deve funcionar completamente!**