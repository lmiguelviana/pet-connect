-- =====================================================
-- TABELA APPOINTMENTS (Agendamentos)
-- =====================================================
-- Execute este script após criar a tabela Services

-- Criar tabela Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id), -- Funcionário responsável
  
  -- Data e hora
  date_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  
  -- Status
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')
  ),
  
  -- Detalhes
  notes TEXT,
  internal_notes TEXT, -- Apenas para funcionários
  
  -- Recorrência (Premium)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB, -- {'type': 'weekly', 'interval': 2}
  parent_appointment_id UUID REFERENCES appointments(id),
  
  -- Preços
  service_price DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2),
  
  -- Notificações
  reminder_sent_at TIMESTAMPTZ,
  confirmation_sent_at TIMESTAMPTZ,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para Appointments
CREATE INDEX idx_appointments_company_id ON appointments(company_id);
CREATE INDEX idx_appointments_date_time ON appointments(date_time);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_pet_id ON appointments(pet_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_company_date ON appointments(company_id, date_time);

-- Habilitar RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para Appointments
CREATE POLICY "Users can manage their company's appointments" ON appointments
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- =====================================================
-- TABELA APPOINTMENTS CRIADA COM SUCESSO!
-- =====================================================
-- Próximo passo: Execute o script 08-transactions-table.sql
-- =====================================================