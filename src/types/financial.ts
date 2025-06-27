// Tipos para o módulo financeiro - Pet Connect

export interface FinancialAccount {
  id: string;
  company_id: string;
  name: string;
  type: 'bank' | 'cash' | 'credit' | 'savings';
  balance: number;
  initial_balance: number;
  bank_name?: string;
  account_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialCategory {
  id: string;
  company_id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface FinancialTransaction {
  id: string;
  company_id: string;
  account_id: string;
  category_id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description?: string;
  transaction_date: string;
  reference_type?: 'appointment' | 'manual' | 'recurring';
  reference_id?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  account?: FinancialAccount;
  category?: FinancialCategory;
  created_by_user?: {
    id: string;
    name: string;
  };
}

export interface FinancialTransfer {
  id: string;
  company_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description?: string;
  transfer_date: string;
  from_transaction_id?: string;
  to_transaction_id?: string;
  created_by: string;
  created_at: string;
  
  // Relacionamentos
  from_account?: FinancialAccount;
  to_account?: FinancialAccount;
  created_by_user?: {
    id: string;
    name: string;
  };
}

// Tipos para formulários
export interface CreateAccountData {
  name: string;
  type: 'bank' | 'cash' | 'credit' | 'savings';
  initial_balance: number;
  bank_name?: string;
  account_number?: string;
}

export interface CreateCategoryData {
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string;
}

export interface CreateTransactionData {
  account_id: string;
  category_id: string;
  type: 'income' | 'expense';
  amount: number;
  description?: string;
  transaction_date: string;
  reference_type?: 'appointment' | 'manual' | 'recurring';
  reference_id?: string;
  notes?: string;
}

export interface CreateTransferData {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description?: string;
  transfer_date: string;
}

// Tipos para dashboard e relatórios
export interface FinancialSummary {
  total_income: number;
  total_expenses: number;
  net_profit: number;
  total_balance: number;
  period_start: string;
  period_end: string;
}

export interface MonthlyFinancialData {
  month: string;
  income: number;
  expenses: number;
  profit: number;
}

export interface CategorySummary {
  category_id: string;
  category_name: string;
  category_type: 'income' | 'expense';
  category_color: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
}

export interface AccountBalance {
  account_id: string;
  account_name: string;
  account_type: string;
  balance: number;
  last_transaction_date?: string;
}

export interface FinancialMetrics {
  average_ticket: number;
  revenue_per_pet: number;
  monthly_growth: number;
  top_service_category: string;
  total_clients_served: number;
}

export interface RecentTransaction {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  account_name: string;
  category_name?: string;
  transaction_date: string;
  reference_type?: string;
}

// Tipos para filtros e paginação
export interface TransactionFilters {
  account_id?: string;
  category_id?: string;
  type?: 'income' | 'expense' | 'transfer';
  date_from?: string;
  date_to?: string;
  reference_type?: 'appointment' | 'manual' | 'recurring';
  search?: string;
}

export interface FinancialReportFilters {
  period: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  date_from?: string;
  date_to?: string;
  account_ids?: string[];
  category_ids?: string[];
  include_transfers?: boolean;
}

// Tipos para respostas da API
export interface TransactionsResponse {
  transactions: FinancialTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    total_income: number;
    total_expenses: number;
    net_amount: number;
    transaction_count: number;
  };
}

export interface FinancialDashboardData {
  summary: FinancialSummary;
  monthly_data: MonthlyFinancialData[];
  top_income_categories: CategorySummary[];
  top_expense_categories: CategorySummary[];
  account_balances: AccountBalance[];
  recent_transactions: RecentTransaction[];
  metrics: FinancialMetrics;
}

// Constantes
export const ACCOUNT_TYPES = {
  bank: { label: 'Conta Bancária', icon: 'building-library' },
  cash: { label: 'Dinheiro', icon: 'banknotes' },
  credit: { label: 'Cartão de Crédito', icon: 'credit-card' },
  savings: { label: 'Poupança', icon: 'piggy-bank' }
} as const;

export const TRANSACTION_TYPES = {
  income: { label: 'Receita', color: '#10B981' },
  expense: { label: 'Despesa', color: '#EF4444' },
  transfer: { label: 'Transferência', color: '#6366F1' }
} as const;

export const REFERENCE_TYPES = {
  appointment: { label: 'Agendamento', icon: 'calendar' },
  manual: { label: 'Manual', icon: 'pencil' },
  recurring: { label: 'Recorrente', icon: 'arrow-path' }
} as const;

export const DEFAULT_CATEGORY_COLORS = [
  '#10B981', '#059669', '#0D9488', '#0891B2', '#0284C7',
  '#DC2626', '#B91C1C', '#991B1B', '#7C2D12', '#92400E',
  '#A16207', '#78716C', '#6366F1', '#8B5CF6', '#EC4899'
];