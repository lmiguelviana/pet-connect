-- =====================================================
-- TABELA PETS
-- =====================================================
-- Execute este script após criar a tabela Clients

-- Criar tabela Pets
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Dados básicos
  name VARCHAR(255) NOT NULL,
  species VARCHAR(50) NOT NULL, -- 'dog', 'cat', 'bird', etc.
  breed VARCHAR(100),
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'unknown')),
  
  -- Características físicas
  birth_date DATE,
  weight DECIMAL(5,2),
  color VARCHAR(100),
  size VARCHAR(20) CHECK (size IN ('small', 'medium', 'large', 'extra_large')),
  
  -- Saúde
  medical_history TEXT,
  allergies TEXT,
  medications TEXT,
  veterinarian_contact TEXT,
  
  -- Comportamento
  temperament TEXT,
  special_needs TEXT,
  
  -- Mídia
  avatar_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para Pets
CREATE INDEX idx_pets_client_id ON pets(client_id);
CREATE INDEX idx_pets_company_id ON pets(company_id);
CREATE INDEX idx_pets_species ON pets(species);
CREATE INDEX idx_pets_name ON pets(name);

-- Habilitar RLS
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para Pets
CREATE POLICY "Users can manage their company's pets" ON pets
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- =====================================================
-- TABELA PETS CRIADA COM SUCESSO!
-- =====================================================
-- Próximo passo: Execute o script 05-pet-photos-table.sql
-- =====================================================