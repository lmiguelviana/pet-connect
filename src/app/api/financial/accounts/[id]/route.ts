import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { z } from 'zod';

// Schema de validação para atualização de conta
const updateAccountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo').optional(),
  type: z.enum(['bank', 'cash', 'credit', 'savings'], {
    errorMap: () => ({ message: 'Tipo de conta inválido' })
  }).optional(),
  bank_name: z.string().max(100, 'Nome do banco muito longo').optional(),
  account_number: z.string().max(50, 'Número da conta muito longo').optional(),
  is_active: z.boolean().optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar empresa do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.company_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Buscar conta
    const { data: account, error } = await supabase
      .from('financial_accounts')
      .select('*')
      .eq('id', params.id)
      .eq('company_id', userData.company_id)
      .single();

    if (error || !account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    // Buscar estatísticas da conta (últimas transações, etc.)
    const { data: recentTransactions } = await supabase
      .from('financial_transactions')
      .select(`
        id,
        type,
        amount,
        description,
        transaction_date,
        financial_categories(name, color)
      `)
      .eq('account_id', params.id)
      .order('transaction_date', { ascending: false })
      .limit(5);

    const { data: transactionStats } = await supabase
      .from('financial_transactions')
      .select('type, amount')
      .eq('account_id', params.id)
      .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    const monthlyStats = {
      total_income: transactionStats?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0,
      total_expenses: transactionStats?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0,
      transaction_count: transactionStats?.length || 0
    };

    return NextResponse.json({
      account,
      recent_transactions: recentTransactions || [],
      monthly_stats: monthlyStats
    });

  } catch (error) {
    console.error('Erro ao buscar conta:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar empresa do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.company_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Validar dados
    const body = await request.json();
    const validatedData = updateAccountSchema.parse(body);

    // Verificar se a conta existe e pertence à empresa
    const { data: existingAccount, error: checkError } = await supabase
      .from('financial_accounts')
      .select('id, name')
      .eq('id', params.id)
      .eq('company_id', userData.company_id)
      .single();

    if (checkError || !existingAccount) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    // Verificar se já existe outra conta com o mesmo nome (se o nome foi alterado)
    if (validatedData.name && validatedData.name !== existingAccount.name) {
      const { data: duplicateAccount } = await supabase
        .from('financial_accounts')
        .select('id')
        .eq('company_id', userData.company_id)
        .eq('name', validatedData.name)
        .neq('id', params.id)
        .single();

      if (duplicateAccount) {
        return NextResponse.json(
          { error: 'Já existe uma conta com este nome' },
          { status: 400 }
        );
      }
    }

    // Atualizar conta
    const { data: account, error } = await supabase
      .from('financial_accounts')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('company_id', userData.company_id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar conta:', error);
      return NextResponse.json({ error: 'Erro ao atualizar conta' }, { status: 500 });
    }

    return NextResponse.json({ account });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro na API de contas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar empresa do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.company_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Verificar se a conta existe e pertence à empresa
    const { data: existingAccount, error: checkError } = await supabase
      .from('financial_accounts')
      .select('id, name')
      .eq('id', params.id)
      .eq('company_id', userData.company_id)
      .single();

    if (checkError || !existingAccount) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 });
    }

    // Verificar se existem transações vinculadas à conta
    const { data: transactions, error: transactionError } = await supabase
      .from('financial_transactions')
      .select('id')
      .eq('account_id', params.id)
      .limit(1);

    if (transactionError) {
      console.error('Erro ao verificar transações:', transactionError);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    if (transactions && transactions.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir conta com transações vinculadas. Desative a conta em vez de excluí-la.' },
        { status: 400 }
      );
    }

    // Excluir conta
    const { error } = await supabase
      .from('financial_accounts')
      .delete()
      .eq('id', params.id)
      .eq('company_id', userData.company_id);

    if (error) {
      console.error('Erro ao excluir conta:', error);
      return NextResponse.json({ error: 'Erro ao excluir conta' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Conta excluída com sucesso' });

  } catch (error) {
    console.error('Erro na API de contas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}