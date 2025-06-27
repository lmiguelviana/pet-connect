-- TABELAS SERVICE PACKAGES (Pacotes de Serviços)
-- =====================================================
-- Execute este script após criar a tabela Service Photos (06b)

-- ================================================
-- 1. CRIAÇÃO DAS TABELAS
-- ================================================

-- Tabela Service Packages (Pacotes de Serviços)
CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Dados do pacote
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Tipo de desconto
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
  
  -- Preços calculados
  original_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  final_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela Package Services (Serviços dentro dos Pacotes)
CREATE TABLE IF NOT EXISTS package_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  
  -- Quantidade do serviço no pacote
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  
  -- Preço do serviço no momento da criação do pacote
  service_price DECIMAL(10,2) NOT NULL,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint para evitar duplicatas
  UNIQUE(package_id, service_id)
);

-- ================================================
-- 2. CRIAÇÃO DOS ÍNDICES
-- ================================================

-- Índices Service Packages
CREATE INDEX IF NOT EXISTS idx_service_packages_company_id ON service_packages(company_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_active ON service_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_service_packages_name ON service_packages(name);
CREATE INDEX IF NOT EXISTS idx_service_packages_created_at ON service_packages(created_at DESC);

-- Índices Package Services
CREATE INDEX IF NOT EXISTS idx_package_services_package_id ON package_services(package_id);
CREATE INDEX IF NOT EXISTS idx_package_services_service_id ON package_services(service_id);

-- ================================================
-- 3. TRIGGERS
-- ================================================

-- Trigger para atualizar updated_at em service_packages
CREATE TRIGGER update_service_packages_updated_at 
  BEFORE UPDATE ON service_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 4. CONFIGURAÇÃO DO ROW LEVEL SECURITY (RLS)
-- ================================================

-- Habilitar RLS
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_services ENABLE ROW LEVEL SECURITY;

-- Políticas para Service Packages
CREATE POLICY "Users can manage their company's service packages" ON service_packages
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- Políticas para Package Services
CREATE POLICY "Users can manage their company's package services" ON package_services
  FOR ALL USING (
    package_id IN (
      SELECT id FROM service_packages 
      WHERE company_id = (auth.jwt() ->> 'company_id')::uuid
    )
  );

-- ================================================
-- 5. FUNÇÕES AUXILIARES
-- ================================================

-- Função para calcular preços do pacote
CREATE OR REPLACE FUNCTION calculate_package_prices(package_uuid UUID)
RETURNS VOID AS $$
DECLARE
  original_total DECIMAL(10,2) := 0;
  final_total DECIMAL(10,2) := 0;
  package_discount_type VARCHAR(20);
  package_discount_value DECIMAL(10,2);
BEGIN
  -- Buscar dados do pacote
  SELECT discount_type, discount_value 
  INTO package_discount_type, package_discount_value
  FROM service_packages 
  WHERE id = package_uuid;
  
  -- Calcular preço original (soma de todos os serviços)
  SELECT COALESCE(SUM(service_price * quantity), 0)
  INTO original_total
  FROM package_services
  WHERE package_id = package_uuid;
  
  -- Calcular preço final com desconto
  IF package_discount_type = 'percentage' THEN
    final_total := original_total * (1 - package_discount_value / 100);
  ELSE -- fixed
    final_total := original_total - package_discount_value;
  END IF;
  
  -- Garantir que o preço final não seja negativo
  IF final_total < 0 THEN
    final_total := 0;
  END IF;
  
  -- Atualizar o pacote
  UPDATE service_packages 
  SET 
    original_price = original_total,
    final_price = final_total,
    updated_at = NOW()
  WHERE id = package_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular preços quando serviços são adicionados/removidos
CREATE OR REPLACE FUNCTION trigger_calculate_package_prices()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_package_prices(OLD.package_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_package_prices(NEW.package_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
CREATE TRIGGER recalculate_package_prices_on_services_change
  AFTER INSERT OR UPDATE OR DELETE ON package_services
  FOR EACH ROW EXECUTE FUNCTION trigger_calculate_package_prices();

-- =====================================================
-- TABELAS SERVICE PACKAGES CRIADAS COM SUCESSO!
-- =====================================================
-- Tabelas criadas:
-- ✅ service_packages - Pacotes de serviços
-- ✅ package_services - Serviços dentro dos pacotes
-- ✅ Índices otimizados
-- ✅ Row Level Security (RLS)
-- ✅ Triggers automáticos
-- ✅ Função de cálculo de preços
-- 
-- Próximo passo: Execute o script 07-appointments-table.sql
-- =====================================================