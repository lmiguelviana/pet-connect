import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { z } from 'zod';

// Schema de validação para criação de conta
const createAccountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  type: z.enum(['bank', 'cash', 'credit', 'savings'], {
    errorMap: () => ({ message: 'Tipo de conta inválido' })
  }),
  initial_balance: z.number().min(0, 'Saldo inicial não pode ser negativo'),
  bank_name: z.string().max(100, 'Nome do banco muito longo').optional(),
  account_number: z.string().max(50, 'Número da conta muito longo').optional()
});

// Schema de validação para atualização de conta
const updateAccountSchema = createAccountSchema.partial().extend({
  is_active: z.boolean().optional()
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    
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

    // Parâmetros de query
    const type = searchParams.get('type');
    const active = searchParams.get('active');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    // Construir query
    let query = supabase
      .from('financial_accounts')
      .select('*')
      .eq('company_id', userData.company_id)
      .order('name');

    // Aplicar filtros
    if (type) {
      query = query.eq('type', type);
    }

    if (active !== null) {
      query = query.eq('is_active', active === 'true');
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,bank_name.ilike.%${search}%`);
    }

    // Aplicar paginação
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: accounts, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar contas:', error);
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }

    // Calcular estatísticas
    const { data: stats } = await supabase
      .from('financial_accounts')
      .select('type, balance, is_active')
      .eq('company_id', userData.company_id);

    const statistics = {
      total: stats?.length || 0,
      active: stats?.filter(s => s.is_active).length || 0,
      inactive: stats?.filter(s => !s.is_active).length || 0,
      total_balance: stats?.reduce((sum, s) => sum + (s.balance || 0), 0) || 0,
      by_type: {
        bank: stats?.filter(s => s.type === 'bank').length || 0,
        cash: stats?.filter(s => s.type === 'cash').length || 0,
        credit: stats?.filter(s => s.type === 'credit').length || 0,
        savings: stats?.filter(s => s.type === 'savings').length || 0
      }
    };

    return NextResponse.json({
      accounts: accounts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      statistics
    });

  } catch (error) {
    console.error('Erro na API de contas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const validatedData = createAccountSchema.parse(body);

    // Verificar se já existe conta com o mesmo nome
    const { data: existingAccount } = await supabase
      .from('financial_accounts')
      .select('id')
      .eq('company_id', userData.company_id)
      .eq('name', validatedData.name)
      .single();

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Já existe uma conta com este nome' },
        { status: 400 }
      );
    }

    // Criar conta
    const { data: account, error } = await supabase
      .from('financial_accounts')
      .insert({
        ...validatedData,
        company_id: userData.company_id,
        balance: validatedData.initial_balance
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar conta:', error);
      return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 });
    }

    return NextResponse.json({ account }, { status: 201 });

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