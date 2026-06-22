const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL\s*=\s*['"\s]*(.*?)['"\s]*$/m)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY\s*=\s*['"\s]*(.*?)['"\s]*$/m)[1];

const supabase = createClient(url, key);

async function testInsert() {
  const tempRow = {
    nombre: 'TEMP_TEST_RECOMPENSA',
    puntos_requeridos: 9999,
    tipo: 'descuento',
    valor: 10,
    stock_disponible: 1,
    stock_ilimitado: false,
    activa: false,
    descripcion: 'Temporary',
    producto_id: null
  };

  const { data, error } = await supabase.from('recompensa').insert([tempRow]).select();
  console.log('Error for producto_id:', error);
}

testInsert();
