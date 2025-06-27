-- CORREÇÃO ROBUSTA DAS POLÍTICAS RLS - RESOLVE CONFLITOS DE POLÍTICAS EXISTENTES
-- ==================================================================================
-- Este script resolve o erro "policy already exists" removendo TODAS as políticas
-- existentes antes de criar as novas

-- PASSO 1: DIAGNÓSTICO - Listar todas as políticas RLS existentes
-- ================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('companies', 'users', 'clients', 'pets', 'services', 'appointments', 'transactions', 'notifications')
ORDER BY tablename, policyname;

-- PASSO 2: REMOÇÃO COMPLETA DE TODAS AS POLÍTICAS RLS EXISTENTES
-- ===============================================================

-- Remover TODAS as políticas da tabela companies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'companies'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON companies', policy_record.policyname);
    END LOOP;
END $$;

-- Remover TODAS as políticas da tabela users
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', policy_record.policyname);
    END LOOP;
END $$;

-- Remover TODAS as políticas da tabela clients
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'clients'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON clients', policy_record.policyname);
    END LOOP;
END $$;

-- Remover TODAS as políticas da tabela pets
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'pets'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON pets', policy_record.policyname);
    END LOOP;
END $$;

-- Remover TODAS as políticas da tabela services
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'services'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON services', policy_record.policyname);
    END LOOP;
END $$;

-- Remover TODAS as políticas da tabela appointments
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'appointments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON appointments', policy_record.policyname);
    END LOOP;
END $$;

-- Remover TODAS as políticas da tabela transactions
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'transactions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON transactions', policy_record.policyname);
    END LOOP;
END $$;

-- Remover TODAS as políticas da tabela notifications
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'notifications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON notifications', policy_record.policyname);
    END LOOP;
END $$;

-- PASSO 3: VERIFICAR E CRIAR A FUNÇÃO HELPER
-- ===========================================

-- Verificar se a função já existe
SELECT 
    routine_name,
    routine_schema,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'get_user_company_id' AND routine_schema = 'public';

-- Criar ou substituir a função helper
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

-- PASSO 4: CRIAR NOVAS POLÍTICAS RLS LIMPAS
-- ==========================================

-- Políticas para COMPANIES
CREATE POLICY "companies_select_policy" ON companies
  FOR SELECT
  USING (id = public.get_user_company_id());

CREATE POLICY "companies_update_policy" ON companies
  FOR UPDATE
  USING (
    id = public.get_user_company_id() 
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND company_id = companies.id 
      AND role = 'owner'
    )
  );

-- Políticas para USERS
CREATE POLICY "users_policy" ON users
  FOR ALL
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- Políticas para CLIENTS
CREATE POLICY "clients_policy" ON clients
  FOR ALL
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- Políticas para PETS
CREATE POLICY "pets_policy" ON pets
  FOR ALL
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- Políticas para SERVICES
CREATE POLICY "services_policy" ON services
  FOR ALL
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- Políticas para APPOINTMENTS
CREATE POLICY "appointments_policy" ON appointments
  FOR ALL
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- Políticas para TRANSACTIONS
CREATE POLICY "transactions_policy" ON transactions
  FOR ALL
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- Políticas para NOTIFICATIONS
CREATE POLICY "notifications_policy" ON notifications
  FOR ALL
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- PASSO 5: VERIFICAÇÃO FINAL
-- ===========================

-- Verificar se todas as políticas foram criadas corretamente
SELECT 
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('companies', 'users', 'clients', 'pets', 'services', 'appointments', 'transactions', 'notifications')
ORDER BY tablename, policyname;

-- Verificar se a função foi criada
SELECT 
    routine_name,
    routine_schema,
    security_type,
    is_deterministic
FROM information_schema.routines 
WHERE routine_name = 'get_user_company_id' AND routine_schema = 'public';

-- Testar a função (deve retornar o company_id do usuário logado)
-- SELECT public.get_user_company_id();

-- ==================================================================================
-- INSTRUÇÕES PARA APLICAR:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole e execute este script COMPLETO
-- 4. Verifique os resultados das consultas de verificação
-- 5. Teste novamente o carregamento de pets e serviços na aplicação
-- ==================================================================================

-- NOTAS IMPORTANTES:
-- - Este script remove TODAS as políticas RLS existentes das tabelas especificadas
-- - Isso garante uma aplicação limpa sem conflitos de nomes
-- - As consultas de diagnóstico e verificação ajudam a confirmar o resultado
-- - Execute o script completo de uma vez para garantir consistência