const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n').filter(line => line.trim());
const env = {};

envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  env[key.trim()] = valueParts.join('=').trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSubscription() {
  try {
    // Get the user with most tools
    const { data: users, error: usersError } = await supabase
      .from('users_ext')
      .select('user_id, subscription_tier, tools_count')
      .order('tools_count', { ascending: false })
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.error('Error fetching user:', usersError);
      return;
    }

    const userId = users[0].user_id;
    console.log('User ID:', userId);
    console.log('Tools count:', users[0].tools_count);
    console.log('Current subscription_tier:', users[0].subscription_tier);

    // Update subscription tier to standard
    const { data: updated, error: updateError } = await supabase
      .from('users_ext')
      .update({ subscription_tier: 'standard' })
      .eq('user_id', userId)
      .select();

    if (updateError) {
      console.error('Error updating subscription:', updateError);
    } else {
      console.log('Updated successfully:', updated);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

updateSubscription();
