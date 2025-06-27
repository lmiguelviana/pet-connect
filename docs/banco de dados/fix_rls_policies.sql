-- CORREÇÃO DAS POLÍTICAS RLS PARA RESOLVER ERROS 400
-- =====================================================
-- Este script corrige as políticas RLS que estão causando os erros 400
-- ao carregar pets e serviços

-- 1. REMOVER POLÍTICAS ANTIGAS PROBLEMÁTICAS
DROP POLICY IF EXISTS "Users can manage their company's services" ON services;
DROP POLICY IF EXISTS "Users can manage their company's pets" ON pets;
DROP POLICY IF EXISTS "Users can manage their company's clients" ON clients;
DROP POLICY IF EXISTS "companies_policy" ON companies;
DROP POLICY IF EXISTS "users_policy" ON users;
DROP POLICY IF EXISTS "appointments_policy" ON appointments;
DROP POLICY IF EXISTS "transactions_policy" ON transactions;
DROP POLICY IF EXISTS "notifications_policy" ON notifications;

-- 2. CRIAR FUNÇÃO HELPER SEGURA NO SCHEMA PUBLIC
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

-- 3. POLÍTICAS RLS PARA COMPANIES
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

-- 4. POLÍTICAS RLS PARA USERS
CREATE POLICY "users_policy" ON users
  FOR ALL
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- 5. POLÍTICAS RLS PARA CLIENTS
CREATE POLICY "clients_policy" ON clients
  FOR ALL
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- 6. POLÍTICAS RLS PARA PETS
CREATE POLICY "pets_policy" ON pets
  FOR ALL
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- 7. POLÍTICAS RLS PARA SERVICES
CREATE POLICY "services_policy" ON services
  FOR ALL
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- 8. POLÍTICAS RLS PARA APPOINTMENTS
CREATE POLICY "appointments_policy" ON appointments
  FOR ALL
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- 9. POLÍTICAS RLS PARA TRANSACTIONS
CREATE POLICY "transactions_policy" ON transactions
  FOR ALL
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- 10. POLÍTICAS RLS PARA NOTIFICATIONS
CREATE POLICY "notifications_policy" ON notifications
  FOR ALL
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- =====================================================
-- INSTRUÇÕES PARA APLICAR:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole e execute este script
-- 4. Teste novamente o carregamento de pets e serviços
-- =====================================================