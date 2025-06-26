-- =====================================================
-- DIAGNÓSTICO DA SOLUÇÃO FINAL DE RLS
-- =====================================================
-- Este script verifica se a solução final foi aplicada corretamente
-- e se o sistema está funcionando sem erros de permissão

-- 1. VERIFICAR INFORMAÇÕES DO USUÁRIO AUTENTICADO
SELECT 
  'USUÁRIO AUTENTICADO' as categoria,
  auth.uid() as user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ Não autenticado'
    ELSE '✅ Autenticado'
  END as status;

-- 2. VERIFICAR SE A FUNÇÃO HELPER EXISTE E FUNCIONA
SELECT 
  'FUNÇÃO HELPER' as categoria,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'public' 
      AND p.proname = 'get_user_company_id'
    ) THEN '✅ Função existe'
    ELSE '❌ Função não encontrada'
  END as status;

-- 3. TESTAR A FUNÇÃO HELPER
SELECT 
  'TESTE FUNÇÃO HELPER' as categoria,
  public.get_user_company_id() as company_id,
  CASE 
    WHEN public.get_user_company_id() IS NOT NULL THEN '✅ Retorna company_id'
    WHEN auth.uid() IS NULL THEN '⚠️ Usuário não autenticado'
    ELSE '❌ Usuário sem empresa'
  END as status;

-- 4. VERIFICAR RLS HABILITADO NAS TABELAS
SELECT 
  'RLS STATUS' as categoria,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Habilitado'
    ELSE '❌ RLS Desabilitado'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('companies', 'users', 'clients', 'pets', 'services', 'appointments', 'transactions', 'notifications')
ORDER BY tablename;

-- 5. VERIFICAR POLÍTICAS RLS CRIADAS
SELECT 
  'POLÍTICAS RLS' as categoria,
  tablename,
  policyname,
  cmd as operacao,
  '✅ Política ativa' as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('companies', 'users', 'clients', 'pets', 'services', 'appointments', 'transactions', 'notifications')
ORDER BY tablename, policyname;

-- 6. VERIFICAR ESTRUTURA DA TABELA USERS
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

-- 7. VERIFICAR ESTRUTURA DA TABELA COMPANIES
SELECT 
  'ESTRUTURA COMPANIES' as categoria,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'companies'
ORDER BY ordinal_position;

-- 8. VERIFICAR FUNÇÕES DE SETUP DISPONÍVEIS
SELECT 
  'FUNÇÕES SETUP' as categoria,
  p.proname as function_name,
  '✅ Disponível' as status
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' 
AND p.proname IN (
  'create_initial_user_and_company',
  'create_test_data',
  'clean_test_data',
  'get_user_company_id'
)
ORDER BY p.proname;

-- 9. VERIFICAR DADOS EXISTENTES (se houver)
SELECT 
  'DADOS EXISTENTES' as categoria,
  'companies' as tabela,
  COUNT(*) as total_registros
FROM companies
WHERE id = public.get_user_company_id()
UNION ALL
SELECT 
  'DADOS EXISTENTES' as categoria,
  'users' as tabela,
  COUNT(*) as total_registros
FROM users
WHERE company_id = public.get_user_company_id()
UNION ALL
SELECT 
  'DADOS EXISTENTES' as categoria,
  'clients' as tabela,
  COUNT(*) as total_registros
FROM clients
WHERE company_id = public.get_user_company_id()
UNION ALL
SELECT 
  'DADOS EXISTENTES' as categoria,
  'pets' as tabela,
  COUNT(*) as total_registros
FROM pets
WHERE company_id = public.get_user_company_id()
UNION ALL
SELECT 
  'DADOS EXISTENTES' as categoria,
  'services' as tabela,
  COUNT(*) as total_registros
FROM services
WHERE company_id = public.get_user_company_id()
UNION ALL
SELECT 
  'DADOS EXISTENTES' as categoria,
  'appointments' as tabela,
  COUNT(*) as total_registros
FROM appointments
WHERE company_id = public.get_user_company_id();

-- 10. VERIFICAR CHAVES ESTRANGEIRAS IMPORTANTES
SELECT 
  'FOREIGN KEYS' as categoria,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  '✅ FK Configurada' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name IN ('users', 'clients', 'pets', 'appointments')
ORDER BY tc.table_name, kcu.column_name;

-- 11. TESTE DE ISOLAMENTO (se houver dados)
SELECT 
  'TESTE ISOLAMENTO' as categoria,
  'Tentativa de acessar dados de outras empresas' as teste,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Isolamento funcionando'
    ELSE '❌ Vazamento de dados detectado'
  END as resultado
FROM (
  SELECT * FROM companies WHERE id != COALESCE(public.get_user_company_id(), '00000000-0000-0000-0000-000000000000')
  UNION ALL
  SELECT id, name, plan_type, subscription_status, created_at, updated_at 
  FROM users WHERE company_id != COALESCE(public.get_user_company_id(), '00000000-0000-0000-0000-000000000000')
) as test_isolation;

-- 12. RESUMO FINAL
SELECT 
  '🎯 RESUMO FINAL' as categoria,
  CASE 
    WHEN auth.uid() IS NULL THEN 
      '❌ ERRO: Usuário não autenticado. Faça login no Supabase.'
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'public' AND p.proname = 'get_user_company_id'
    ) THEN 
      '❌ ERRO: Função helper não encontrada. Execute fix_rls_final.sql'
    WHEN public.get_user_company_id() IS NULL THEN 
      '⚠️ ATENÇÃO: Usuário sem empresa. Execute create_initial_user_and_company()'
    ELSE 
      '✅ SUCESSO: Sistema configurado e funcionando corretamente!'
  END as status,
  CASE 
    WHEN auth.uid() IS NOT NULL AND public.get_user_company_id() IS NOT NULL THEN
      'Próximo passo: Testar criação de clientes, pets e agendamentos'
    WHEN auth.uid() IS NOT NULL THEN
      'Próximo passo: SELECT public.create_initial_user_and_company(''Meu Pet Shop'', ''Seu Nome'', ''seu@email.com'');'
    ELSE
      'Próximo passo: Fazer login no Supabase Dashboard'
  END as proximo_passo;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Analise os resultados de cada seção
-- 3. Se aparecer "❌ ERRO" em alguma seção, siga as instruções
-- 4. Se tudo estiver "✅ SUCESSO", o sistema está funcionando
-- 5. Para criar dados de teste: SELECT public.create_test_data();
-- =====================================================