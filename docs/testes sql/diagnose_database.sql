-- =====================================================
-- DIAGNÓSTICO DO BANCO DE DADOS - Pet Connect
-- =====================================================
-- Este script verifica o estado atual do banco e identifica problemas

-- =====================================================
-- 1. VERIFICAR SE AS TABELAS EXISTEM
-- =====================================================

SELECT 
  'TABELAS EXISTENTES' as categoria,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'companies', 'users', 'clients', 'pets', 'pet_photos',
  'services', 'appointments', 'transactions', 'notifications'
)
ORDER BY table_name;

-- =====================================================
-- 2. VERIFICAR POLÍTICAS RLS ATUAIS
-- =====================================================

SELECT 
  'POLÍTICAS RLS' as categoria,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 3. VERIFICAR SE RLS ESTÁ HABILITADO
-- =====================================================

SELECT 
  'RLS STATUS' as categoria,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
  'companies', 'users', 'clients', 'pets', 'pet_photos',
  'services', 'appointments', 'transactions', 'notifications'
)
ORDER BY tablename;

-- =====================================================
-- 4. VERIFICAR DADOS EXISTENTES
-- =====================================================

-- Contar registros em cada tabela
SELECT 'CONTAGEM DE DADOS' as categoria, 'companies' as tabela, COUNT(*) as total FROM companies
UNION ALL
SELECT 'CONTAGEM DE DADOS', 'users', COUNT(*) FROM users
UNION ALL
SELECT 'CONTAGEM DE DADOS', 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'CONTAGEM DE DADOS', 'pets', COUNT(*) FROM pets
UNION ALL
SELECT 'CONTAGEM DE DADOS', 'services', COUNT(*) FROM services
UNION ALL
SELECT 'CONTAGEM DE DADOS', 'appointments', COUNT(*) FROM appointments
ORDER BY tabela;

-- =====================================================
-- 5. VERIFICAR ESTRUTURA DA TABELA USERS
-- =====================================================

SELECT 
  'ESTRUTURA USERS' as categoria,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

-- =====================================================
-- 6. VERIFICAR USUÁRIOS EXISTENTES
-- =====================================================

-- Esta consulta pode falhar se RLS estiver bloqueando
-- Isso é esperado e confirma o problema
SELECT 
  'USUÁRIOS CADASTRADOS' as categoria,
  id,
  email,
  company_id,
  role,
  is_active,
  created_at
FROM users
LIMIT 5;

-- =====================================================
-- 7. VERIFICAR EMPRESAS EXISTENTES
-- =====================================================

-- Esta consulta também pode falhar devido ao RLS
SELECT 
  'EMPRESAS CADASTRADAS' as categoria,
  id,
  name,
  email,
  plan_type,
  subscription_status,
  created_at
FROM companies
LIMIT 5;

-- =====================================================
-- 8. VERIFICAR FUNÇÕES CUSTOMIZADAS
-- =====================================================

SELECT 
  'FUNÇÕES CUSTOMIZADAS' as categoria,
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'update_updated_at_column',
  'check_free_plan_limits',
  'cleanup_old_data',
  'backup_company_data'
)
ORDER BY routine_name;

-- =====================================================
-- 9. VERIFICAR TRIGGERS
-- =====================================================

SELECT 
  'TRIGGERS' as categoria,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 10. TESTE DE AUTENTICAÇÃO (INFORMATIVO)
-- =====================================================

-- Mostrar informações sobre o usuário atual (se autenticado)
SELECT 
  'USUÁRIO ATUAL' as categoria,
  auth.uid() as user_id,
  auth.jwt() as jwt_info;

-- =====================================================
-- INTERPRETAÇÃO DOS RESULTADOS:
-- =====================================================
-- 
-- Se você vir erros como:
-- "new row violates row-level security policy"
-- "permission denied for table"
-- 
-- Isso confirma que o problema são as políticas RLS mal configuradas.
-- 
-- Execute o script fix_rls_policies.sql para corrigir.
-- 
-- =====================================================