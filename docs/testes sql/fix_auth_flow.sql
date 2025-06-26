-- =====================================================
-- CORREÇÃO DO FLUXO DE AUTENTICAÇÃO - Pet Connect
-- =====================================================
-- Este script corrige o fluxo de criação de usuários e empresas

-- =====================================================
-- 1. CRIAR FUNÇÃO PARA HANDLE DE NOVOS USUÁRIOS
-- =====================================================

-- Função que será executada quando um novo usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- Verificar se é o primeiro usuário (criação de empresa)
  -- Isso acontece quando não há company_id nos metadados
  IF NEW.raw_user_meta_data->>'company_id' IS NULL THEN
    -- Criar nova empresa
    INSERT INTO public.companies (name, email, plan_type)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Nova Empresa'),
      NEW.email,
      'free'
    )
    RETURNING id INTO new_company_id;
    
    -- Criar usuário como owner da empresa
    INSERT INTO public.users (id, company_id, name, email, role)
    VALUES (
      NEW.id,
      new_company_id,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      NEW.email,
      'owner'
    );
  ELSE
    -- Usuário sendo adicionado a empresa existente
    INSERT INTO public.users (id, company_id, name, email, role)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'company_id')::UUID,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CRIAR TRIGGER PARA NOVOS USUÁRIOS
-- =====================================================

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar novo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 3. CRIAR FUNÇÃO PARA OBTER DADOS DO USUÁRIO ATUAL
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_current_user_data()
RETURNS TABLE(
  user_id UUID,
  company_id UUID,
  user_name TEXT,
  user_email TEXT,
  user_role TEXT,
  company_name TEXT,
  company_plan TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.company_id,
    u.name,
    u.email,
    u.role,
    c.name,
    c.plan_type
  FROM users u
  INNER JOIN companies c ON u.company_id = c.id
  WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. CRIAR POLÍTICAS TEMPORÁRIAS PARA SETUP
-- =====================================================

-- Política temporária para permitir inserção inicial de dados
CREATE POLICY "Allow initial setup" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow initial company setup" ON companies
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 5. FUNÇÃO PARA CRIAR DADOS DE TESTE
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_test_data()
RETURNS TEXT AS $$
DECLARE
  test_company_id UUID;
  test_user_id UUID;
BEGIN
  -- Criar empresa de teste
  INSERT INTO companies (name, email, plan_type)
  VALUES ('Pet Shop Teste', 'teste@petshop.com', 'premium')
  RETURNING id INTO test_company_id;
  
  -- Criar usuário de teste
  test_user_id := gen_random_uuid();
  INSERT INTO users (id, company_id, name, email, role)
  VALUES (test_user_id, test_company_id, 'Usuário Teste', 'teste@petshop.com', 'owner');
  
  -- Criar alguns clientes de teste
  INSERT INTO clients (company_id, name, email, phone)
  VALUES 
    (test_company_id, 'João Silva', 'joao@email.com', '(11) 99999-9999'),
    (test_company_id, 'Maria Santos', 'maria@email.com', '(11) 88888-8888');
  
  -- Criar alguns pets de teste
  INSERT INTO pets (company_id, client_id, name, species, breed, age, weight)
  SELECT 
    test_company_id,
    c.id,
    CASE 
      WHEN c.name = 'João Silva' THEN 'Rex'
      ELSE 'Mimi'
    END,
    CASE 
      WHEN c.name = 'João Silva' THEN 'Cão'
      ELSE 'Gato'
    END,
    CASE 
      WHEN c.name = 'João Silva' THEN 'Labrador'
      ELSE 'Persa'
    END,
    3,
    CASE 
      WHEN c.name = 'João Silva' THEN 25.5
      ELSE 4.2
    END
  FROM clients c
  WHERE c.company_id = test_company_id;
  
  -- Criar alguns serviços de teste
  INSERT INTO services (company_id, name, description, price, duration)
  VALUES 
    (test_company_id, 'Banho e Tosa', 'Banho completo com tosa higiênica', 50.00, 60),
    (test_company_id, 'Consulta Veterinária', 'Consulta clínica geral', 80.00, 30);
  
  RETURN 'Dados de teste criados com sucesso! Company ID: ' || test_company_id::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. FUNÇÃO PARA LIMPAR DADOS DE TESTE
-- =====================================================

CREATE OR REPLACE FUNCTION public.clean_test_data()
RETURNS TEXT AS $$
BEGIN
  DELETE FROM appointments WHERE company_id IN (SELECT id FROM companies WHERE email = 'teste@petshop.com');
  DELETE FROM services WHERE company_id IN (SELECT id FROM companies WHERE email = 'teste@petshop.com');
  DELETE FROM pets WHERE company_id IN (SELECT id FROM companies WHERE email = 'teste@petshop.com');
  DELETE FROM clients WHERE company_id IN (SELECT id FROM companies WHERE email = 'teste@petshop.com');
  DELETE FROM users WHERE company_id IN (SELECT id FROM companies WHERE email = 'teste@petshop.com');
  DELETE FROM companies WHERE email = 'teste@petshop.com';
  
  RETURN 'Dados de teste removidos com sucesso!';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. VERIFICAR SE TUDO FOI CRIADO CORRETAMENTE
-- =====================================================

SELECT 
  'FUNÇÕES CRIADAS' as status,
  routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'handle_new_user',
  'get_current_user_data',
  'create_test_data',
  'clean_test_data'
)
ORDER BY routine_name;

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 
-- 1. Execute este script no Supabase SQL Editor
-- 2. Execute o script fix_rls_policies.sql
-- 3. Teste criando dados com: SELECT create_test_data();
-- 4. Verifique se os dados foram criados corretamente
-- 5. Limpe os dados de teste com: SELECT clean_test_data();
-- 
-- =====================================================