-- =====================================================
-- SOLUÇÃO FINAL PARA RLS - SEM ACESSO AO SCHEMA AUTH
-- =====================================================
-- Esta solução evita o erro "permission denied for schema auth"
-- usando apenas o schema public e auth.uid()

-- 1. PRIMEIRO: Remover todas as políticas RLS problemáticas
DROP POLICY IF EXISTS "companies_policy" ON companies;
DROP POLICY IF EXISTS "users_policy" ON users;
DROP POLICY IF EXISTS "clients_policy" ON clients;
DROP POLICY IF EXISTS "pets_policy" ON pets;
DROP POLICY IF EXISTS "services_policy" ON services;
DROP POLICY IF EXISTS "appointments_policy" ON appointments;
DROP POLICY IF EXISTS "transactions_policy" ON transactions;
DROP POLICY IF EXISTS "notifications_policy" ON notifications;

-- 2. Criar função helper no schema PUBLIC (não auth)
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
-- Usuários podem ver apenas sua própria empresa
CREATE POLICY "companies_select_policy" ON companies
  FOR SELECT
  USING (id = public.get_user_company_id());

-- Apenas owners podem atualizar a empresa
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
-- Usuários podem ver outros usuários da mesma empresa
CREATE POLICY "users_select_policy" ON users
  FOR SELECT
  USING (company_id = public.get_user_company_id());

-- Usuários podem atualizar apenas seus próprios dados
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE
  USING (id = auth.uid());

-- Apenas owners podem inserir novos usuários
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT
  WITH CHECK (
    company_id = public.get_user_company_id()
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'owner'
    )
  );

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

-- 11. Função para criar empresa e usuário inicial
CREATE OR REPLACE FUNCTION public.create_initial_user_and_company(
  company_name text,
  user_name text,
  user_email text,
  user_role text DEFAULT 'owner'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_company_id uuid;
  current_user_id uuid;
  result json;
BEGIN
  -- Obter o ID do usuário autenticado
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Verificar se o usuário já tem uma empresa
  IF EXISTS (SELECT 1 FROM public.users WHERE id = current_user_id) THEN
    RAISE EXCEPTION 'Usuário já possui uma empresa';
  END IF;
  
  -- Criar nova empresa
  INSERT INTO public.companies (name, plan_type, subscription_status)
  VALUES (company_name, 'free', 'active')
  RETURNING id INTO new_company_id;
  
  -- Criar usuário na tabela users
  INSERT INTO public.users (id, company_id, name, email, role)
  VALUES (current_user_id, new_company_id, user_name, user_email, user_role);
  
  -- Retornar resultado
  result := json_build_object(
    'success', true,
    'company_id', new_company_id,
    'user_id', current_user_id,
    'message', 'Empresa e usuário criados com sucesso'
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 12. Função para criar dados de teste
CREATE OR REPLACE FUNCTION public.create_test_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_company_id uuid;
  client_id uuid;
  pet_id uuid;
  service_id uuid;
BEGIN
  -- Obter company_id do usuário
  user_company_id := public.get_user_company_id();
  
  IF user_company_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não possui empresa associada';
  END IF;
  
  -- Criar cliente de teste
  INSERT INTO public.clients (company_id, name, email, phone)
  VALUES (user_company_id, 'Cliente Teste', 'teste@email.com', '11999999999')
  RETURNING id INTO client_id;
  
  -- Criar pet de teste
  INSERT INTO public.pets (company_id, client_id, name, species, breed, age, weight)
  VALUES (user_company_id, client_id, 'Rex', 'Cão', 'Labrador', 3, 25.5)
  RETURNING id INTO pet_id;
  
  -- Criar serviço de teste
  INSERT INTO public.services (company_id, name, description, price, duration)
  VALUES (user_company_id, 'Banho e Tosa', 'Banho completo com tosa higiênica', 50.00, 60)
  RETURNING id INTO service_id;
  
  -- Criar agendamento de teste
  INSERT INTO public.appointments (company_id, client_id, pet_id, service_id, scheduled_at, status)
  VALUES (user_company_id, client_id, pet_id, service_id, NOW() + INTERVAL '1 day', 'scheduled');
  
  RETURN json_build_object(
    'success', true,
    'client_id', client_id,
    'pet_id', pet_id,
    'service_id', service_id,
    'message', 'Dados de teste criados com sucesso'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 13. Função para limpar dados de teste
CREATE OR REPLACE FUNCTION public.clean_test_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_company_id uuid;
BEGIN
  user_company_id := public.get_user_company_id();
  
  IF user_company_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não possui empresa associada';
  END IF;
  
  -- Deletar em ordem (respeitando foreign keys)
  DELETE FROM public.appointments WHERE company_id = user_company_id;
  DELETE FROM public.transactions WHERE company_id = user_company_id;
  DELETE FROM public.notifications WHERE company_id = user_company_id;
  DELETE FROM public.pets WHERE company_id = user_company_id;
  DELETE FROM public.clients WHERE company_id = user_company_id;
  DELETE FROM public.services WHERE company_id = user_company_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Dados de teste removidos com sucesso'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 14. Garantir que RLS está habilitado em todas as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Para criar empresa e usuário inicial:
--    SELECT public.create_initial_user_and_company('Meu Pet Shop', 'João Silva', 'joao@petshop.com');
-- 3. Para criar dados de teste:
--    SELECT public.create_test_data();
-- 4. Para limpar dados de teste:
--    SELECT public.clean_test_data();
-- 5. Para verificar se está funcionando:
--    SELECT * FROM clients; (deve mostrar apenas clientes da sua empresa)
-- =====================================================