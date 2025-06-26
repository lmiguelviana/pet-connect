-- TABELA SERVICE_PHOTOS (Fotos dos Serviços)
-- =====================================================
-- Execute este script após criar a tabela Services

-- Criar tabela Service Photos
CREATE TABLE service_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Dados da foto
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  caption TEXT,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para Service Photos
CREATE INDEX idx_service_photos_service_id ON service_photos(service_id);
CREATE INDEX idx_service_photos_company_id ON service_photos(company_id);
CREATE INDEX idx_service_photos_primary ON service_photos(is_primary);

-- Habilitar RLS
ALTER TABLE service_photos ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para Service Photos
CREATE POLICY "Users can manage their company's service photos" ON service_photos
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- Trigger para garantir apenas uma foto primária por serviço
CREATE OR REPLACE FUNCTION ensure_single_primary_service_photo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE service_photos 
    SET is_primary = false 
    WHERE service_id = NEW.service_id 
      AND id != NEW.id 
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_primary_service_photo
  BEFORE INSERT OR UPDATE ON service_photos
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_service_photo();

-- =====================================================
-- TABELA SERVICE_PHOTOS CRIADA COM SUCESSO!
-- =====================================================
-- Próximo passo: Implementar componentes do módulo de serviços
-- =====================================================