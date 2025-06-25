-- =====================================================
-- TABELA SERVICES (Serviços)
-- =====================================================
-- Execute este script após criar a tabela Pet Photos

-- Criar tabela Services
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Dados do serviço
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'grooming', 'veterinary', 'training', etc.
  
  -- Preços e duração
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  
  -- Configurações
  is_active BOOLEAN DEFAULT true,
  requires_appointment BOOLEAN DEFAULT true,
  max_pets_per_session INTEGER DEFAULT 1,
  
  -- Disponibilidade
  available_days INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Monday, 7=Sunday
  available_hours JSONB DEFAULT '{}',
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para Services
CREATE INDEX idx_services_company_id ON services(company_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(is_active);

-- Habilitar RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para Services
CREATE POLICY "Users can manage their company's services" ON services
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- =====================================================
-- TABELA SERVICES CRIADA COM SUCESSO!
-- =====================================================
-- Próximo passo: Execute o script 07-appointments-table.sql
-- =====================================================