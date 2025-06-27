-- ADICIONAR COLUNAS FALTANTES NAS TABELAS
-- =====================================================
-- Este script adiciona colunas que podem estar faltando

-- 1. Adicionar coluna 'color' na tabela services (se não existir)
ALTER TABLE services ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';

-- 2. Verificar se a tabela service_photos existe
CREATE TABLE IF NOT EXISTS service_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS para service_photos
ALTER TABLE service_photos ENABLE ROW LEVEL SECURITY;

-- 4. Criar política RLS para service_photos
DROP POLICY IF EXISTS "service_photos_policy" ON service_photos;
CREATE POLICY "service_photos_policy" ON service_photos
  FOR ALL
  USING (company_id = public.get_user_company_id())
  WITH CHECK (company_id = public.get_user_company_id());

-- 5. Criar índices
CREATE INDEX IF NOT EXISTS idx_service_photos_service_id ON service_photos(service_id);
CREATE INDEX IF NOT EXISTS idx_service_photos_company_id ON service_photos(company_id);

-- =====================================================
-- INSTRUÇÕES:
-- 1. Execute primeiro o script fix_rls_policies.sql
-- 2. Depois execute este script
-- 3. Teste novamente a aplicação
-- =====================================================