const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local and parse it
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

console.log('Supabase URL:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Starting migration...');
    console.log('\nNote: You need to manually run these SQL queries in Supabase SQL Editor:');
    console.log(`
-- Add condition_photos column to tools
ALTER TABLE tools ADD COLUMN IF NOT EXISTS condition_photos TEXT[] DEFAULT '{}';

-- Add status column to tools  
ALTER TABLE tools ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';

-- Add status column to borrow_requests
ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'requested';

-- Add returned_at column to borrow_requests
ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS returned_at TIMESTAMP;

-- Add borrowed_at column to borrow_requests if not exists
ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS borrowed_at TIMESTAMP;

-- Add expected_return column to borrow_requests if not exists  
ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS expected_return TIMESTAMP;
    `);

    console.log('\n✓ Copy the SQL above and paste it into your Supabase SQL Editor');
    console.log('  Then run all queries to add the required columns.');

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigration();
