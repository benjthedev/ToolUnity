#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function deleteAccount(email) {
  try {
    console.log(`Deleting account for: ${email}`);

    // Find the user by email
    const { data: users, error: findError } = await supabase.auth.admin.listUsers();
    
    if (findError) {
      console.error('Error listing users:', findError);
      process.exit(1);
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`User not found: ${email}`);
      process.exit(1);
    }

    const userId = user.id;
    console.log(`Found user: ${userId}`);

    // Delete from users_ext
    const { error: deleteProfileError } = await supabase
      .from('users_ext')
      .delete()
      .eq('user_id', userId);

    if (deleteProfileError) {
      console.error('Error deleting profile:', deleteProfileError);
    } else {
      console.log('✓ Deleted from users_ext');
    }

    // Delete from auth.users
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      process.exit(1);
    } else {
      console.log('✓ Deleted from auth.users');
    }

    console.log(`\n✅ Account deleted successfully: ${email}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: node delete-account.js <email>');
  process.exit(1);
}

deleteAccount(email);
