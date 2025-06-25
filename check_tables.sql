-- Script para verificar tabelas existentes no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Listar todas as tabelas no schema public
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Verificar se as tabelas do Pet Connect existem
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' AND table_schema = 'public') 
        THEN '✅ companies existe'
        ELSE '❌ companies não existe'
    END as companies_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
        THEN '✅ users existe'
        ELSE '❌ users não existe'
    END as users_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public') 
        THEN '✅ clients existe'
        ELSE '❌ clients não existe'
    END as clients_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pets' AND table_schema = 'public') 
        THEN '✅ pets existe'
        ELSE '❌ pets não existe'
    END as pets_status;

-- 3. Se as tabelas existem, contar registros
SELECT 
    'companies' as tabela,
    COUNT(*) as total_registros
FROM companies
UNION ALL
SELECT 
    'users' as tabela,
    COUNT(*) as total_registros
FROM users
UNION ALL
SELECT 
    'clients' as tabela,
    COUNT(*) as total_registros
FROM clients
UNION ALL
SELECT 
    'pets' as tabela,
    COUNT(*) as total_registros
FROM pets;