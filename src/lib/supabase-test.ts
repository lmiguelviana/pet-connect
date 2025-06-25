import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

console.log('🔧 Configuração:')
console.log('URL:', supabaseUrl)
console.log('Service Key:', supabaseServiceKey ? 'Configurada' : 'Não encontrada')

// Usar service role key para operações administrativas
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testando conexão com Supabase...')
    
    // Teste mais simples - verificar se conseguimos executar uma query básica
    const { data, error } = await supabase
      .rpc('version')
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message)
      
      // Tentar uma abordagem alternativa
      console.log('🔄 Tentando abordagem alternativa...')
      const { data: tables, error: tablesError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .limit(10)
      
      if (tablesError) {
        console.log('❌ Erro na segunda tentativa:', tablesError.message)
        return false
      }
      
      console.log('✅ Conexão funcionando via pg_tables!')
      console.log('📋 Tabelas encontradas:', tables?.map(t => t.tablename) || [])
      return true
    }
    
    console.log('✅ Conexão com Supabase funcionando!')
    console.log('📋 Versão do PostgreSQL:', data)
    return true
  } catch (error) {
    console.log('❌ Erro inesperado:', error)
    return false
  }
}

export async function createDatabaseTables() {
  try {
    console.log('🏗️ Criando estrutura do banco de dados...')
    
    // Ler o script SQL
    const scriptPath = path.join(process.cwd(), 'supabase_reset_script.sql')
    const sqlScript = fs.readFileSync(scriptPath, 'utf8')
    
    // Dividir o script em comandos individuais
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let index = 0; index < commands.length; index++) {
       const command = commands[index]
      try {
        if (command.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql: command })
          
          if (error) {
            console.log(`❌ Erro no comando ${index + 1}:`, error.message)
            errorCount++
          } else {
            successCount++
            if (index % 10 === 0) {
              console.log(`✅ Progresso: ${index + 1}/${commands.length} comandos executados`)
            }
          }
        }
      } catch (err) {
        console.log(`❌ Erro inesperado no comando ${index + 1}:`, err)
        errorCount++
      }
    }
    
    console.log(`\n📊 Resultado:`)
    console.log(`✅ Sucessos: ${successCount}`)
    console.log(`❌ Erros: ${errorCount}`)
    
    return errorCount === 0
  } catch (error) {
    console.log('❌ Erro ao criar tabelas:', error)
    return false
  }
}

export async function runSupabaseTests() {
  console.log('🚀 Iniciando setup do banco Pet Connect...')
  
  const isConnected = await testSupabaseConnection()
  if (isConnected) {
    const tablesCreated = await createDatabaseTables()
    if (tablesCreated) {
      console.log('🎉 Banco de dados configurado com sucesso!')
    } else {
      console.log('⚠️ Houve problemas na configuração do banco')
    }
  }
  
  console.log('✅ Setup concluído!')
}

// Executar testes se chamado diretamente
if (require.main === module) {
  runSupabaseTests()
}