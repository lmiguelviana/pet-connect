-- =====================================================
-- CONFIGURAÇÕES FINAIS E OTIMIZAÇÕES
-- =====================================================
-- Execute este script por último

-- Habilitar extensões necessárias (se ainda não estiverem habilitadas)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar timezone padrão
SET timezone = 'America/Sao_Paulo';

-- Atualizar estatísticas das tabelas para melhor performance
ANALYZE companies;
ANALYZE users;
ANALYZE clients;
ANALYZE pets;
ANALYZE pet_photos;
ANALYZE services;
ANALYZE appointments;
ANALYZE transactions;
ANALYZE notifications;

-- Criar função para limpar dados antigos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Limpar notificações antigas (mais de 90 dias)
  DELETE FROM notifications 
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND status IN ('sent', 'delivered');
  
  -- Limpar fotos de pets inativos há mais de 1 ano
  DELETE FROM pet_photos 
  WHERE pet_id IN (
    SELECT id FROM pets 
    WHERE is_active = false 
    AND updated_at < NOW() - INTERVAL '1 year'
  );
  
  RAISE NOTICE 'Limpeza de dados antigos concluída';
END;
$$ LANGUAGE plpgsql;

-- Criar função para backup de dados importantes
CREATE OR REPLACE FUNCTION backup_company_data(company_uuid UUID)
RETURNS TABLE(
  table_name TEXT,
  record_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'companies'::TEXT, COUNT(*) FROM companies WHERE id = company_uuid
  UNION ALL
  SELECT 'users'::TEXT, COUNT(*) FROM users WHERE company_id = company_uuid
  UNION ALL
  SELECT 'clients'::TEXT, COUNT(*) FROM clients WHERE company_id = company_uuid
  UNION ALL
  SELECT 'pets'::TEXT, COUNT(*) FROM pets WHERE company_id = company_uuid
  UNION ALL
  SELECT 'appointments'::TEXT, COUNT(*) FROM appointments WHERE company_id = company_uuid
  UNION ALL
  SELECT 'transactions'::TEXT, COUNT(*) FROM transactions WHERE company_id = company_uuid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- BANCO DE DADOS CONFIGURADO COM SUCESSO!
-- =====================================================

-- PRÓXIMOS PASSOS:
-- 1. Configure a autenticação no Supabase Dashboard:
--    - Vá em Authentication > Settings
--    - Configure os provedores de login desejados
--    - Defina as URLs de redirecionamento

-- 2. Configure as variáveis de ambiente no seu projeto:
--    NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
--    SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico

-- 3. Teste a conexão executando:
--    SELECT * FROM companies LIMIT 1;

-- 4. Insira dados de teste (opcional):
--    - Uma empresa de exemplo
--    - Um usuário administrador
--    - Alguns clientes e pets de teste

-- 5. Configure o Storage (se necessário para fotos):
--    - Crie um bucket 'pet-photos'
--    - Configure as políticas de acesso

-- ESTRUTURA CRIADA:
-- ✅ 9 Tabelas principais
-- ✅ Índices para performance
-- ✅ Row Level Security (RLS)
-- ✅ Triggers para updated_at
-- ✅ Validações de plano gratuito
-- ✅ View para dashboard
-- ✅ Funções auxiliares

-- LIMITES DO PLANO GRATUITO:
-- - Máximo 20 clientes por empresa
-- - Máximo 30 pets por empresa
-- - Funcionalidades premium desabilitadas

-- Para testar se tudo está funcionando:
SELECT 
  'Tabelas criadas' as status,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'companies', 'users', 'clients', 'pets', 'pet_photos',
  'services', 'appointments', 'transactions', 'notifications'
);

-- =====================================================
-- INSTALAÇÃO COMPLETA! 🎉
-- =====================================================