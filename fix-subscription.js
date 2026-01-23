const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rqlqxffgvyasznrpmgco.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxbHF4ZmZndnlhc3puUnBtZ2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MzI1NzIsImV4cCI6MjA0ODAwODU3Mn0.8M-R7VfbdXvHx-I70UqiU13sN93BJRH4E2N00rFBjwA'
);

(async () => {
  try {
    const userId = '38ab48c7-42a8-4299-a2e7-3f7ffa970c3e';
    
    // Check current state
    console.log('=== CHECKING CURRENT STATE ===');
    const { data: tools } = await supabase.from('tools').select('id, name').eq('owner_id', userId).eq('available', true);
    console.log('Available tools:', tools?.length || 0, tools?.map(t => t.name));
    
    const { data: userExt } = await supabase.from('users_ext').select('subscription_tier').eq('user_id', userId).single();
    console.log('Current subscription_tier:', userExt?.subscription_tier);
    
    // Update to Free
    console.log('\n=== UPDATING TO FREE ===');
    const { data: updated, error } = await supabase
      .from('users_ext')
      .update({ subscription_tier: 'free' })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    console.log('✓ Updated subscription_tier to:', updated?.subscription_tier);
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
