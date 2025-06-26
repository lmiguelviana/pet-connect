-- =====================================================
-- CORREÇÃO SEGURA DAS POLÍTICAS RLS - PET CONNECT
-- =====================================================
-- Este script corrige as políticas RLS sem interferir no schema auth
-- Baseado na documentação oficial do Supabase sobre erros 500

-- =====================================================
-- 1. FUNÇÃO HELPER PARA OBTER COMPANY_ID DO USUÁRIO
-- =====================================================

-- Criar função helper que busca o company_id do usuário autenticado
CREATE OR REPLACE FUNCTION auth.get_user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id 
  FROM public.users 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- =====================================================
-- 2. REMOVER POLÍTICAS RLS PROBLEMÁTICAS
-- =====================================================

-- Companies table
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;

-- Users table  
DROP POLICY IF EXISTS "Users can view users from their company" ON users;
DROP POLICY IF EXISTS "Users can insert users in their company" ON users;
DROP POLICY IF EXISTS "Users can update users from their company" ON users;

-- Clients table
DROP POLICY IF EXISTS "Users can view clients from their company" ON clients;
DROP POLICY IF EXISTS "Users can insert clients in their company" ON clients;
DROP POLICY IF EXISTS "Users can update clients from their company" ON clients;
DROP POLICY IF EXISTS "Users can delete clients from their company" ON clients;

-- Pets table
DROP POLICY IF EXISTS "Users can view pets from their company" ON pets;
DROP POLICY IF EXISTS "Users can insert pets in their company" ON pets;
DROP POLICY IF EXISTS "Users can update pets from their company" ON pets;
DROP POLICY IF EXISTS "Users can delete pets from their company" ON pets;

-- Services table
DROP POLICY IF EXISTS "Users can view services from their company" ON services;
DROP POLICY IF EXISTS "Users can insert services in their company" ON services;
DROP POLICY IF EXISTS "Users can update services from their company" ON services;
DROP POLICY IF EXISTS "Users can delete services from their company" ON services;

-- Appointments table
DROP POLICY IF EXISTS "Users can view appointments from their company" ON appointments;
DROP POLICY IF EXISTS "Users can insert appointments in their company" ON appointments;
DROP POLICY IF EXISTS "Users can update appointments from their company" ON appointments;
DROP POLICY IF EXISTS "Users can delete appointments from their company" ON appointments;

-- Transactions table
DROP POLICY IF EXISTS "Users can view transactions from their company" ON transactions;
DROP POLICY IF EXISTS "Users can insert transactions in their company" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions from their company" ON transactions;

-- Notifications table
DROP POLICY IF EXISTS "Users can view notifications from their company" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications in their company" ON notifications;
DROP POLICY IF EXISTS "Users can update notifications from their company" ON notifications;
DROP POLICY IF EXISTS "Users can delete notifications from their company" ON notifications;

-- =====================================================
-- 3. CRIAR POLÍTICAS RLS SEGURAS
-- =====================================================

-- COMPANIES TABLE
-- Permite que usuários vejam apenas sua própria empresa
CREATE POLICY "Users can view their own company"
ON companies FOR SELECT
TO authenticated
USING (id = auth.get_user_company_id());

-- Permite que owners atualizem sua empresa
CREATE POLICY "Owners can update their company"
ON companies FOR UPDATE
TO authenticated
USING (
  id = auth.get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND company_id = companies.id 
    AND role = 'owner'
  )
)
WITH CHECK (
  id = auth.get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND company_id = companies.id 
    AND role = 'owner'
  )
);

-- USERS TABLE
-- Permite que usuários vejam outros usuários da mesma empresa
CREATE POLICY "Users can view users from their company"
ON users FOR SELECT
TO authenticated
USING (company_id = auth.get_user_company_id());

-- Permite que usuários vejam e atualizem seu próprio perfil
CREATE POLICY "Users can view and update their own profile"
ON users FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Permite que owners/admins insiram novos usuários
CREATE POLICY "Owners and admins can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  company_id = auth.get_user_company_id() AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND company_id = users.company_id 
    AND role IN ('owner', 'admin')
  )
);

-- CLIENTS TABLE
CREATE POLICY "Users can manage clients from their company"
ON clients FOR ALL
TO authenticated
USING (company_id = auth.get_user_company_id())
WITH CHECK (company_id = auth.get_user_company_id());

-- PETS TABLE
CREATE POLICY "Users can manage pets from their company"
ON pets FOR ALL
TO authenticated
USING (
  company_id = auth.get_user_company_id() OR
  client_id IN (
    SELECT id FROM clients 
    WHERE company_id = auth.get_user_company_id()
  )
)
WITH CHECK (
  company_id = auth.get_user_company_id() OR
  client_id IN (
    SELECT id FROM clients 
    WHERE company_id = auth.get_user_company_id()
  )
);

-- SERVICES TABLE
CREATE POLICY "Users can manage services from their company"
ON services FOR ALL
TO authenticated
USING (company_id = auth.get_user_company_id())
WITH CHECK (company_id = auth.get_user_company_id());

-- APPOINTMENTS TABLE
CREATE POLICY "Users can manage appointments from their company"
ON appointments FOR ALL
TO authenticated
USING (company_id = auth.get_user_company_id())
WITH CHECK (company_id = auth.get_user_company_id());

-- TRANSACTIONS TABLE
CREATE POLICY "Users can manage transactions from their company"
ON transactions FOR ALL
TO authenticated
USING (company_id = auth.get_user_company_id())
WITH CHECK (company_id = auth.get_user_company_id());

-- NOTIFICATIONS TABLE
CREATE POLICY "Users can manage notifications from their company"
ON notifications FOR ALL
TO authenticated
USING (company_id = auth.get_user_company_id())
WITH CHECK (company_id = auth.get_user_company_id());

-- =====================================================
-- 4. FUNÇÃO PARA CRIAR USUÁRIO INICIAL
-- =====================================================

-- Função para criar empresa e usuário inicial (sem trigger no auth)
CREATE OR REPLACE FUNCTION public.create_initial_user_and_company(
  user_email TEXT,
  user_name TEXT,
  company_name TEXT,
  company_email TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_company_id UUID;
  new_user_id UUID;
  current_user_id UUID;
BEGIN
  -- Verificar se o usuário está autenticado
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN json_build_object('error', 'User not authenticated');
  END IF;
  
  -- Verificar se o usuário já existe na tabela users
  SELECT id INTO new_user_id FROM users WHERE id = current_user_id;
  
  IF new_user_id IS NOT NULL THEN
    RETURN json_build_object('error', 'User already exists');
  END IF;
  
  -- Criar nova empresa
  INSERT INTO companies (name, email, plan_type, subscription_status)
  VALUES (company_name, COALESCE(company_email, user_email), 'free', 'active')
  RETURNING id INTO new_company_id;
  
  -- Criar usuário como owner da empresa
  INSERT INTO users (id, company_id, name, email, role)
  VALUES (current_user_id, new_company_id, user_name, user_email, 'owner')
  RETURNING id INTO new_user_id;
  
  RETURN json_build_object(
    'success', true,
    'company_id', new_company_id,
    'user_id', new_user_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- =====================================================
-- 5. DADOS DE TESTE (OPCIONAL)
-- =====================================================

-- Função para criar dados de teste
CREATE OR REPLACE FUNCTION public.create_test_data()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  test_company_id UUID;
  test_user_id UUID;
BEGIN
  -- Criar empresa de teste
  INSERT INTO companies (name, email, plan_type, subscription_status)
  VALUES ('Pet Shop Teste', 'teste@petshop.com', 'free', 'active')
  RETURNING id INTO test_company_id;
  
  -- Criar usuário de teste (usando um UUID fixo para testes)
  test_user_id := '00000000-0000-0000-0000-000000000001';
  
  INSERT INTO users (id, company_id, name, email, role)
  VALUES (test_user_id, test_company_id, 'Usuário Teste', 'teste@petshop.com', 'owner');
  
  RETURN 'Dados de teste criados com sucesso!';
END;
$$;

-- Função para limpar dados de teste
CREATE OR REPLACE FUNCTION public.clean_test_data()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM users WHERE email = 'teste@petshop.com';
  DELETE FROM companies WHERE email = 'teste@petshop.com';
  
  RETURN 'Dados de teste removidos com sucesso!';
END;
$$;

-- =====================================================
-- 6. VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se todas as tabelas têm RLS habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('companies', 'users', 'clients', 'pets', 'services', 'appointments', 'transactions', 'notifications');

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

COMMIT;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Após o login do usuário, chame a função:
--    SELECT public.create_initial_user_and_company(
--      'email@usuario.com',
--      'Nome do Usuário', 
--      'Nome da Empresa'
--    );
-- 3. Para testes, use: SELECT public.create_test_data();
-- 4. Para limpar testes: SELECT public.clean_test_data();
-- =====================================================