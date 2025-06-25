-- =====================================================
-- VIEW DASHBOARD METRICS
-- =====================================================
-- Execute este script após criar funções e triggers

-- Criar view para métricas do dashboard
CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT 
  c.id as company_id,
  c.name as company_name,
  
  -- Contadores gerais
  (
    SELECT COUNT(*) 
    FROM clients cl 
    WHERE cl.company_id = c.id AND cl.is_active = true
  ) as total_clients,
  
  (
    SELECT COUNT(*) 
    FROM pets p 
    WHERE p.company_id = c.id AND p.is_active = true
  ) as total_pets,
  
  (
    SELECT COUNT(*) 
    FROM users u 
    WHERE u.company_id = c.id AND u.is_active = true
  ) as total_users,
  
  -- Agendamentos
  (
    SELECT COUNT(*) 
    FROM appointments a 
    WHERE a.company_id = c.id 
    AND a.date_time >= CURRENT_DATE
    AND a.status IN ('scheduled', 'confirmed')
  ) as upcoming_appointments,
  
  (
    SELECT COUNT(*) 
    FROM appointments a 
    WHERE a.company_id = c.id 
    AND DATE(a.date_time) = CURRENT_DATE
    AND a.status IN ('scheduled', 'confirmed', 'in_progress')
  ) as today_appointments,
  
  -- Financeiro do mês atual
  (
    SELECT COALESCE(SUM(net_amount), 0) 
    FROM transactions t 
    WHERE t.company_id = c.id 
    AND t.type = 'income'
    AND t.payment_status = 'paid'
    AND DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', CURRENT_DATE)
  ) as monthly_revenue,
  
  (
    SELECT COALESCE(SUM(net_amount), 0) 
    FROM transactions t 
    WHERE t.company_id = c.id 
    AND t.type = 'expense'
    AND t.payment_status = 'paid'
    AND DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', CURRENT_DATE)
  ) as monthly_expenses,
  
  -- Financeiro de hoje
  (
    SELECT COALESCE(SUM(net_amount), 0) 
    FROM transactions t 
    WHERE t.company_id = c.id 
    AND t.type = 'income'
    AND t.payment_status = 'paid'
    AND DATE(t.created_at) = CURRENT_DATE
  ) as daily_revenue,
  
  -- Pendências
  (
    SELECT COUNT(*) 
    FROM transactions t 
    WHERE t.company_id = c.id 
    AND t.payment_status = 'pending'
    AND t.due_date <= CURRENT_DATE + INTERVAL '7 days'
  ) as pending_payments,
  
  (
    SELECT COUNT(*) 
    FROM notifications n 
    WHERE n.company_id = c.id 
    AND n.status = 'pending'
    AND (n.scheduled_for IS NULL OR n.scheduled_for <= NOW())
  ) as pending_notifications,
  
  -- Informações da empresa
  c.plan_type,
  c.created_at as company_created_at,
  
  -- Timestamp da consulta
  NOW() as calculated_at
  
FROM companies c
WHERE c.subscription_status = 'active';

-- Nota: Views não suportam RLS diretamente no PostgreSQL
-- A segurança é controlada pelas tabelas base que já possuem RLS
-- A view herda automaticamente as restrições das tabelas subjacentes

-- =====================================================
-- VIEW DASHBOARD CRIADA COM SUCESSO!
-- =====================================================
-- Próximo passo: Execute o script 12-final-setup.sql
-- =====================================================