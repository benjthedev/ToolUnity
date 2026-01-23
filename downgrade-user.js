const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rqlqxffgvyasznrpmgco.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxbHF4ZmZndnlhc3puUnBtZ2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI0MzI1NzIsImV4cCI6MjA0ODAwODU3Mn0.8M-R7VfbdXvHx-I70UqiU13sN93BJRH4E2N00rFBjwA'
);

(async () => {
  try {
    const userId = '38ab48c7-42a8-4299-a2e7-3f7ffa970c3e';
    
    // Count tools
    const { data: tools, error: toolErr } = await supabase
      .from('tools')
      .select('id')
      .eq('owner_id', userId)
      .eq('available', true);
    
    if (toolErr) throw toolErr;
    console.log('Tool count:', tools?.length || 0);
    
    // Downgrade subscription
    const { data: subUpdated, error: subErr } = await supabase
      .from('subscriptions')
      .update({ plan: 'free' })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (subErr) throw subErr;
    console.log('Subscription updated to:', subUpdated?.plan);
    
    // Downgrade in users_ext
    const { data: userUpdated, error: userErr } = await supabase
      .from('users_ext')
      .update({ subscription_tier: 'free' })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (userErr) throw userErr;
    console.log('User tier updated to:', userUpdated?.subscription_tier);
    
    console.log('✓ Successfully downgraded to Free plan');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
