# 🔧 Correção Robusta dos Erros RLS - Pet Connect

## 📋 Problema Identificado

O erro `ERROR: 42710: policy "companies_select_policy" for table "companies" already exists` indica que algumas políticas RLS já existem no banco de dados, causando conflito quando tentamos criar políticas com o mesmo nome.

## 🎯 Solução Implementada

Criamos um script robusto (`fix_rls_policies_robust.sql`) que:

1. **Diagnostica** todas as políticas RLS existentes
2. **Remove TODAS** as políticas existentes das tabelas relevantes
3. **Cria** as novas políticas RLS corretas
4. **Verifica** se tudo foi aplicado corretamente

## 🚀 Como Aplicar a Correção

### Passo 1: Acesse o Supabase Dashboard
1. Vá para [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione o projeto Pet Connect

### Passo 2: Abra o SQL Editor
1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"** para criar uma nova consulta

### Passo 3: Execute o Script de Correção
1. Abra o arquivo `fix_rls_policies_robust.sql`
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **"Run"** para executar

### Passo 4: Verifique os Resultados

O script executará várias etapas e mostrará:

1. **Diagnóstico inicial**: Lista de políticas existentes antes da correção
2. **Remoção**: Comandos para remover todas as políticas antigas
3. **Criação**: Novas políticas RLS corretas
4. **Verificação final**: Confirmação de que tudo foi aplicado

## ✅ Verificações Importantes

### 1. Políticas RLS Criadas
Após a execução, você deve ver estas políticas:

- **companies**: `companies_select_policy`, `companies_update_policy`
- **users**: `users_policy`
- **clients**: `clients_policy`
- **pets**: `pets_policy`
- **services**: `services_policy`
- **appointments**: `appointments_policy`
- **transactions**: `transactions_policy`
- **notifications**: `notifications_policy`

### 2. Função Helper
A função `public.get_user_company_id()` deve estar criada e funcionando.

### 3. Teste na Aplicação
Após aplicar o script:

1. Volte para a aplicação Pet Connect
2. Faça logout e login novamente
3. Teste o carregamento de:
   - **Pets** (página `/pets`)
   - **Serviços** (página `/services`)
   - **Clientes** (página `/clients`)
   - **Criação de serviços** (página `/services/new`)

## 🔍 Resolução de Problemas

### Se ainda houver erros:

1. **Verifique se executou o script completo**
   - O script deve ser executado inteiro, não em partes

2. **Confirme que não há erros no SQL Editor**
   - Se houver erros, copie a mensagem e me informe

3. **Verifique se as tabelas existem**
   - Execute: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`

4. **Teste a função helper**
   - Execute: `SELECT public.get_user_company_id();`
   - Deve retornar o UUID da sua empresa

## 📞 Próximos Passos

Após aplicar esta correção:

1. ✅ **Teste todas as funcionalidades** da aplicação
2. ✅ **Execute o script** `add_missing_columns.sql` (se ainda não executou)
3. ✅ **Verifique se não há mais erros 400** no console do navegador

## 🎯 Resultado Esperado

- ✅ Carregamento correto de pets, serviços e clientes
- ✅ Funcionamento da página `/services/new`
- ✅ Eliminação dos erros 400 no console
- ✅ Isolamento correto de dados por empresa (RLS funcionando)

---

**💡 Dica**: Mantenha o navegador aberto na aba do Supabase para acompanhar a execução e verificar os resultados de cada etapa do script.