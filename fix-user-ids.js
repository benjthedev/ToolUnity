/**
 * Migration script to fix mismatched user IDs between Supabase Auth and users_ext table
 * 
 * This script:
 * 1. Gets all users from Supabase Auth
 * 2. Finds their matching rows in users_ext by email
 * 3. Updates the user_id to match the Auth UUID
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://bnmfkkynoaqqlfcpluav.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubWZra3lua2hvYXFxbGZjcGx1YXYiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzY3MDM0NjY4LCJleHAiOjIwODI2MTA2Njh9.uH1fOEjBv7fdvN1NcVWXy9t4d-22e2g0ULkjrharAHo';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing environment variables: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixUserIds() {
  try {
    console.log('🔄 Starting user ID migration...\n');

    // Get all auth users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Failed to fetch auth users:', authError);
      process.exit(1);
    }

    console.log(`✅ Found ${users.length} auth users\n`);

    let fixed = 0;
    let failed = 0;

    // For each auth user, find and update their users_ext row
    for (const authUser of users) {
      const email = authUser.email;
      const authId = authUser.id;

      try {
        // Find user in users_ext by email
        const { data: userExtRow, error: findError } = await supabase
          .from('users_ext')
          .select('id, user_id')
          .eq('email', email)
          .single();

        if (findError || !userExtRow) {
          console.log(`⚠️  No users_ext row found for ${email}`);
          continue;
        }

        // Check if user_id already matches
        if (userExtRow.user_id === authId) {
          console.log(`✓ ${email} - already correct`);
          continue;
        }

        // Update user_id to match auth UUID
        const { error: updateError } = await supabase
          .from('users_ext')
          .update({ user_id: authId })
          .eq('id', userExtRow.id);

        if (updateError) {
          console.log(`✗ ${email} - UPDATE FAILED: ${updateError.message}`);
          failed++;
        } else {
          console.log(`✓ ${email} - FIXED (${userExtRow.user_id.substring(0, 8)}... → ${authId.substring(0, 8)}...)`);
          fixed++;
        }
      } catch (err) {
        console.log(`✗ ${email} - ERROR: ${err.message}`);
        failed++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total: ${users.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

fixUserIds();
