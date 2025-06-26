-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS - Pet Connect
-- =====================================================
-- Este script corrige o problema das políticas RLS que impedem
-- a adição de dados nas páginas do sistema

-- PROBLEMA IDENTIFICADO:
-- As políticas RLS estão usando auth.jwt() ->> 'company_id' mas o JWT
-- do Supabase não contém company_id por padrão, causando falha nas consultas

-- SOLUÇÃO:
-- Recriar as políticas para permitir acesso baseado em auth.uid() primeiro,
-- depois usar company_id obtido da tabela users

-- =====================================================
-- 1. REMOVER POLÍTICAS EXISTENTES
-- =====================================================

-- Remover políticas da tabela companies
DROP POLICY IF EXISTS "Users can view their own company" ON companies;

-- Remover políticas da tabela users
DROP POLICY IF EXISTS "Users can view their own company users" ON users;

-- Remover políticas da tabela clients
DROP POLICY IF EXISTS "Users can view their own company clients" ON clients;

-- Remover políticas da tabela pets
DROP POLICY IF EXISTS "Users can view their own company pets" ON pets;

-- Remover políticas da tabela services
DROP POLICY IF EXISTS "Users can view their own company services" ON services;

-- Remover políticas da tabela appointments
DROP POLICY IF EXISTS "Users can view their own company appointments" ON appointments;

-- =====================================================
-- 2. CRIAR POLÍTICAS CORRIGIDAS
-- =====================================================

-- Política para USERS - permite acesso aos próprios dados
CREATE POLICY "Users can access their own data" ON users
  FOR ALL USING (id = auth.uid());

-- Política para COMPANIES - permite acesso via company_id do usuário
CREATE POLICY "Users can access their company" ON companies
  FOR ALL USING (
    id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Política para CLIENTS - permite acesso via company_id do usuário
CREATE POLICY "Users can access their company clients" ON clients
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Política para PETS - permite acesso via company_id do usuário
CREATE POLICY "Users can access their company pets" ON pets
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Política para SERVICES - permite acesso via company_id do usuário
CREATE POLICY "Users can access their company services" ON services
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Política para APPOINTMENTS - permite acesso via company_id do usuário
CREATE POLICY "Users can access their company appointments" ON appointments
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Política para PET_PHOTOS - permite acesso via company_id do usuário
CREATE POLICY "Users can access their company pet photos" ON pet_photos
  FOR ALL USING (
    pet_id IN (
      SELECT p.id FROM pets p
      INNER JOIN users u ON p.company_id = u.company_id
      WHERE u.id = auth.uid()
    )
  );

-- Política para TRANSACTIONS - permite acesso via company_id do usuário
CREATE POLICY "Users can access their company transactions" ON transactions
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Política para NOTIFICATIONS - permite acesso via company_id do usuário
CREATE POLICY "Users can access their company notifications" ON notifications
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- =====================================================
-- 3. CRIAR FUNÇÃO HELPER PARA OBTER COMPANY_ID
-- =====================================================

-- Função para obter company_id do usuário autenticado
CREATE OR REPLACE FUNCTION auth.get_user_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT company_id 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. VERIFICAR SE AS POLÍTICAS FORAM APLICADAS
-- =====================================================

-- Consulta para verificar as políticas criadas
SELECT 
  schemaname,
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
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique se não há erros na execução
-- 3. Teste o login e acesso às páginas do sistema
-- 4. Se ainda houver problemas, verifique se:
--    - As tabelas existem
--    - O usuário está sendo criado corretamente na tabela users
--    - O company_id está sendo definido corretamente

-- =====================================================
-- POLÍTICAS RLS CORRIGIDAS COM SUCESSO!
-- =====================================================