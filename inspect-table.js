// Inspect the actual users_ext table structure
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
envFile.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function inspectTable() {
  const supabase = createClient(supabaseUrl, serviceKey);

  console.log('\n📊 Inspecting users_ext table structure...\n');

  // Get a sample row with ALL columns
  const { data: sampleRow, error } = await supabase
    .from('users_ext')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log('Sample row (all columns):');
  console.log('═'.repeat(100));
  
  const columns = Object.keys(sampleRow).sort();
  columns.forEach(col => {
    console.log(`  ${col}: ${JSON.stringify(sampleRow[col])}`);
  });

  console.log('\n✅ Total columns:', columns.length);
  console.log('\nColumn list:');
  console.log(columns.join(', '));
}

inspectTable().catch(console.error);
