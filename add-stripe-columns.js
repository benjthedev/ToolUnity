const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hwmpmwfluzbrdjysvczc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bXBtd2ZsdXpicmRqeXN2Y3pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5OTQ2NzM0NiwiZXhwIjoyMDE1MDI3MzQ2fQ.uH1fOEjBv7fdvN1NcVWXy9t4d-22e2g0ULkjrharAHo'
);

(async () => {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE users_ext 
    ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
    ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;`
  });

  if (error) {
    console.error('Error adding columns:', error);
  } else {
    console.log('Columns added successfully');
  }
})();
