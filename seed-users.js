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
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate test owner IDs
const testOwner1 = generateUUID();
const testOwner2 = generateUUID();
const testOwner3 = generateUUID();
const testOwner4 = generateUUID();

const testUsers = [
  { id: testOwner1, email: 'owner1@example.com' },
  { id: testOwner2, email: 'owner2@example.com' },
  { id: testOwner3, email: 'owner3@example.com' },
  { id: testOwner4, email: 'owner4@example.com' },
];

async function seedUsers() {
  try {
    console.log('Creating test users...\n');
    
    // Check if users_ext table exists and try to insert
    const { data: insertedUsers, error: insertError } = await supabase
      .from('users_ext')
      .insert(testUsers)
      .select();

    if (insertError) {
      console.error('Error creating users:', insertError);
    } else {
      console.log('Successfully created', insertedUsers?.length || 0, 'users:\n');
      insertedUsers?.forEach((user) => {
        console.log(`✓ ${user.email} (ID: ${user.id})`);
      });
      
      // Save IDs to file for reference
      fs.writeFileSync('test-user-ids.txt', `testOwner1=${testOwner1}\ntestOwner2=${testOwner2}\ntestOwner3=${testOwner3}\ntestOwner4=${testOwner4}`);
      console.log('\n✓ User IDs saved to test-user-ids.txt');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

seedUsers();
