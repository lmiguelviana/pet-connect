-- =====================================================
-- TABELA COMPANIES (Pet Shops)
-- =====================================================
-- Execute este script primeiro para criar a tabela de empresas

-- Criar tabela Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  cnpj VARCHAR(18) UNIQUE,
  
  -- Plano e assinatura
  plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
  subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended')),
  subscription_expires_at TIMESTAMPTZ,
  
  -- Configurações
  settings JSONB DEFAULT '{}',
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para Companies
CREATE INDEX idx_companies_plan_type ON companies(plan_type);
CREATE INDEX idx_companies_subscription_status ON companies(subscription_status);

-- Habilitar RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para Companies
CREATE POLICY "Users can view their own company" ON companies
  FOR ALL USING (id = (auth.jwt() ->> 'company_id')::uuid);

-- =====================================================
-- TABELA COMPANIES CRIADA COM SUCESSO!
-- =====================================================
-- Próximo passo: Execute o script 02-users-table.sql
-- =====================================================