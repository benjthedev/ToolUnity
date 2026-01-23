const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Helper to generate UUIDs
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Read .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const envLines = envContent.split('\n').filter(line => line.trim());
const env = {};

envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  env[key.trim()] = valueParts.join('=').trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// Use service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get user count to generate email
const userId = generateUUID();
const userEmail = `testuser${Date.now()}@example.com`;
const userPassword = 'TestPassword123!';

async function createUser() {
  try {
    console.log('Creating new test user...\n');

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    const authUserId = authData.user.id;
    console.log(`✓ Auth user created with ID: ${authUserId}`);

    // Create users_ext entry
    const { data: userData, error: userError } = await supabase
      .from('users_ext')
      .insert([{ 
        user_id: authUserId, 
        email: userEmail,
        username: userEmail.split('@')[0],
        subscription_tier: 'free',
        tools_count: 0,
        email_verified: true
      }])
      .select();

    if (userError) {
      console.error('Error creating users_ext entry:', userError);
      return;
    }

    console.log(`✓ User entry created in database`);
    console.log('\n📋 Account Details:');
    console.log(`   Email: ${userEmail}`);
    console.log(`   Password: ${userPassword}`);
    console.log(`   User ID: ${authUserId}`);
    console.log('\n✓ You can now sign in with these credentials!');
  } catch (err) {
    console.error('Error:', err);
  }
}

createUser();
