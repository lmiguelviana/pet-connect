-- =====================================================
-- TABELA PET_PHOTOS
-- =====================================================
-- Execute este script após criar a tabela Pets

-- Criar tabela Pet Photos
CREATE TABLE pet_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  
  -- Arquivo
  photo_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  -- Metadados
  caption TEXT,
  tags TEXT[],
  is_profile_photo BOOLEAN DEFAULT false,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para Pet Photos
CREATE INDEX idx_pet_photos_pet_id ON pet_photos(pet_id);
CREATE INDEX idx_pet_photos_created_at ON pet_photos(created_at DESC);

-- Habilitar RLS
ALTER TABLE pet_photos ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para Pet Photos
CREATE POLICY "Users can manage photos of their company's pets" ON pet_photos
  FOR ALL USING (
    pet_id IN (
      SELECT id FROM pets WHERE company_id = (auth.jwt() ->> 'company_id')::uuid
    )
  );

-- =====================================================
-- TABELA PET_PHOTOS CRIADA COM SUCESSO!
-- =====================================================
-- Próximo passo: Execute o script 06-services-table.sql
-- =====================================================