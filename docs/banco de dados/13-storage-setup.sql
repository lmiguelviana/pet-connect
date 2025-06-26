-- CONFIGURAÇÃO DO SUPABASE STORAGE
-- =====================================================
-- Execute este script para configurar o storage de fotos

-- Criar bucket para fotos dos pets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pet-photos',
  'pet-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload de fotos (usuários autenticados da mesma empresa)
CREATE POLICY "Users can upload pet photos for their company" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'pet-photos' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies 
    WHERE id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid()
    )
  )
);

-- Política para permitir visualização de fotos (usuários autenticados da mesma empresa)
CREATE POLICY "Users can view pet photos from their company" ON storage.objects
FOR SELECT USING (
  bucket_id = 'pet-photos' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies 
    WHERE id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid()
    )
  )
);

-- Política para permitir atualização de fotos (usuários autenticados da mesma empresa)
CREATE POLICY "Users can update pet photos from their company" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'pet-photos' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies 
    WHERE id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid()
    )
  )
);

-- Política para permitir exclusão de fotos (usuários autenticados da mesma empresa)
CREATE POLICY "Users can delete pet photos from their company" ON storage.objects
FOR DELETE USING (
  bucket_id = 'pet-photos' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM companies 
    WHERE id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid()
    )
  )
);

-- Função para gerar URL pública da foto
CREATE OR REPLACE FUNCTION get_pet_photo_url(photo_path TEXT)
RETURNS TEXT AS $$
BEGIN
  IF photo_path IS NULL OR photo_path = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN 'https://your-project.supabase.co/storage/v1/object/public/pet-photos/' || photo_path;
END;
$$ LANGUAGE plpgsql;

-- Função para upload de foto do pet
CREATE OR REPLACE FUNCTION upload_pet_photo(
  pet_uuid UUID,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT
)
RETURNS TEXT AS $$
DECLARE
  company_uuid UUID;
  photo_path TEXT;
BEGIN
  -- Buscar company_id do pet
  SELECT company_id INTO company_uuid
  FROM pets
  WHERE id = pet_uuid;
  
  IF company_uuid IS NULL THEN
    RAISE EXCEPTION 'Pet não encontrado';
  END IF;
  
  -- Gerar caminho da foto: company_id/pets/pet_id/filename
  photo_path := company_uuid::text || '/pets/' || pet_uuid::text || '/' || file_name;
  
  -- Inserir registro na tabela pet_photos
  INSERT INTO pet_photos (
    pet_id,
    photo_url,
    file_name,
    file_size,
    mime_type
  ) VALUES (
    pet_uuid,
    photo_path,
    file_name,
    file_size,
    mime_type
  );
  
  RETURN photo_path;
END;
$$ LANGUAGE plpgsql;

-- Função para definir foto de perfil do pet
CREATE OR REPLACE FUNCTION set_pet_profile_photo(
  pet_uuid UUID,
  photo_uuid UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Remover foto de perfil atual
  UPDATE pet_photos 
  SET is_profile_photo = false 
  WHERE pet_id = pet_uuid;
  
  -- Definir nova foto de perfil
  UPDATE pet_photos 
  SET is_profile_photo = true 
  WHERE id = photo_uuid AND pet_id = pet_uuid;
  
  -- Atualizar avatar_url do pet
  UPDATE pets 
  SET avatar_url = (
    SELECT get_pet_photo_url(photo_url)
    FROM pet_photos 
    WHERE id = photo_uuid
  )
  WHERE id = pet_uuid;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORAGE CONFIGURADO COM SUCESSO!
-- =====================================================

-- PRÓXIMOS PASSOS:
-- 1. No Supabase Dashboard, vá em Storage
-- 2. Verifique se o bucket 'pet-photos' foi criado
-- 3. Configure as políticas de acesso se necessário
-- 4. Teste o upload de uma foto

-- ESTRUTURA CRIADA:
-- ✅ Bucket 'pet-photos' com limite de 5MB
-- ✅ Políticas RLS para upload, visualização, atualização e exclusão
-- ✅ Função para gerar URL pública
-- ✅ Função para upload de foto
-- ✅ Função para definir foto de perfil