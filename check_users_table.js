const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUsersTable() {
  try {
    console.log('🔍 Verificando tabela users...')
    
    // Tentar fazer uma query simples na tabela users
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro ao acessar tabela users:', error.message)
      console.error('Código do erro:', error.code)
      console.error('Detalhes:', error.details)
      
      if (error.code === '42P01') {
        console.log('\n💡 A tabela "users" não existe no banco de dados.')
        console.log('Execute o script: docs/banco de dados/02-users-table.sql')
      } else if (error.code === 'PGRST116') {
        console.log('\n💡 Problema com RLS (Row Level Security) na tabela users.')
        console.log('Verifique as políticas de segurança.')
      }
    } else {
      console.log('✅ Tabela users existe e está acessível')
      console.log('Dados:', data)
    }
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message)
  }
}

checkUsersTable()