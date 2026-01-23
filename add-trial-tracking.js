const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addTrialTracking() {
  try {
    console.log('Adding trial_used column to users_ext table...');
    
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE users_ext 
        ADD COLUMN trial_used BOOLEAN DEFAULT false;
      `
    });

    if (error) {
      // If column already exists, that's fine
      if (error.message.includes('already exists')) {
        console.log('Column already exists, skipping...');
      } else {
        console.error('Error adding column:', error);
        process.exit(1);
      }
    } else {
      console.log('✓ Successfully added trial_used column');
    }
    
    console.log('✓ Trial tracking setup complete');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addTrialTracking();
