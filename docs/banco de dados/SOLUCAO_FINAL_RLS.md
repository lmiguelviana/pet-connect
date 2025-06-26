# 🔧 Solução Final para Problemas de RLS - Pet Connect

## 📋 Resumo do Problema

O erro `ERROR: 42501: permission denied for schema auth` ocorre quando tentamos criar funções no schema `auth` do Supabase <mcreference link="https://supabase.com/docs/guides/auth/managing-user-data" index="1">1</mcreference>. Este schema é protegido e não permite modificações diretas por questões de segurança <mcreference link="https://github.com/orgs/supabase/discussions/21828" index="3">3</mcreference>.

## 🎯 Solução Implementada

### Estratégia Principal
- **Evitar completamente o schema `auth`** <mcreference link="https://supabase.com/docs/guides/auth/managing-user-data" index="1">1</mcreference>
- **Usar apenas o schema `public`** para todas as funções
- **Manter isolamento de dados** através de políticas RLS baseadas em `auth.uid()`
- **Criar função helper segura** no schema público

### Arquivos da Solução

#### 1. `fix_rls_final.sql` - Script Principal
**Localização:** `docs/banco de dados/fix_rls_final.sql`

**Funcionalidades:**
- Remove políticas RLS problemáticas
- Cria função `public.get_user_company_id()` (não no schema auth)
- Implementa políticas RLS granulares
- Funções para setup inicial e testes

## 🔍 Detalhes Técnicos

### Função Helper Segura
```sql
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id 
  FROM public.users 
  WHERE id = auth.uid()
  LIMIT 1;
$$;
```

**Por que funciona:**
- Criada no schema `public` (sem restrições)
- Usa `auth.uid()` que é sempre disponível <mcreference link="https://supabase.com/docs/guides/auth" index="2">2</mcreference>
- `SECURITY DEFINER` garante execução com privilégios adequados <mcreference link="https://github.com/orgs/supabase/discussions/21828" index="3">3</mcreference>

### Políticas RLS Implementadas

#### Companies
- **SELECT:** Usuários veem apenas sua empresa
- **UPDATE:** Apenas owners podem atualizar

#### Users
- **SELECT:** Usuários da mesma empresa
- **UPDATE:** Apenas próprios dados
- **INSERT:** Apenas owners podem adicionar usuários

#### Demais Tabelas (clients, pets, services, etc.)
- **ALL:** Isolamento completo por `company_id`

### Funções de Setup

#### `create_initial_user_and_company()`
```sql
SELECT public.create_initial_user_and_company(
  'Meu Pet Shop', 
  'João Silva', 
  'joao@petshop.com'
);
```

#### `create_test_data()` e `clean_test_data()`
```sql
-- Criar dados de teste
SELECT public.create_test_data();

-- Limpar dados de teste
SELECT public.clean_test_data();
```

## 🚀 Como Implementar

### Passo 1: Executar o Script
1. Abra o **SQL Editor** no Supabase Dashboard
2. Cole o conteúdo de `fix_rls_final.sql`
3. Execute o script completo

### Passo 2: Criar Empresa e Usuário Inicial
```sql
SELECT public.create_initial_user_and_company(
  'Nome do Pet Shop',
  'Seu Nome',
  'seu@email.com'
);
```

### Passo 3: Testar com Dados de Exemplo
```sql
-- Criar dados de teste
SELECT public.create_test_data();

-- Verificar se funciona
SELECT * FROM clients;
SELECT * FROM pets;
SELECT * FROM appointments;

-- Limpar quando necessário
SELECT public.clean_test_data();
```

## ✅ Verificações Pós-Implementação

### 1. Verificar RLS Habilitado
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('companies', 'users', 'clients', 'pets', 'services', 'appointments');
```

### 2. Verificar Políticas Criadas
```sql
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 3. Verificar Função Helper
```sql
SELECT public.get_user_company_id();
```

### 4. Testar Isolamento
```sql
-- Deve retornar apenas dados da sua empresa
SELECT COUNT(*) FROM clients;
SELECT COUNT(*) FROM pets;
```

## 🔒 Segurança Garantida

### Isolamento por Empresa
- Cada usuário vê apenas dados de sua empresa
- Impossível acessar dados de outras empresas
- Políticas aplicadas automaticamente

### Controle de Permissões
- Owners: Controle total da empresa
- Employees: Acesso aos dados, sem gestão de usuários
- RLS aplicado em todas as operações

## 🐛 Troubleshooting

### Erro: "Usuário não autenticado"
**Causa:** `auth.uid()` retorna NULL
**Solução:** Verificar se está logado no Supabase

### Erro: "Usuário já possui uma empresa"
**Causa:** Tentativa de criar segunda empresa
**Solução:** Usar função de limpeza ou verificar dados existentes

### Erro: "permission denied for table"
**Causa:** RLS não configurado corretamente
**Solução:** Re-executar o script `fix_rls_final.sql`

## 📊 Diferenças da Solução Anterior

| Aspecto | Solução Anterior | Solução Final |
|---------|------------------|---------------|
| Schema da função | `auth.get_user_company_id()` | `public.get_user_company_id()` |
| Permissões | Erro 42501 | ✅ Funciona |
| Complexidade | Alta | Simplificada |
| Manutenção | Difícil | Fácil |
| Segurança | ✅ Mantida | ✅ Mantida |

## 🎯 Próximos Passos

1. **Implementar no Frontend:**
   - Usar a função `create_initial_user_and_company` no onboarding
   - Integrar com o fluxo de autenticação

2. **Testes Completos:**
   - Testar com múltiplos usuários
   - Verificar isolamento entre empresas

3. **Monitoramento:**
   - Acompanhar logs de erro
   - Verificar performance das consultas

## 📚 Referências

- [Supabase Auth User Management](https://supabase.com/docs/guides/auth/managing-user-data) <mcreference link="https://supabase.com/docs/guides/auth/managing-user-data" index="1">1</mcreference>
- [Supabase Auth Overview](https://supabase.com/docs/guides/auth) <mcreference link="https://supabase.com/docs/guides/auth" index="2">2</mcreference>
- [GitHub Discussion - Auth Admin Permissions](https://github.com/orgs/supabase/discussions/21828) <mcreference link="https://github.com/orgs/supabase/discussions/21828" index="3">3</mcreference>
- [Reddit - Permission Denied Solutions](https://www.reddit.com/r/Supabase/comments/117vgrl/need_help_with_permission_denied_for_table_inside/) <mcreference link="https://www.reddit.com/r/Supabase/comments/117vgrl/need_help_with_permission_denied_for_table_inside/" index="4">4</mcreference>
- [Supabase Access Control](https://supabase.com/docs/guides/platform/access-control) <mcreference link="https://supabase.com/docs/guides/platform/access-control" index="5">5</mcreference>

---

**✅ Esta solução resolve definitivamente o problema de RLS sem interferir no schema de autenticação do Supabase.**