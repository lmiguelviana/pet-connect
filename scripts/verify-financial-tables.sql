-- 🔍 Script para Verificar Tabelas Financeiras no Supabase
-- Execute este script no SQL Editor do Supabase para verificar se as tabelas foram criadas

-- 1. Verificar se as tabelas financeiras existem
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
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela financial_categories
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'financial_categories' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar estrutura da tabela financial_transactions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'financial_transactions' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Verificar estrutura da tabela financial_transfers
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'financial_transfers' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verificar se as funções foram criadas
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name LIKE '%financial%'
ORDER BY routine_name;

-- 7. Verificar políticas RLS
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

-- 8. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename LIKE 'financial_%'
ORDER BY tablename;

-- 9. Contar registros em cada tabela (deve retornar 0 se vazia)
SELECT 'financial_accounts' as tabela, COUNT(*) as registros FROM financial_accounts
UNION ALL
SELECT 'financial_categories' as tabela, COUNT(*) as registros FROM financial_categories
UNION ALL
SELECT 'financial_transactions' as tabela, COUNT(*) as registros FROM financial_transactions
UNION ALL
SELECT 'financial_transfers' as tabela, COUNT(*) as registros FROM financial_transfers;

-- 10. Testar função get_account_balance (se existir)
SELECT 
    routine_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name = 'get_account_balance';

-- Se a função existir, você pode testá-la (substitua 'uuid-da-conta' por um ID real):
-- SELECT get_account_balance('uuid-da-conta');