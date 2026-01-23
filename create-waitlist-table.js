const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createWaitlistTable() {
  try {
    console.log('Creating waitlist table...');
    
    // Note: You'll need to run this SQL directly in Supabase SQL Editor
    // since the SDK doesn't support direct CREATE TABLE commands
    
    const sql = `
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  postcode TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  notified BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_waitlist_postcode ON waitlist(postcode);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_notified ON waitlist(notified);
    `;

    console.log('\n⚠️  Please run this SQL in the Supabase SQL Editor:\n');
    console.log(sql);
    
    console.log('\nOr manually create the table with these steps:');
    console.log('1. Go to https://app.supabase.com/');
    console.log('2. Select your project');
    console.log('3. Click "SQL Editor"');
    console.log('4. Click "New query"');
    console.log('5. Paste the SQL above');
    console.log('6. Click "Run"');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createWaitlistTable();
