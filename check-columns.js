const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://hwmpmwfluzbrdjysvczc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bXBtd2ZsdXpicmRqeXN2Y3pjIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk0NjczNDYsImV4cCI6MjAxNTAyNzM0Nn0.wFNF3KfDJVHFNGShjLJyRGNnrT6Nj6ZKJmPeVFVR1s4');

(async () => {
  const { data, error } = await supabase.from('users_ext').select('*').limit(1);
  if (error) {
    console.log('Error:', error);
    process.exit(1);
  }
  if (data && data[0]) {
    const cols = Object.keys(data[0]);
    console.log('Database columns:', cols);
    console.log('Has stripe_subscription_id:', cols.includes('stripe_subscription_id'));
  }
})();
