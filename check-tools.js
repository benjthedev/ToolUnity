const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = {};
fs.readFileSync('.env.local', 'utf-8').split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key.trim()) env[key.trim()] = valueParts.join('=').trim();
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function checkTools() {
  const { data: tools } = await supabase
    .from('tools')
    .select('id, name, available, owner_id')
    .eq('owner_id', '38ab48c7-42a8-4299-a2e7-3f7ffa970c3e');
  
  console.log('All tools for user:', tools?.length);
  tools?.forEach((t, i) => {
    const status = t.available ? 'available' : 'not available';
    console.log(`${i+1}. ${t.name} - ${status}`);
  });
  
  const available = tools?.filter(t => t.available).length;
  console.log('\nTotal available:', available);
  
  // Now check what the endpoint would do
  console.log('\nWhat endpoint would do:');
  if (available >= 3) {
    console.log('- >= 3 tools: would upgrade to Standard');
  } else {
    console.log('- < 3 tools: would downgrade to Free');
  }
}

checkTools();
