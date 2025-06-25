-- =====================================================
-- TABELA NOTIFICATIONS (Notificações)
-- =====================================================
-- Execute este script após criar a tabela Transactions

-- Criar tabela Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  client_id UUID REFERENCES clients(id),
  
  -- Conteúdo
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'appointment', 'payment', 'system', etc.
  
  -- Canais
  channels VARCHAR(50)[] DEFAULT '{"app"}', -- 'app', 'email', 'whatsapp', 'sms'
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'sent', 'delivered', 'failed')
  ),
  
  -- Metadados
  data JSONB DEFAULT '{}',
  
  -- Agendamento
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para Notifications
CREATE INDEX idx_notifications_company_id ON notifications(company_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);

-- Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para Notifications
CREATE POLICY "Users can view their company's notifications" ON notifications
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- =====================================================
-- TABELA NOTIFICATIONS CRIADA COM SUCESSO!
-- =====================================================
-- Próximo passo: Execute o script 10-functions-triggers.sql
-- =====================================================