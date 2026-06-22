const fs = require('fs');
const https = require('https');

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL\s*=\s*['"\s]*(.*?)['"\s]*$/m)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY\s*=\s*['"\s]*(.*?)['"\s]*$/m)[1];

const restUrl = `${url}/rest/v1/`;

const options = {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
};

https.get(restUrl, options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const schema = JSON.parse(body);
      const recompensaDef = schema.definitions.recompensa;
      console.log('Recompensa Definition:', JSON.stringify(recompensaDef, null, 2));
      
      const nivelDef = schema.definitions.nivel_cliente;
      console.log('Nivel Definition:', JSON.stringify(nivelDef, null, 2));
    } catch (e) {
      console.error('Error parsing OpenAPI spec:', e);
      console.log('Body:', body);
    }
  });
}).on('error', console.error);
