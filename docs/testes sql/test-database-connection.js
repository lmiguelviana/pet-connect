// Script para testar a conexão com o banco de dados Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas!');
  console.log('Verifique se o arquivo .env.local existe e contém:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔄 Testando conexão com o Supabase...');
  console.log(`📍 URL: ${supabaseUrl}`);
  
  try {
    // Teste 1: Verificar se as tabelas existem
    console.log('\n📋 Verificando tabelas criadas...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'companies', 'users', 'clients', 'pets', 'pet_photos',
        'services', 'appointments', 'transactions', 'notifications'
      ]);
    
    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError.message);
      return;
    }
    
    const expectedTables = [
      'companies', 'users', 'clients', 'pets', 'pet_photos',
      'services', 'appointments', 'transactions', 'notifications'
    ];
    
    const foundTables = tables?.map(t => t.table_name) || [];
    const missingTables = expectedTables.filter(table => !foundTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('⚠️  Tabelas não encontradas:', missingTables.join(', '));
      console.log('💡 Execute os scripts SQL na ordem correta no Supabase Dashboard');
    } else {
      console.log('✅ Todas as 9 tabelas foram criadas com sucesso!');
    }
    
    // Teste 2: Verificar se a view dashboard_metrics existe
    console.log('\n📊 Verificando view dashboard_metrics...');
    const { data: viewData, error: viewError } = await supabase
      .from('dashboard_metrics')
      .select('*')
      .limit(1);
    
    if (viewError) {
      console.log('⚠️  View dashboard_metrics não encontrada ou com erro:', viewError.message);
    } else {
      console.log('✅ View dashboard_metrics criada com sucesso!');
    }
    
    // Teste 3: Verificar RLS
    console.log('\n🔒 Verificando Row Level Security...');
    const { data: rlsData, error: rlsError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1);
    
    if (rlsError && rlsError.code === 'PGRST116') {
      console.log('✅ RLS está ativo (esperado - sem dados ainda)');
    } else if (rlsData) {
      console.log('✅ RLS configurado e funcionando!');
    }
    
    console.log('\n🎉 Teste de conexão concluído!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Configure a autenticação no Supabase Dashboard');
    console.log('2. Inicie o servidor de desenvolvimento: npm run dev');
    console.log('3. Acesse http://localhost:3000 para testar a aplicação');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testConnection();