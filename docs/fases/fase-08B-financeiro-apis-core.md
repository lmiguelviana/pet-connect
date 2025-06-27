# Fase 8B - Módulo Financeiro: APIs Core

## 📋 Visão Geral
Implementação das APIs restantes do módulo financeiro (categorias, transações e transferências) para completar o backend do sistema.

## 🎯 Objetivos
- [x] API de Categorias Financeiras (`/api/financial/categories`)
- [x] API de Transações (`/api/financial/transactions`)
- [x] API de Transferências (`/api/financial/transfers`)
- [x] Validação Zod para todas as APIs
- [ ] Testes das APIs com RLS

## ✅ Progresso

- [x] Arquivo de planejamento criado
- [x] API de categorias (`/api/financial/categories`) - GET, POST
- [x] API de categorias individuais (`/api/financial/categories/[id]`) - GET, PUT, DELETE
- [x] API de transações (`/api/financial/transactions`) - GET, POST
- [x] API de transações individuais (`/api/financial/transactions/[id]`) - GET, PUT, DELETE
- [x] API de transferências (`/api/financial/transfers`) - GET, POST
- [x] API de transferências individuais (`/api/financial/transfers/[id]`) - GET, PUT, DELETE
- [ ] Componentes básicos
- [ ] Integração na página `/financial`

## 🏗️ Estrutura de Implementação

### 1. API de Categorias (`/api/financial/categories`)
```typescript
// GET /api/financial/categories
// POST /api/financial/categories
// PUT /api/financial/categories/[id]
// DELETE /api/financial/categories/[id]
```

**Campos da Categoria:**
- `name`: string (obrigatório)
- `type`: 'income' | 'expense' (obrigatório)
- `color`: string (hex color)
- `icon`: string (nome do ícone)
- `company_id`: string (automático via RLS)

### 2. API de Transações (`/api/financial/transactions`)
```typescript
// GET /api/financial/transactions?page=1&limit=10&category=&type=&date_from=&date_to=
// POST /api/financial/transactions
// PUT /api/financial/transactions/[id]
// DELETE /api/financial/transactions/[id]
```

**Campos da Transação:**
- `account_id`: string (obrigatório)
- `category_id`: string (obrigatório)
- `amount`: number (obrigatório)
- `type`: 'income' | 'expense' (obrigatório)
- `description`: string
- `date`: Date (obrigatório)
- `appointment_id`: string (opcional - para transações automáticas)
- `company_id`: string (automático via RLS)

### 3. API de Transferências (`/api/financial/transfers`)
```typescript
// GET /api/financial/transfers
// POST /api/financial/transfers
// PUT /api/financial/transfers/[id]
// DELETE /api/financial/transfers/[id]
```

**Campos da Transferência:**
- `from_account_id`: string (obrigatório)
- `to_account_id`: string (obrigatório)
- `amount`: number (obrigatório)
- `description`: string
- `date`: Date (obrigatório)
- `company_id`: string (automático via RLS)

## 🎨 Design System Financeiro

### Cores por Tipo
```typescript
const FINANCIAL_COLORS = {
  income: {
    primary: '#10B981',   // Verde principal
    light: '#6EE7B7',     // Verde claro
    dark: '#047857'       // Verde escuro
  },
  expense: {
    primary: '#EF4444',   // Vermelho principal
    light: '#FCA5A5',     // Vermelho claro
    dark: '#B91C1C'      // Vermelho escuro
  },
  transfer: {
    primary: '#3B82F6',   // Azul principal
    light: '#93C5FD',     // Azul claro
    dark: '#1D4ED8'      // Azul escuro
  }
}
```

### Ícones Padrão
```typescript
const DEFAULT_ICONS = {
  income: ['💰', '💵', '📈', '🎯', '💎'],
  expense: ['🛒', '🍔', '⛽', '🏠', '💊', '🎮', '👕'],
  transfer: ['🔄', '↔️', '💸', '🏦']
}
```

## 🔧 Validação Zod

### Schema de Categoria
```typescript
const CategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50),
  type: z.enum(['income', 'expense']),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor inválida').optional(),
  icon: z.string().optional()
})
```

### Schema de Transação
```typescript
const TransactionSchema = z.object({
  account_id: z.string().uuid(),
  category_id: z.string().uuid(),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['income', 'expense']),
  description: z.string().max(200).optional(),
  date: z.string().datetime(),
  appointment_id: z.string().uuid().optional()
})
```

### Schema de Transferência
```typescript
const TransferSchema = z.object({
  from_account_id: z.string().uuid(),
  to_account_id: z.string().uuid(),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().max(200).optional(),
  date: z.string().datetime()
}).refine(data => data.from_account_id !== data.to_account_id, {
  message: 'Conta de origem deve ser diferente da conta de destino'
})
```

## 🔒 Segurança RLS
Todas as APIs devem:
- Verificar `company_id` automaticamente via RLS
- Validar permissões do usuário
- Sanitizar dados de entrada
- Retornar erros padronizados

## 📊 Métricas Calculadas

### Saldo por Conta
```sql
SELECT 
  fa.id,
  fa.name,
  fa.initial_balance + COALESCE(SUM(
    CASE 
      WHEN ft.type = 'income' THEN ft.amount
      WHEN ft.type = 'expense' THEN -ft.amount
      ELSE 0
    END
  ), 0) as current_balance
FROM financial_accounts fa
LEFT JOIN financial_transactions ft ON fa.id = ft.account_id
GROUP BY fa.id, fa.name, fa.initial_balance
```

### Receitas/Despesas do Mês
```sql
SELECT 
  type,
  SUM(amount) as total
FROM financial_transactions
WHERE date >= date_trunc('month', CURRENT_DATE)
  AND date < date_trunc('month', CURRENT_DATE) + interval '1 month'
GROUP BY type
```

## 🧪 Testes
- [ ] Teste de criação de categoria
- [ ] Teste de listagem com filtros
- [ ] Teste de RLS (isolamento entre empresas)
- [ ] Teste de validação Zod
- [ ] Teste de cálculo de saldos

## 📝 Próximos Passos (Fase 8C)
1. Componentes React para cada seção
2. Dashboard com gráficos
3. Integração com agendamentos
4. Relatórios financeiros

## 🎯 Critérios de Sucesso
- ✅ Todas as APIs funcionando
- ✅ RLS implementado corretamente
- ✅ Validação Zod em todas as rotas
- ✅ Métricas calculadas corretamente
- ✅ Testes passando

---

**Status:** 🟡 Em Planejamento  
**Prioridade:** Alta  
**Estimativa:** 2-3 dias  
**Dependências:** Fase 8A (Base) ✅