const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBasicTables() {
  console.log('🔍 Verificando tabelas básicas...')
  
  try {
    // Verificar tabela companies
    console.log('\n📊 Verificando tabela COMPANIES...')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('count')
      .limit(1)
    
    if (companiesError) {
      console.log('❌ Tabela COMPANIES não existe ou não acessível:', companiesError.message)
    } else {
      console.log('✅ Tabela COMPANIES existe e está acessível')
    }
    
    // Verificar tabela users
    console.log('\n👤 Verificando tabela USERS...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (usersError) {
      console.log('❌ Tabela USERS não existe ou não acessível:', usersError.message)
      console.log('Detalhes do erro:', usersError)
    } else {
      console.log('✅ Tabela USERS existe e está acessível')
    }
    
    // Verificar tabela clients
    console.log('\n👥 Verificando tabela CLIENTS...')
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('count')
      .limit(1)
    
    if (clientsError) {
      console.log('❌ Tabela CLIENTS não existe ou não acessível:', clientsError.message)
    } else {
      console.log('✅ Tabela CLIENTS existe e está acessível')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkBasicTables()