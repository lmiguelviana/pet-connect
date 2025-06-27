-- CORREÇÃO SEGURA DA FUNÇÃO get_user_company_id() PARA SER DETERMINÍSTICA
-- =====================================================================
-- Este script corrige o problema de is_deterministic = NO na função
-- get_user_company_id() SEM remover a função existente, evitando erros de dependência

-- PASSO 1: DIAGNÓSTICO - Verificar estado atual da função
-- ========================================================
SELECT 
    routine_name,
    routine_schema,
    security_type,
    is_deterministic,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_user_company_id' AND routine_schema = 'public';

-- PASSO 2: ATUALIZAR A FUNÇÃO COM CONFIGURAÇÕES CORRETAS (SEM REMOVER)
-- ====================================================================

-- Usar CREATE OR REPLACE para modificar a função sem afetar dependências
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

-- PASSO 3: VERIFICAÇÃO PÓS-CORREÇÃO
-- ==================================

-- Verificar se a função foi atualizada corretamente
SELECT 
    routine_name,
    routine_schema,
    security_type,
    is_deterministic,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_user_company_id' AND routine_schema = 'public';

-- Verificar se as políticas RLS ainda estão funcionando
SELECT 
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('companies', 'users', 'clients', 'pets', 'services', 'appointments')
ORDER BY tablename, policyname;

-- PASSO 4: TESTE DA FUNÇÃO (OPCIONAL)
-- ====================================
-- Descomente a linha abaixo para testar a função
-- (só funciona se houver um usuário logado)
-- SELECT public.get_user_company_id();

-- ================================================================
-- INSTRUÇÕES PARA APLICAR:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole e execute este script COMPLETO
-- 4. Verifique se is_deterministic agora mostra 'YES'
-- 5. Teste o carregamento de dados na aplicação
-- ================================================================

-- NOTAS IMPORTANTES:
-- - Este script usa CREATE OR REPLACE em vez de DROP, evitando erros de dependência
-- - A função agora é marcada como STABLE, o que a torna determinística
-- - SECURITY DEFINER permite que ela acesse dados com privilégios elevados
-- - Todas as políticas RLS que dependem da função continuam funcionando
-- - Isso deve melhorar significativamente a performance das políticas RLS
-- - A função continua funcionando da mesma forma, apenas com melhor performance