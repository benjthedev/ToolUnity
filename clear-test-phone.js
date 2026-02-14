const { createClient } = require('@supabase/supabase-js');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('Clearing test phone number for richardstrike...\n');
  
  const { data, error } = await sb
    .from('users_ext')
    .update({ phone_number: null })
    .eq('email', 'richardstrike@hotmail.co.uk')
    .select('email, phone_number');
  
  if (error) {
    console.error('❌ Error clearing phone:', error);
  } else {
    console.log('✅ Cleared test phone number:', data);
  }
})();
