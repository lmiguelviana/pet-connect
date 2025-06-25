# 🗄️ Estrutura do Banco de Dados - Pet Connect

## 📋 Visão Geral

O Pet Connect utiliza **PostgreSQL** via **Supabase** com **Row Level Security (RLS)** para garantir isolamento total de dados entre empresas. Todas as tabelas seguem padrões de nomenclatura consistentes e implementam auditoria automática.

## 🏗️ Diagrama de Relacionamentos

```
┌─────────────────┐
│    companies    │
│ (Pet Shops)     │
└─────────┬───────┘
          │ 1:N
          ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      users      │    │     clients     │    │    services     │
│ (Funcionários)  │    │   (Tutores)     │    │   (Serviços)    │
└─────────────────┘    └─────────┬───────┘    └─────────────────┘
                                 │ 1:N
                                 ▼
                       ┌─────────────────┐
                       │      pets       │
                       │    (Pets)       │
                       └─────────┬───────┘
                                 │ 1:N
                                 ▼
                       ┌─────────────────┐
                       │   pet_photos    │
                       │ (Fotos Pets)    │
                       └─────────────────┘

┌─────────────────┐
│  appointments   │ ──── N:1 ──── clients
│ (Agendamentos)  │ ──── N:1 ──── pets
│                 │ ──── N:1 ──── services
└─────────────────┘

┌─────────────────┐
│  transactions   │ ──── N:1 ──── companies
│ (Transações)    │
└─────────────────┘
```

## 📊 Estrutura das Tabelas

### 1. 🏢 Companies (Empresas/Pet Shops)

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  cnpj VARCHAR(18) UNIQUE,
  
  -- Plano e assinatura
  plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
  subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended')),
  subscription_expires_at TIMESTAMPTZ,
  
  -- Configurações
  settings JSONB DEFAULT '{}',
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_companies_plan_type ON companies(plan_type);
CREATE INDEX idx_companies_subscription_status ON companies(subscription_status);
```

### 2. 👥 Users (Usuários/Funcionários)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Dados pessoais
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  
  -- Permissões
  role VARCHAR(50) DEFAULT 'employee' CHECK (role IN ('owner', 'admin', 'employee')),
  permissions JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### 3. 🧑‍🤝‍🧑 Clients (Clientes/Tutores)

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Dados pessoais
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  cpf VARCHAR(14),
  
  -- Endereço
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  
  -- Outros
  avatar_url TEXT,
  notes TEXT,
  birth_date DATE,
  
  -- Conta corrente (Premium)
  account_balance DECIMAL(10,2) DEFAULT 0.00,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_clients_company_id ON clients(company_id);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_email ON clients(email);
```

### 4. 🐕 Pets

```sql
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Dados básicos
  name VARCHAR(255) NOT NULL,
  species VARCHAR(50) NOT NULL, -- 'dog', 'cat', 'bird', etc.
  breed VARCHAR(100),
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'unknown')),
  
  -- Características físicas
  birth_date DATE,
  weight DECIMAL(5,2),
  color VARCHAR(100),
  size VARCHAR(20) CHECK (size IN ('small', 'medium', 'large', 'extra_large')),
  
  -- Saúde
  medical_history TEXT,
  allergies TEXT,
  medications TEXT,
  veterinarian_contact TEXT,
  
  -- Comportamento
  temperament TEXT,
  special_needs TEXT,
  
  -- Mídia
  avatar_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_pets_client_id ON pets(client_id);
CREATE INDEX idx_pets_company_id ON pets(company_id);
CREATE INDEX idx_pets_species ON pets(species);
CREATE INDEX idx_pets_name ON pets(name);
```

### 5. 📸 Pet Photos

```sql
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

-- Índices
CREATE INDEX idx_pet_photos_pet_id ON pet_photos(pet_id);
CREATE INDEX idx_pet_photos_created_at ON pet_photos(created_at DESC);
```

### 6. 🛠️ Services (Serviços)

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Dados do serviço
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'grooming', 'veterinary', 'training', etc.
  
  -- Preços e duração
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  
  -- Configurações
  is_active BOOLEAN DEFAULT true,
  requires_appointment BOOLEAN DEFAULT true,
  max_pets_per_session INTEGER DEFAULT 1,
  
  -- Disponibilidade
  available_days INTEGER[] DEFAULT '{1,2,3,4,5,6,7}', -- 1=Monday, 7=Sunday
  available_hours JSONB DEFAULT '{}',
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_services_company_id ON services(company_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(is_active);
```

### 7. 📅 Appointments (Agendamentos)

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id), -- Funcionário responsável
  
  -- Data e hora
  date_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  
  -- Status
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')
  ),
  
  -- Detalhes
  notes TEXT,
  internal_notes TEXT, -- Apenas para funcionários
  
  -- Recorrência (Premium)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB, -- {'type': 'weekly', 'interval': 2}
  parent_appointment_id UUID REFERENCES appointments(id),
  
  -- Preços
  service_price DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(10,2),
  
  -- Notificações
  reminder_sent_at TIMESTAMPTZ,
  confirmation_sent_at TIMESTAMPTZ,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_appointments_company_id ON appointments(company_id);
CREATE INDEX idx_appointments_date_time ON appointments(date_time);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_pet_id ON appointments(pet_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_company_date ON appointments(company_id, date_time);
```

### 8. 💰 Transactions (Transações Financeiras)

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  appointment_id UUID REFERENCES appointments(id),
  user_id UUID REFERENCES users(id), -- Quem registrou
  
  -- Tipo e categoria
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(100) NOT NULL, -- 'service', 'product', 'salary', 'rent', etc.
  
  -- Valores
  amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0.00,
  tax_amount DECIMAL(10,2) DEFAULT 0.00,
  net_amount DECIMAL(10,2) NOT NULL,
  
  -- Detalhes
  description TEXT NOT NULL,
  notes TEXT,
  
  -- Pagamento
  payment_method VARCHAR(50), -- 'cash', 'card', 'pix', 'transfer'
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'paid', 'cancelled', 'refunded')
  ),
  paid_at TIMESTAMPTZ,
  due_date DATE,
  
  -- Referências externas
  external_id VARCHAR(255), -- ID do gateway de pagamento
  invoice_number VARCHAR(100),
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_transactions_company_id ON transactions(company_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_payment_status ON transactions(payment_status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_client_id ON transactions(client_id);
```

### 9. 🔔 Notifications (Notificações)

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  client_id UUID REFERENCES clients(id),
  
  -- Conteúdo
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'appointment', 'payment', 'system', etc.
  
  -- Canais
  channels VARCHAR(50)[] DEFAULT '{"app"}', -- 'app', 'email', 'whatsapp', 'sms'
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'sent', 'delivered', 'failed')
  ),
  
  -- Metadados
  data JSONB DEFAULT '{}',
  
  -- Agendamento
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_notifications_company_id ON notifications(company_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);
```

## 🔐 Row Level Security (RLS)

### Políticas de Segurança

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para Users
CREATE POLICY "Users can view their own company" ON users
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- Políticas para Clients
CREATE POLICY "Users can manage their company's clients" ON clients
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- Políticas para Pets
CREATE POLICY "Users can manage their company's pets" ON pets
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- Políticas para Pet Photos
CREATE POLICY "Users can manage photos of their company's pets" ON pet_photos
  FOR ALL USING (
    pet_id IN (
      SELECT id FROM pets WHERE company_id = (auth.jwt() ->> 'company_id')::uuid
    )
  );

-- Políticas para Services
CREATE POLICY "Users can manage their company's services" ON services
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- Políticas para Appointments
CREATE POLICY "Users can manage their company's appointments" ON appointments
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- Políticas para Transactions
CREATE POLICY "Users can manage their company's transactions" ON transactions
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- Políticas para Notifications
CREATE POLICY "Users can view their company's notifications" ON notifications
  FOR ALL USING (company_id = (auth.jwt() ->> 'company_id')::uuid);
```

## 🔧 Functions e Triggers

### Trigger para Updated_at

```sql
-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar em todas as tabelas
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... (aplicar em todas as outras tabelas)
```

### Function para Validação de Planos

```sql
-- Função para verificar limites do plano gratuito
CREATE OR REPLACE FUNCTION check_free_plan_limits()
RETURNS TRIGGER AS $$
DECLARE
  company_plan TEXT;
  client_count INTEGER;
  pet_count INTEGER;
BEGIN
  -- Buscar plano da empresa
  SELECT plan_type INTO company_plan
  FROM companies
  WHERE id = NEW.company_id;
  
  -- Se for plano premium, permitir
  IF company_plan = 'premium' THEN
    RETURN NEW;
  END IF;
  
  -- Verificar limites do plano gratuito
  IF TG_TABLE_NAME = 'clients' THEN
    SELECT COUNT(*) INTO client_count
    FROM clients
    WHERE company_id = NEW.company_id AND is_active = true;
    
    IF client_count >= 20 THEN
      RAISE EXCEPTION 'Limite de 20 clientes atingido no plano gratuito';
    END IF;
  END IF;
  
  IF TG_TABLE_NAME = 'pets' THEN
    SELECT COUNT(*) INTO pet_count
    FROM pets
    WHERE company_id = NEW.company_id AND is_active = true;
    
    IF pet_count >= 30 THEN
      RAISE EXCEPTION 'Limite de 30 pets atingido no plano gratuito';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER check_clients_limit BEFORE INSERT ON clients
  FOR EACH ROW EXECUTE FUNCTION check_free_plan_limits();

CREATE TRIGGER check_pets_limit BEFORE INSERT ON pets
  FOR EACH ROW EXECUTE FUNCTION check_free_plan_limits();
```

## 📊 Views Úteis

### Dashboard Metrics

```sql
CREATE VIEW dashboard_metrics AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.plan_type,
  
  -- Contadores
  (SELECT COUNT(*) FROM clients WHERE company_id = c.id AND is_active = true) as total_clients,
  (SELECT COUNT(*) FROM pets WHERE company_id = c.id AND is_active = true) as total_pets,
  (SELECT COUNT(*) FROM users WHERE company_id = c.id AND is_active = true) as total_users,
  
  -- Agendamentos hoje
  (SELECT COUNT(*) FROM appointments 
   WHERE company_id = c.id 
   AND date_time::date = CURRENT_DATE
   AND status NOT IN ('cancelled', 'no_show')) as appointments_today,
  
  -- Receita do mês
  (SELECT COALESCE(SUM(net_amount), 0) FROM transactions 
   WHERE company_id = c.id 
   AND type = 'income'
   AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
   AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)) as revenue_this_month
   
FROM companies c;
```

## 🔄 Backup e Manutenção

### Estratégia de Backup
- **Backup automático**: Supabase realiza backups diários
- **Point-in-time recovery**: Disponível por 7 dias
- **Backup manual**: Antes de grandes atualizações




==============================================================================







### Manutenção
```sql
-- Limpeza de dados antigos (executar mensalmente)
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '90 days'
AND status = 'sent';

-- Reindexação (se necessário)
REINDEX TABLE appointments;

-- Análise de performance
ANALYZE;
```

---

**Esta estrutura garante um banco de dados robusto, seguro e escalável para o Pet Connect.**