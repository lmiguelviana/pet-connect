-- =====================================================
-- TABELA TRANSACTIONS (Transações Financeiras)
-- =====================================================
-- Execute este script após criar a tabela Appointments

-- Criar tabela Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  appointment_id UUID REFERENCES appointments(id),
  user_id UUID REFERENCES users(id), -- Quem registrou
  
  -- Tipo e categoria
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(100) NOT NULL, -- 'service', 'product', 'salary', 'rent', etc.
  
  -- Valores
  amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  net_amount DECIMAL(10,2) NOT NULL,
  
  -- Detalhes
  description TEXT NOT NULL,
  notes TEXT,
  
  -- Pagamento
  payment_method VARCHAR(50), -- 'cash', 'card', 'pix', 'transfer'
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'paid', 'cancelled', 'refunded')
  ),
  paid_at TIMESTAMPTZ,
  due_date DATE,
  
  -- Referências externas
  external_id VARCHAR(255), -- ID do gateway de pagamento
  invoice_number VARCHAR(100),
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para Transactions
CREATE INDEX idx_transactions_company_id ON transactions(company_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_payment_status ON transactions(payment_status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_client_id ON transactions(client_id);

-- Habilitar RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para Transactions
CREATE POLICY "Users can manage their company's transactions" ON transactions
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- =====================================================
-- TABELA TRANSACTIONS CRIADA COM SUCESSO!
-- =====================================================
-- Próximo passo: Execute o script 09-notifications-table.sql
-- =====================================================