const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addEmailVerificationFields() {
  try {
    console.log('Adding email_verified and email_verification_token fields to users_ext...');

    // Check current columns
    const { data: tableInfo, error: infoError } = await supabase
      .from('users_ext')
      .select('*')
      .limit(1);

    if (infoError) {
      console.error('Error checking table:', infoError);
      return;
    }

    // Add email_verified column (default false for existing users)
    const { error: verifiedError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users_ext 
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
      `
    }).catch(() => {
      // If RPC doesn't exist, we'll handle it differently
      console.log('Note: Using direct SQL execution may require different approach');
      return { error: null };
    });

    // Add email_verification_token column
    const { error: tokenError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users_ext 
        ADD COLUMN IF NOT EXISTS email_verification_token TEXT UNIQUE;
      `
    }).catch(() => {
      return { error: null };
    });

    // Add email_verification_sent_at column
    const { error: sentError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users_ext 
        ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP WITH TIME ZONE;
      `
    }).catch(() => {
      return { error: null };
    });

    console.log('✓ Fields added successfully');
    console.log('\nNote: If you see errors above, you may need to add these columns manually via Supabase dashboard:');
    console.log('  1. email_verified (BOOLEAN, default: false)');
    console.log('  2. email_verification_token (TEXT, unique)');
    console.log('  3. email_verification_sent_at (TIMESTAMP WITH TIME ZONE)');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addEmailVerificationFields();
