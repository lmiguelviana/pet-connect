-- Módulo Financeiro - Pet Connect
-- Fase 8: Sistema completo de gestão financeira para pet shops

-- Tabela de contas financeiras (bancos, caixa, cartões)
CREATE TABLE financial_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('bank', 'cash', 'credit', 'savings')),
  balance DECIMAL(10,2) DEFAULT 0.00,
  initial_balance DECIMAL(10,2) DEFAULT 0.00,
  bank_name VARCHAR(100),
  account_number VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de categorias financeiras
CREATE TABLE financial_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  color VARCHAR(7) DEFAULT '#6B7280',
  icon VARCHAR(50),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de transações financeiras
CREATE TABLE financial_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES financial_categories(id) ON DELETE RESTRICT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_type VARCHAR(50), -- 'appointment', 'manual', 'recurring'
  reference_id UUID, -- ID do agendamento, etc.
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para transferências entre contas
CREATE TABLE financial_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  from_account_id UUID NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  to_account_id UUID NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  from_transaction_id UUID REFERENCES financial_transactions(id),
  to_transaction_id UUID REFERENCES financial_transactions(id),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_financial_accounts_company ON financial_accounts(company_id);
CREATE INDEX idx_financial_categories_company ON financial_categories(company_id, type);
CREATE INDEX idx_financial_transactions_company ON financial_transactions(company_id);
CREATE INDEX idx_financial_transactions_date ON financial_transactions(transaction_date DESC);
CREATE INDEX idx_financial_transactions_account ON financial_transactions(account_id);
CREATE INDEX idx_financial_transactions_category ON financial_transactions(category_id);
CREATE INDEX idx_financial_transactions_reference ON financial_transactions(reference_type, reference_id);
CREATE INDEX idx_financial_transfers_company ON financial_transfers(company_id);

-- RLS (Row Level Security)
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transfers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para financial_accounts
CREATE POLICY "Users can view accounts from their company" ON financial_accounts
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert accounts for their company" ON financial_accounts
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update accounts from their company" ON financial_accounts
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete accounts from their company" ON financial_accounts
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Políticas RLS para financial_categories
CREATE POLICY "Users can view categories from their company" ON financial_categories
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert categories for their company" ON financial_categories
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update categories from their company" ON financial_categories
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete categories from their company" ON financial_categories
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Políticas RLS para financial_transactions
CREATE POLICY "Users can view transactions from their company" ON financial_transactions
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert transactions for their company" ON financial_transactions
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update transactions from their company" ON financial_transactions
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete transactions from their company" ON financial_transactions
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Políticas RLS para financial_transfers
CREATE POLICY "Users can view transfers from their company" ON financial_transfers
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert transfers for their company" ON financial_transfers
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update transfers from their company" ON financial_transfers
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete transfers from their company" ON financial_transfers
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Função para atualizar saldo das contas
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar saldo da conta de origem
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'income' THEN
      UPDATE financial_accounts 
      SET balance = balance + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE financial_accounts 
      SET balance = balance - NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverter transação antiga
    IF OLD.type = 'income' THEN
      UPDATE financial_accounts 
      SET balance = balance - OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE financial_accounts 
      SET balance = balance + OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.account_id;
    END IF;
    
    -- Aplicar nova transação
    IF NEW.type = 'income' THEN
      UPDATE financial_accounts 
      SET balance = balance + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE financial_accounts 
      SET balance = balance - NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Reverter transação
    IF OLD.type = 'income' THEN
      UPDATE financial_accounts 
      SET balance = balance - OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE financial_accounts 
      SET balance = balance + OLD.amount,
          updated_at = NOW()
      WHERE id = OLD.account_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar saldo automaticamente
CREATE TRIGGER trigger_update_account_balance
  AFTER INSERT OR UPDATE OR DELETE ON financial_transactions
  FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Inserir categorias padrão para pet shops
INSERT INTO financial_categories (company_id, name, type, color, icon, is_default) 
SELECT 
  c.id,
  category.name,
  category.type,
  category.color,
  category.icon,
  true
FROM companies c
CROSS JOIN (
  VALUES 
    ('Serviços de Banho e Tosa', 'income', '#10B981', 'scissors'),
    ('Consultas Veterinárias', 'income', '#059669', 'heart'),
    ('Venda de Produtos', 'income', '#0D9488', 'shopping-bag'),
    ('Hospedagem', 'income', '#0891B2', 'home'),
    ('Outros Serviços', 'income', '#0284C7', 'star'),
    ('Salários e Encargos', 'expense', '#DC2626', 'users'),
    ('Aluguel', 'expense', '#B91C1C', 'building'),
    ('Produtos para Revenda', 'expense', '#991B1B', 'package'),
    ('Marketing', 'expense', '#7C2D12', 'megaphone'),
    ('Equipamentos', 'expense', '#92400E', 'tool'),
    ('Utilities (Água, Luz)', 'expense', '#A16207', 'zap'),
    ('Outras Despesas', 'expense', '#78716C', 'minus-circle')
) AS category(name, type, color, icon);

-- Comentários nas tabelas
COMMENT ON TABLE financial_accounts IS 'Contas financeiras (bancos, caixa, cartões)';
COMMENT ON TABLE financial_categories IS 'Categorias de receitas e despesas';
COMMENT ON TABLE financial_transactions IS 'Transações financeiras (receitas, despesas, transferências)';
COMMENT ON TABLE financial_transfers IS 'Transferências entre contas';

COMMENT ON COLUMN financial_transactions.reference_type IS 'Tipo de referência: appointment, manual, recurring';
COMMENT ON COLUMN financial_transactions.reference_id IS 'ID da referência (ex: appointment_id)';