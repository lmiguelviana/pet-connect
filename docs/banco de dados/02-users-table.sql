-- =====================================================
-- TABELA USERS (Usuários/Funcionários)
-- =====================================================
-- Execute este script após criar a tabela Companies

-- Criar tabela Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Dados pessoais
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  
  -- Permissões
  role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('owner', 'admin', 'employee')),
  permissions JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para Users
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para Users
CREATE POLICY "Users can view their own company users" ON users
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- =====================================================
-- TABELA USERS CRIADA COM SUCESSO!
-- =====================================================
-- Próximo passo: Execute o script 03-clients-table.sql
-- =====================================================