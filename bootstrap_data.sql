-- SCRIPT PARA CRIAR DADOS INICIAIS NO SUPABASE DASHBOARD
-- Execute este script no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. Criar empresa de teste
INSERT INTO companies (
  name,
  email,
  phone,
  address,
  cnpj,
  plan_type,
  subscription_status
) VALUES (
  'Pet Shop Demo',
  'admin@petshop.demo',
  '(11) 99999-9999',
  'Rua das Flores, 123 - São Paulo/SP',
  '12.345.678/0001-90',
  'premium',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- 2. Obter o ID da empresa criada
DO $$
DECLARE
  company_uuid UUID;
  user_uuid UUID;
BEGIN
  -- Buscar ID da empresa
  SELECT id INTO company_uuid FROM companies WHERE email = 'admin@petshop.demo';
  
  -- Gerar UUID para o usuário (você deve substituir por um UUID real do Auth)
  user_uuid := gen_random_uuid();
  
  -- 3. Criar usuário na tabela users
  INSERT INTO users (
    id,
    company_id,
    name,
    email,
    phone,
    role,
    permissions,
    is_active
  ) VALUES (
    user_uuid,
    company_uuid,
    'Administrador',
    'admin@petshop.demo',
    '(11) 99999-9999',
    'admin',
    ARRAY['all'],
    true
  ) ON CONFLICT (id) DO UPDATE SET
    company_id = EXCLUDED.company_id,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    is_active = EXCLUDED.is_active;
  
  -- 4. Criar clientes de teste
  INSERT INTO clients (
    company_id,
    name,
    email,
    phone,
    address,
    city,
    state,
    zip_code
  ) VALUES 
    (
      company_uuid,
      'Maria Silva',
      'maria@email.com',
      '(11) 98888-8888',
      'Rua A, 100',
      'São Paulo',
      'SP',
      '01000-000'
    ),
    (
      company_uuid,
      'João Santos',
      'joao@email.com',
      '(11) 97777-7777',
      'Rua B, 200',
      'São Paulo',
      'SP',
      '02000-000'
    )
  ON CONFLICT (email) DO NOTHING;
  
  -- 5. Criar pets de teste
  INSERT INTO pets (
    company_id,
    client_id,
    name,
    species,
    breed,
    gender,
    birth_date,
    weight,
    color
  ) 
  SELECT 
    company_uuid,
    c.id,
    pet_data.name,
    pet_data.species,
    pet_data.breed,
    pet_data.gender,
    pet_data.birth_date::date,
    pet_data.weight,
    pet_data.color
  FROM (
    VALUES 
      ('Rex', 'dog', 'Golden Retriever', 'male', '2020-05-15', 25.5, 'Dourado'),
      ('Mimi', 'cat', 'Persa', 'female', '2021-03-10', 4.2, 'Branco')
  ) AS pet_data(name, species, breed, gender, birth_date, weight, color)
  CROSS JOIN (
    SELECT id FROM clients WHERE company_id = company_uuid LIMIT 2
  ) AS c
  WHERE NOT EXISTS (
    SELECT 1 FROM pets WHERE company_id = company_uuid AND name = pet_data.name
  );
  
  -- Mostrar resultados
  RAISE NOTICE 'Empresa criada: %', (SELECT name FROM companies WHERE id = company_uuid);
  RAISE NOTICE 'Usuário criado: %', (SELECT name FROM users WHERE company_id = company_uuid);
  RAISE NOTICE 'Clientes criados: %', (SELECT COUNT(*) FROM clients WHERE company_id = company_uuid);
  RAISE NOTICE 'Pets criados: %', (SELECT COUNT(*) FROM pets WHERE company_id = company_uuid);
  
END $$;

-- 6. Verificar dados criados
SELECT 
  'companies' as tabela,
  COUNT(*) as registros
FROM companies 
WHERE email = 'admin@petshop.demo'

UNION ALL

SELECT 
  'users' as tabela,
  COUNT(*) as registros
FROM users u
JOIN companies c ON u.company_id = c.id
WHERE c.email = 'admin@petshop.demo'

UNION ALL

SELECT 
  'clients' as tabela,
  COUNT(*) as registros
FROM clients cl
JOIN companies c ON cl.company_id = c.id
WHERE c.email = 'admin@petshop.demo'

UNION ALL

SELECT 
  'pets' as tabela,
  COUNT(*) as registros
FROM pets p
JOIN companies c ON p.company_id = c.id
WHERE c.email = 'admin@petshop.demo';

-- =====================================================
-- DADOS CRIADOS COM SUCESSO!
-- =====================================================
-- 
-- PRÓXIMOS PASSOS:
-- 1. Crie um usuário no Authentication do Supabase Dashboard:
--    - Email: admin@petshop.demo
--    - Senha: admin123456
--    - Confirme o email
-- 
-- 2. Atualize o ID do usuário na tabela users:
--    UPDATE users SET id = 'UUID_DO_AUTH_USER' 
--    WHERE email = 'admin@petshop.demo';
-- 
-- 3. Acesse: http://localhost:3000
-- =====================================================