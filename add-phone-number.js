const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addPhoneNumberColumn() {
  try {
    console.log('Adding phone_number column to users_ext table...');
    
    // Supabase doesn't support direct SQL execution via SDK, so we need to use the table schema update
    // For now, we'll document this and let the user run it manually in Supabase dashboard
    
    console.log('\n⚠️  To add the phone_number column, please run this SQL in the Supabase SQL Editor:\n');
    console.log(`
ALTER TABLE users_ext
ADD COLUMN phone_number TEXT;

-- Optional: Add a unique index if you want phone numbers to be unique
CREATE INDEX idx_users_ext_phone_number ON users_ext(phone_number);
    `);
    
    console.log('\nOr use the Supabase dashboard:');
    console.log('1. Go to SQL Editor');
    console.log('2. Create a new query');
    console.log('3. Paste the SQL above');
    console.log('4. Run the query');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addPhoneNumberColumn();
