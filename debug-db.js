const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const { createClient } = require('@supabase/supabase-js');
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

(async () => {
  const benUID = '38ab48c7-42a8-4299-a2e7-3f7ffa970c3e';
  
  // Update password to the correct one
  const { error: updateError } = await supabase.auth.admin.updateUserById(benUID, {
    password: 'password123!'
  });
  
  if (updateError) {
    console.log('Error updating password:', updateError.message);
  } else {
    console.log('✓ Updated password to password123!');
  }
  
  console.log('\nLogin credentials for benclarknfk@gmail.com:');
  console.log('Email: benclarknfk@gmail.com');
  console.log('Password: password123!');
})();
