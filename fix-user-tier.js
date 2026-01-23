const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = {};
fs.readFileSync('.env.local', 'utf-8').split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key.trim()) env[key.trim()] = valueParts.join('=').trim();
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function fixUserTier() {
  console.log('Updating users_ext subscription_tier to free...');
  
  const { error } = await supabase
    .from('users_ext')
    .update({ 
      subscription_tier: 'free',
      borrow_limit: 1
    })
    .eq('user_id', '38ab48c7-42a8-4299-a2e7-3f7ffa970c3e');
  
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('✓ Updated successfully!');
    
    // Verify
    const { data: users } = await supabase
      .from('users_ext')
      .select('subscription_tier, borrow_limit')
      .eq('user_id', '38ab48c7-42a8-4299-a2e7-3f7ffa970c3e');
    
    console.log('Verified:', JSON.stringify(users, null, 2));
  }
}

fixUserTier();
