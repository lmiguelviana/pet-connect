-- Script para verificar se as tabelas financeiras foram criadas corretamente
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se as tabelas existem
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'financial_%'
ORDER BY table_name;

-- 2. Verificar estrutura da tabela financial_accounts
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'financial_accounts'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela financial_categories
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'financial_categories'
ORDER BY ordinal_position;

-- 4. Verificar estrutura da tabela financial_transactions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'financial_transactions'
ORDER BY ordinal_position;

-- 5. Verificar estrutura da tabela financial_transfers
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'financial_transfers'
ORDER BY ordinal_position;

-- 6. Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename LIKE 'financial_%'
ORDER BY tablename, policyname;

-- 7. Verificar se a função get_account_balance existe
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'get_account_balance';

-- 8. Contar registros em cada tabela
SELECT 'financial_accounts' as tabela, COUNT(*) as registros FROM financial_accounts
UNION ALL
SELECT 'financial_categories' as tabela, COUNT(*) as registros FROM financial_categories
UNION ALL
SELECT 'financial_transactions' as tabela, COUNT(*) as registros FROM financial_transactions
UNION ALL
SELECT 'financial_transfers' as tabela, COUNT(*) as registros FROM financial_transfers;

-- 9. Verificar índices
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename LIKE 'financial_%'
ORDER BY tablename, indexname;