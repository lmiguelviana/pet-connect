const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Testando conexão com o novo Supabase...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? 'Configurada' : 'Não encontrada')

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\n📊 Testando conexão básica...')
    
    // Testar se a tabela companies existe
    const { data: testData, error: testError } = await supabase
      .from('companies')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Erro - tabelas não existem:', testError.message)
      console.log('\n🔧 O banco precisa ser configurado primeiro!')
      return
    }
    
    console.log('✅ Conexão com banco funcionando!')
    
    // Verificar se existe a empresa de teste
    console.log('\n👥 Verificando empresa de teste...')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .eq('email', 'admin@petshop.demo')
    
    if (companiesError) {
      console.error('❌ Erro ao buscar empresa:', companiesError)
    } else {
      console.log('✅ Empresa encontrada:', companies)
    }
    
    // Verificar usuário de teste
    console.log('\n👤 Verificando usuário de teste...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@petshop.demo')
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuário:', usersError)
    } else {
      console.log('✅ Usuário encontrado:', users)
    }
    
    // Verificar autenticação
    console.log('\n🔐 Testando autenticação...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@petshop.demo',
      password: 'admin123456'
    })
    
    if (authError) {
      console.error('❌ Erro na autenticação:', authError)
    } else {
      console.log('✅ Autenticação bem-sucedida!')
      console.log('User ID:', authData.user?.id)
      
      // Fazer logout
      await supabase.auth.signOut()
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testConnection()