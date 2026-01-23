const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = {};
fs.readFileSync('.env.local', 'utf-8').split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key.trim()) env[key.trim()] = valueParts.join('=').trim();
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function checkStatus() {
  const userId = '38ab48c7-42a8-4299-a2e7-3f7ffa970c3e';
  
  const { data: user } = await supabase.from('users_ext').select('*').eq('user_id', userId).single();
  console.log('User record:', JSON.stringify(user, null, 2));
  
  const { data: tools } = await supabase.from('tools').select('id, name, available').eq('owner_id', userId);
  console.log('\nTools:', tools?.map(t => ({ name: t.name, available: t.available })));
  console.log('Tool count:', tools?.filter(t => t.available).length);
}

checkStatus();
