const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkServicesTables() {
  console.log('🔍 Verificando tabelas do módulo de serviços...');
  
  try {
    // Verificar tabela services
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('count', { count: 'exact', head: true });
    
    if (servicesError) {
      console.log('❌ Tabela SERVICES não existe:', servicesError.message);
    } else {
      console.log('✅ Tabela SERVICES existe');
    }
    
    // Verificar tabela service_photos
    const { data: photosData, error: photosError } = await supabase
      .from('service_photos')
      .select('count', { count: 'exact', head: true });
    
    if (photosError) {
      console.log('❌ Tabela SERVICE_PHOTOS não existe:', photosError.message);
    } else {
      console.log('✅ Tabela SERVICE_PHOTOS existe');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkServicesTables();