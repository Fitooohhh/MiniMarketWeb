const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL\s*=\s*['"\s]*(.*?)['"\s]*$/m)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY\s*=\s*['"\s]*(.*?)['"\s]*$/m)[1];

console.log('URL:', url);

const supabase = createClient(url, key);

async function inspect() {
  const { data, error } = await supabase.from('recompensa').select('*').limit(1);
  if (error) {
    console.error('Error fetching recompensa:', error);
  } else {
    console.log('Recompensa columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No data in recompensa');
  }

  const { data: niveles, error: errorNivel } = await supabase.from('nivel_cliente').select('*').limit(1);
  if (errorNivel) {
    console.error('Error fetching nivel_cliente:', errorNivel);
  } else {
    console.log('Nivel columns:', niveles && niveles.length > 0 ? Object.keys(niveles[0]) : 'No data in nivel_cliente');
  }
}

inspect();
