const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key.trim()) env[key.trim()] = valueParts.join('=').trim();
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_ANON_KEY']);

async function exploreSchema() {
  try {
    // Get subscriptions table info with existing records
    console.log('=== SUBSCRIPTIONS TABLE ===');
    const { data: subs, error: subsError } = await supabase
      .from('subscriptions')
      .select('*');
    
    if (subsError) {
      console.log('Error:', subsError.message);
    } else {
      if (subs && subs.length > 0) {
        console.log('Found', subs.length, 'subscriptions');
        console.log('Columns:', Object.keys(subs[0]));
        console.log('First record:', JSON.stringify(subs[0], null, 2));
      } else {
        console.log('No subscriptions found - testing what columns are needed...');
        
        // Try different combinations
        const attempts = [
          { tier: 'free', borrow_limit: 1, user_id: '38ab48c7-42a8-4299-a2e7-3f7ffa970c3e' },
          { tier: 'standard', borrow_limit: 2, user_id: '38ab48c7-42a8-4299-a2e7-3f7ffa970c3e' },
        ];
        
        for (const attempt of attempts) {
          const { error } = await supabase.from('subscriptions').insert([attempt]);
          if (error) {
            console.log('Failed attempt:', attempt, 'Error:', error.message);
          } else {
            console.log('✓ Success with:', Object.keys(attempt));
            const { data: retrieved } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('user_id', attempt.user_id)
              .limit(1);
            if (retrieved && retrieved.length > 0) {
              console.log('Retrieved columns:', Object.keys(retrieved[0]));
              console.log('Record:', JSON.stringify(retrieved[0], null, 2));
            }
            break;
          }
        }
      }
    }

    // Check users_ext too
    console.log('\n=== USERS_EXT TABLE ===');
    const { data: users, error: usersError } = await supabase
      .from('users_ext')
      .select('*')
      .eq('user_id', '38ab48c7-42a8-4299-a2e7-3f7ffa970c3e');
    
    if (usersError) {
      console.log('Error:', usersError.message);
    } else {
      if (users && users.length > 0) {
        console.log('User columns:', Object.keys(users[0]));
        console.log('User record:', JSON.stringify(users[0], null, 2));
      }
    }

  } catch (e) {
    console.log('Error:', e.message);
  }
}

exploreSchema();
