const { createClient } = require('@supabase/supabase-js');

// Use the service role key to bypass RLS
const supabase = createClient(
  'https://hwmpmwfluzbrdjysvczc.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bXBtd2ZsdXpicmRqeXN2Y3pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5OTQ2NzM0NiwiZXhwIjoyMDE1MDI3MzQ2fQ.uH1fOEjBv7fdvN1NcVWXy9t4d-22e2g0ULkjrharAHo'
);

(async () => {
  // Find and update the user with email benclarknfk@gmail.com
  const { data, error } = await supabase
    .from('users_ext')
    .update({ subscription_tier: 'none', stripe_subscription_id: null })
    .eq('email', 'benclarknfk@gmail.com')
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Updated user:', JSON.stringify(data, null, 2));
  }
})();
