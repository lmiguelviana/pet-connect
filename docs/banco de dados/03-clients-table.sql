-- =====================================================
-- TABELA CLIENTS (Clientes/Tutores)
-- =====================================================
-- Execute este script após criar a tabela Users

-- Criar tabela Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Dados pessoais
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  cpf VARCHAR(14),
  
  -- Endereço
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  
  -- Outros
  avatar_url TEXT,
  notes TEXT,
  birth_date DATE,
  
  -- Conta corrente (Premium)
  account_balance DECIMAL(10,2) DEFAULT 0.00,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para Clients
CREATE INDEX idx_clients_company_id ON clients(company_id);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_email ON clients(email);

-- Habilitar RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para Clients
CREATE POLICY "Users can manage their company's clients" ON clients
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- =====================================================
-- TABELA CLIENTS CRIADA COM SUCESSO!
-- =====================================================
-- Próximo passo: Execute o script 04-pets-table.sql
-- =====================================================