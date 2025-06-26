const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugAuthIssue() {
  console.log('🔍 Debugando problema de autenticação...')
  
  try {
    // Verificar se há usuários na tabela
    console.log('\n👤 Verificando usuários existentes...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, company_id')
      .limit(5)
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError)
    } else {
      console.log('✅ Usuários encontrados:', users?.length || 0)
      if (users && users.length > 0) {
        console.log('Primeiros usuários:', users)
      }
    }
    
    // Verificar se há empresas na tabela
    console.log('\n🏢 Verificando empresas existentes...')
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, plan_type')
      .limit(5)
    
    if (companiesError) {
      console.log('❌ Erro ao buscar empresas:', companiesError)
    } else {
      console.log('✅ Empresas encontradas:', companies?.length || 0)
      if (companies && companies.length > 0) {
        console.log('Primeiras empresas:', companies)
      }
    }
    
    // Verificar sessão atual
    console.log('\n🔐 Verificando sessão atual...')
    const { data: session, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.log('❌ Erro ao verificar sessão:', sessionError)
    } else if (session?.session) {
      console.log('✅ Usuário logado:', session.session.user.email)
      console.log('User ID:', session.session.user.id)
      
      // Tentar buscar dados do usuário logado
      console.log('\n🔍 Tentando buscar dados do usuário logado...')
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.session.user.id)
        .single()
      
      if (userDataError) {
        console.log('❌ Erro ao buscar dados do usuário logado:', userDataError)
        console.log('Código do erro:', userDataError.code)
        console.log('Detalhes:', userDataError.details)
      } else {
        console.log('✅ Dados do usuário encontrados:', userData)
      }
    } else {
      console.log('ℹ️ Nenhum usuário logado')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugAuthIssue()