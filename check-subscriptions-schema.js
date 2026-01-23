const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key.trim()) env[key.trim()] = valueParts.join('=').trim();
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function checkSchema() {
  try {
    // First try to get info about the table
    const { data: tableInfo } = await supabase
      .rpc('get_subscriptions_info');
    
    if (tableInfo) {
      console.log('Table Info:', tableInfo);
      return;
    }
  } catch (e) {
    console.log('RPC attempt failed');
  }

  try {
    // Try to query the table and see what columns are available
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(0);
    
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Query successful, checking structure...');
    }
  } catch (e) {
    console.log('Error:', e.message);
  }

  // Try a simple insert to understand the schema
  try {
    console.log('\nTrying to insert test record to understand schema...');
    const testId = '38ab48c7-42a8-4299-a2e7-3f7ffa970c3e'; // Real user ID
    
    // Try with tier column
    const { error } = await supabase
      .from('subscriptions')
      .insert([
        {
          user_id: testId,
          tier: 'free'
        }
      ]);
    
    if (error) {
      console.log('Insert error:', error.message);
    } else {
      console.log('✓ Successfully inserted with tier!');
      // If it works, try to read it back
      const { data } = await supabase.from('subscriptions').select('*').eq('user_id', testId).limit(1);
      if (data && data.length > 0) {
        console.log('Available columns:', Object.keys(data[0]));
        console.log('Record:', JSON.stringify(data[0], null, 2));
      }
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

checkSchema();
