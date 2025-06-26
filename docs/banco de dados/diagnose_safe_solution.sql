-- =====================================================
-- DIAGNÓSTICO DA SOLUÇÃO SEGURA RLS - PET CONNECT
-- =====================================================
-- Script para verificar se a correção segura foi aplicada corretamente

-- =====================================================
-- 1. VERIFICAR ESTRUTURA BÁSICA
-- =====================================================

-- Verificar se as tabelas existem e têm RLS habilitado
SELECT 
  'TABELAS E RLS' as categoria,
  schemaname,
  tablename,
  rowsecurity as rls_habilitado,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Ativo'
    ELSE '❌ RLS Inativo'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('companies', 'users', 'clients', 'pets', 'services', 'appointments', 'transactions', 'notifications')
ORDER BY tablename;

-- =====================================================
-- 2. VERIFICAR FUNÇÃO HELPER
-- =====================================================

-- Verificar se a função helper foi criada
SELECT 
  'FUNÇÃO HELPER' as categoria,
  proname as nome_funcao,
  pronamespace::regnamespace as schema,
  prosecdef as security_definer,
  CASE 
    WHEN prosecdef THEN '✅ Security Definer Ativo'
    ELSE '❌ Security Definer Inativo'
  END as status
FROM pg_proc 
WHERE proname = 'get_user_company_id'
AND pronamespace = 'auth'::regnamespace;

-- =====================================================
-- 3. VERIFICAR POLÍTICAS RLS
-- =====================================================

-- Listar todas as políticas RLS criadas
SELECT 
  'POLÍTICAS RLS' as categoria,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operacao,
  CASE 
    WHEN qual IS NOT NULL THEN '✅ Com USING'
    ELSE '⚠️ Sem USING'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN '✅ Com WITH CHECK'
    ELSE '⚠️ Sem WITH CHECK'
  END as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('companies', 'users', 'clients', 'pets', 'services', 'appointments', 'transactions', 'notifications')
ORDER BY tablename, policyname;

-- =====================================================
-- 4. VERIFICAR FUNÇÕES DE SETUP
-- =====================================================

-- Verificar se as funções de setup foram criadas
SELECT 
  'FUNÇÕES DE SETUP' as categoria,
  proname as nome_funcao,
  pronamespace::regnamespace as schema,
  pronargs as num_argumentos,
  prosecdef as security_definer,
  CASE 
    WHEN proname = 'create_initial_user_and_company' THEN '✅ Função de Setup Principal'
    WHEN proname = 'create_test_data' THEN '✅ Função de Dados de Teste'
    WHEN proname = 'clean_test_data' THEN '✅ Função de Limpeza'
    ELSE '⚠️ Função Desconhecida'
  END as status
FROM pg_proc 
WHERE proname IN ('create_initial_user_and_company', 'create_test_data', 'clean_test_data')
AND pronamespace = 'public'::regnamespace
ORDER BY proname;

-- =====================================================
-- 5. VERIFICAR USUÁRIO ATUAL
-- =====================================================

-- Verificar informações do usuário autenticado
SELECT 
  'USUÁRIO ATUAL' as categoria,
  auth.uid() as user_id,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN '✅ Usuário Autenticado'
    ELSE '❌ Usuário Não Autenticado'
  END as status_auth,
  auth.role() as role_atual;

-- =====================================================
-- 6. TESTAR FUNÇÃO HELPER
-- =====================================================

-- Testar se a função helper funciona (só funciona se usuário estiver autenticado)
SELECT 
  'TESTE FUNÇÃO HELPER' as categoria,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN
      CASE 
        WHEN auth.get_user_company_id() IS NOT NULL THEN 
          '✅ Função retorna company_id: ' || auth.get_user_company_id()::text
        ELSE 
          '⚠️ Função retorna NULL (usuário pode não ter company_id)'
      END
    ELSE '❌ Não é possível testar - usuário não autenticado'
  END as resultado;

-- =====================================================
-- 7. VERIFICAR DADOS EXISTENTES
-- =====================================================

-- Contar registros nas tabelas principais
SELECT 
  'CONTAGEM DE DADOS' as categoria,
  'companies' as tabela,
  COUNT(*) as total_registros
FROM companies
UNION ALL
SELECT 
  'CONTAGEM DE DADOS' as categoria,
  'users' as tabela,
  COUNT(*) as total_registros
FROM users
UNION ALL
SELECT 
  'CONTAGEM DE DADOS' as categoria,
  'clients' as tabela,
  COUNT(*) as total_registros
FROM clients
UNION ALL
SELECT 
  'CONTAGEM DE DADOS' as categoria,
  'pets' as tabela,
  COUNT(*) as total_registros
FROM pets
ORDER BY tabela;

-- =====================================================
-- 8. VERIFICAR ESTRUTURA DAS TABELAS PRINCIPAIS
-- =====================================================

-- Verificar estrutura da tabela users
SELECT 
  'ESTRUTURA USERS' as categoria,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name = 'id' THEN '✅ Chave primária'
    WHEN column_name = 'company_id' THEN '✅ Referência para empresa'
    WHEN column_name = 'email' THEN '✅ Email do usuário'
    WHEN column_name = 'role' THEN '✅ Papel do usuário'
    ELSE '📋 Campo adicional'
  END as descricao
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela companies
SELECT 
  'ESTRUTURA COMPANIES' as categoria,
  column_name,
  data_type,
  is_nullable,
  column_default,
  CASE 
    WHEN column_name = 'id' THEN '✅ Chave primária'
    WHEN column_name = 'plan_type' THEN '✅ Tipo de plano'
    WHEN column_name = 'subscription_status' THEN '✅ Status da assinatura'
    ELSE '📋 Campo adicional'
  END as descricao
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'companies'
ORDER BY ordinal_position;

-- =====================================================
-- 9. VERIFICAR CONSTRAINTS E FOREIGN KEYS
-- =====================================================

-- Verificar foreign keys importantes
SELECT 
  'FOREIGN KEYS' as categoria,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  CASE 
    WHEN tc.table_name = 'users' AND ccu.table_name = 'companies' THEN '✅ Users -> Companies'
    WHEN tc.table_name = 'clients' AND ccu.table_name = 'companies' THEN '✅ Clients -> Companies'
    WHEN tc.table_name = 'pets' AND ccu.table_name = 'clients' THEN '✅ Pets -> Clients'
    ELSE '📋 Outra relação'
  END as descricao
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('users', 'clients', 'pets', 'services', 'appointments')
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 10. RESUMO DO DIAGNÓSTICO
-- =====================================================

-- Resumo final
SELECT 
  'RESUMO DIAGNÓSTICO' as categoria,
  'Status Geral' as item,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM pg_proc 
      WHERE proname = 'get_user_company_id' 
      AND pronamespace = 'auth'::regnamespace
    ) > 0 
    AND (
      SELECT COUNT(*) FROM pg_policies 
      WHERE schemaname = 'public'
    ) > 0
    THEN '✅ Solução Segura Implementada'
    ELSE '❌ Solução Não Implementada Completamente'
  END as status;

-- =====================================================
-- INSTRUÇÕES PARA USO:
-- =====================================================
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Analise os resultados de cada seção
-- 3. Verifique se todos os itens têm status ✅
-- 4. Se houver ❌, execute novamente o fix_rls_safe.sql
-- =====================================================

-- Mostrar timestamp do diagnóstico
SELECT 
  'DIAGNÓSTICO EXECUTADO EM' as categoria,
  NOW() as timestamp_utc,
  NOW() AT TIME ZONE 'America/Sao_Paulo' as timestamp_brasilia;