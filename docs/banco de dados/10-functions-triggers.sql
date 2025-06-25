-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================
-- Execute este script após criar todas as tabelas

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para verificar limites do plano gratuito
CREATE OR REPLACE FUNCTION check_free_plan_limits()
RETURNS TRIGGER AS $$
DECLARE
  company_plan TEXT;
  client_count INTEGER;
  pet_count INTEGER;
BEGIN
  -- Buscar plano da empresa
  SELECT plan_type INTO company_plan
  FROM companies
  WHERE id = NEW.company_id;
  
  -- Se for plano premium, permitir
  IF company_plan = 'premium' THEN
    RETURN NEW;
  END IF;
  
  -- Verificar limites do plano gratuito
  IF TG_TABLE_NAME = 'clients' THEN
    SELECT COUNT(*) INTO client_count
    FROM clients
    WHERE company_id = NEW.company_id AND is_active = true;
    
    IF client_count >= 20 THEN
      RAISE EXCEPTION 'Limite de 20 clientes atingido no plano gratuito';
    END IF;
  END IF;
  
  IF TG_TABLE_NAME = 'pets' THEN
    SELECT COUNT(*) INTO pet_count
    FROM pets
    WHERE company_id = NEW.company_id AND is_active = true;
    
    IF pet_count >= 30 THEN
      RAISE EXCEPTION 'Limite de 30 pets atingido no plano gratuito';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pet_photos_updated_at BEFORE UPDATE ON pet_photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Aplicar triggers de validação de planos
CREATE TRIGGER check_clients_limit BEFORE INSERT ON clients
  FOR EACH ROW EXECUTE FUNCTION check_free_plan_limits();

CREATE TRIGGER check_pets_limit BEFORE INSERT ON pets
  FOR EACH ROW EXECUTE FUNCTION check_free_plan_limits();

-- =====================================================
-- FUNÇÕES E TRIGGERS CRIADOS COM SUCESSO!
-- =====================================================
-- Próximo passo: Execute o script 11-dashboard-view.sql
-- =====================================================