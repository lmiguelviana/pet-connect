const { createClient } = require('@supabase/supabase-js')
const crypto = require('crypto')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
  process.exit(1)
}

// Cliente com anon key para operações normais
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente admin se disponível
let supabaseAdmin = null
if (supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

async function createTestData() {
  console.log('🚀 Criando dados de teste...')
  
  try {
    let company = null
    let userId = null
    
    // Se temos service key, usar para criar empresa diretamente
    if (supabaseAdmin) {
      console.log('\n🔑 Usando service key para bootstrap inicial...')
      
      // 1. Verificar ou criar empresa usando admin client
      console.log('\n🏢 Verificando empresa de teste...')
      
      // Primeiro, tentar buscar empresa existente
      const { data: existingCompany, error: searchError } = await supabaseAdmin
        .from('companies')
        .select('*')
        .eq('email', 'admin@petshop.demo')
        .single()
      
      if (existingCompany && !searchError) {
        company = existingCompany
        console.log('✅ Empresa já existe:', company.name, '- ID:', company.id)
      } else {
        // Criar nova empresa
        const { data: companyData, error: companyError } = await supabaseAdmin
          .from('companies')
          .insert({
            name: 'Pet Shop Demo',
            plan_type: 'premium',
            subscription_status: 'active',
            email: 'admin@petshop.demo',
            phone: '(11) 99999-9999',
            address: 'Rua das Flores, 123 - São Paulo/SP',
            cnpj: '12.345.678/0001-90'
          })
          .select()
          .single()
        
        if (companyError) {
          console.log('❌ Erro ao criar empresa:', companyError)
          return
        }
        
        company = companyData
        console.log('✅ Empresa criada:', company.name, '- ID:', company.id)
      }
      
      // 2. Criar ou buscar usuário no Auth
      console.log('\n👤 Verificando usuário administrador...')
      
      // Primeiro, tentar buscar o usuário existente
      const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      
      let authUser = null
      if (!listError && existingUsers?.users) {
        authUser = existingUsers.users.find(user => user.email === 'admin@petshop.demo')
      }
      
      if (authUser) {
        console.log('✅ Usuário já existe:', authUser.email)
        userId = authUser.id
      } else {
        // Criar novo usuário
        const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: 'admin@petshop.demo',
          password: 'admin123456',
          email_confirm: true,
          user_metadata: {
            company_id: company.id
          }
        })
        
        if (authError) {
          console.log('❌ Erro ao criar usuário no Auth:', authError)
          return
        }
        
        userId = newAuthUser.user.id
        console.log('✅ Usuário Auth criado:', newAuthUser.user.email)
      }
      
      // 3. Criar registro na tabela users
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          company_id: company.id,
          name: 'Administrador',
          email: 'admin@petshop.demo',
          phone: '(11) 99999-9999',
          role: 'admin',
          permissions: ['all'],
          is_active: true
        })
        .select()
        .single()
      
      if (userError) {
        console.log('❌ Erro ao criar usuário na tabela:', userError)
        return
      }
      
      console.log('✅ Usuário criado na tabela:', user.name)
      
    } else {
      console.log('\n⚠️  Service key não disponível, tentando método alternativo...')
      
      // Método alternativo: fazer login e tentar criar empresa
      console.log('\n🔐 Fazendo signup/login...')
      
      // Tentar signup
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'admin@petshop.demo',
        password: 'admin123456'
      })
      
      if (signUpError && !signUpError.message.includes('already registered')) {
        console.log('❌ Erro no signup:', signUpError)
        return
      }
      
      // Fazer login
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'admin@petshop.demo',
        password: 'admin123456'
      })
      
      if (loginError) {
        console.log('❌ Erro no login:', loginError)
        return
      }
      
      console.log('✅ Login realizado:', loginData.user.email)
      userId = loginData.user.id
      
      // Tentar buscar empresa existente primeiro
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('*')
        .eq('email', 'admin@petshop.demo')
        .single()
      
      if (existingCompany) {
        console.log('✅ Empresa existente encontrada:', existingCompany.name)
        company = existingCompany
      } else {
        console.log('❌ Não foi possível criar empresa sem service key')
        console.log('💡 Configure SUPABASE_SERVICE_ROLE_KEY no .env.local para bootstrap inicial')
        return
      }
    }
    
    // 4. Criar clientes de teste (usando admin client se disponível)
    console.log('\n👥 Criando clientes de teste...')
    const clientsData = [
      {
        company_id: company.id,
        name: 'Maria Silva',
        email: 'maria@email.com',
        phone: '(11) 98888-8888',
        address: 'Rua A, 100',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01000-000'
      },
      {
        company_id: company.id,
        name: 'João Santos',
        email: 'joao@email.com',
        phone: '(11) 97777-7777',
        address: 'Rua B, 200',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '02000-000'
      }
    ]
    
    const clientToUse = supabaseAdmin || supabase
    const { data: createdClients, error: clientsError } = await clientToUse
      .from('clients')
      .upsert(clientsData)
      .select()
    
    if (clientsError) {
      console.log('❌ Erro ao criar clientes:', clientsError)
    } else {
      console.log('✅ Clientes criados:', createdClients.length)
    }
    
    // 5. Criar pets de teste
    if (createdClients && createdClients.length > 0) {
      console.log('\n🐕 Criando pets de teste...')
      const petsData = [
        {
          company_id: company.id,
          client_id: createdClients[0].id,
          name: 'Rex',
          species: 'dog',
          breed: 'Golden Retriever',
          gender: 'male',
          birth_date: '2020-05-15',
          weight: 25.5,
          color: 'Dourado'
        },
        {
          company_id: company.id,
          client_id: createdClients[1].id,
          name: 'Mimi',
          species: 'cat',
          breed: 'Persa',
          gender: 'female',
          birth_date: '2021-03-10',
          weight: 4.2,
          color: 'Branco'
        }
      ]
      
      const { data: createdPets, error: petsError } = await clientToUse
        .from('pets')
        .upsert(petsData)
        .select()
      
      if (petsError) {
        console.log('❌ Erro ao criar pets:', petsError)
      } else {
        console.log('✅ Pets criados:', createdPets.length)
      }
    }
    
    console.log('\n🎉 Dados de teste criados com sucesso!')
    console.log('\n📋 Credenciais de acesso:')
    console.log('Email: admin@petshop.demo')
    console.log('Senha: admin123456')
    console.log('\n🌐 Acesse: http://localhost:3000')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

createTestData()