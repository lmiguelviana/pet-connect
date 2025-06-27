#!/usr/bin/env node

/**
 * Script para aplicar a migração do módulo financeiro
 * 
 * Este script lê o arquivo de migração e exibe instruções
 * para executar no Supabase Dashboard
 */

const fs = require('fs');
const path = require('path');

const MIGRATION_FILE = path.join(__dirname, '..', 'supabase', 'migrations', '20241220000001_financial_module.sql');

console.log('🚀 Pet Connect - Migração do Módulo Financeiro\n');

try {
  // Verificar se o arquivo existe
  if (!fs.existsSync(MIGRATION_FILE)) {
    console.error('❌ Arquivo de migração não encontrado:', MIGRATION_FILE);
    process.exit(1);
  }

  // Ler o conteúdo da migração
  const migrationContent = fs.readFileSync(MIGRATION_FILE, 'utf8');
  
  console.log('📋 INSTRUÇÕES PARA EXECUTAR A MIGRAÇÃO:');
  console.log('\n1. Acesse o Supabase Dashboard: https://supabase.com');
  console.log('2. Faça login e acesse seu projeto Pet Connect');
  console.log('3. Clique em "SQL Editor" no menu lateral');
  console.log('4. Copie e cole o conteúdo abaixo no editor:');
  console.log('5. Clique em "Run" para executar\n');
  
  console.log('=' .repeat(80));
  console.log('CONTEÚDO DA MIGRAÇÃO (copie tudo abaixo):');
  console.log('=' .repeat(80));
  console.log(migrationContent);
  console.log('=' .repeat(80));
  
  console.log('\n✅ Após executar a migração, o módulo financeiro estará funcional!');
  console.log('\n📊 Tabelas que serão criadas:');
  console.log('   - financial_accounts (contas bancárias)');
  console.log('   - financial_categories (categorias)');
  console.log('   - financial_transactions (transações)');
  console.log('   - financial_transfers (transferências)');
  
} catch (error) {
  console.error('❌ Erro ao ler arquivo de migração:', error.message);
  process.exit(1);
}