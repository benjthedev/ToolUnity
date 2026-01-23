const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = {};
fs.readFileSync('.env.local', 'utf-8').split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key.trim()) env[key.trim()] = valueParts.join('=').trim();
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function fixTier() {
  const userId = '38ab48c7-42a8-4299-a2e7-3f7ffa970c3e';
  
  console.log('Updating subscription_tier from "free" to "basic" for user with 2 tools...');
  
  const { data, error } = await supabase
    .from('users_ext')
    .update({ subscription_tier: 'basic' })
    .eq('user_id', userId)
    .select();
  
  if (error) {
    console.error('Error updating tier:', error);
  } else {
    console.log('✓ Tier updated successfully');
    console.log('New record:', JSON.stringify(data[0], null, 2));
  }
}

fixTier();
