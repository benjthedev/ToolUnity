const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local and parse it
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const envLines = envContent.split('\n').filter(line => line.trim());
const env = {};

envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  env[key.trim()] = valueParts.join('=').trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

console.log('Supabase URL:', supabaseUrl);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addDailyRateColumn() {
  try {
    console.log('Adding daily_rate column to tools table...');
    
    // Use RPC to execute SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add daily_rate column if it doesn't exist
        ALTER TABLE tools 
        ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10, 2) DEFAULT 3.00;
      `
    }).then(() => ({ data: null, error: null })).catch(err => ({ data: null, error: err }));

    if (error) {
      console.log('Note: If you see a "function exec_sql does not exist" error, run this SQL directly in Supabase SQL Editor:');
      console.log(`
-- Add daily_rate column to tools if it doesn't exist
ALTER TABLE tools 
ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10, 2) DEFAULT 3.00;

-- Update existing tools that don't have daily_rate set
UPDATE tools 
SET daily_rate = CASE 
  WHEN tool_value IS NOT NULL AND tool_value > 0 THEN ROUND((tool_value::DECIMAL / 30), 2)
  ELSE 3.00
END
WHERE daily_rate IS NULL OR daily_rate = 0;
      `);
      console.log('\nError details:', error.message);
    } else {
      console.log('✓ daily_rate column added successfully');
    }

    // Get all tools and their current values
    console.log('\nFetching tools to update daily_rate...');
    const { data: tools, error: toolsError } = await supabase
      .from('tools')
      .select('id, tool_value, daily_rate')
      .is('daily_rate', null)
      .limit(100);

    if (toolsError) {
      console.log('Error fetching tools:', toolsError);
      return;
    }

    console.log(`Found ${tools?.length || 0} tools with NULL daily_rate`);

    if (tools && tools.length > 0) {
      console.log('\nTo update daily_rate for all tools, run this SQL in Supabase SQL Editor:');
      console.log(`
-- Update tools with NULL daily_rate
UPDATE tools 
SET daily_rate = CASE 
  WHEN tool_value IS NOT NULL AND tool_value > 0 THEN ROUND((tool_value::DECIMAL / 30)::NUMERIC, 2)
  ELSE 3.00
END
WHERE daily_rate IS NULL OR daily_rate = 0;

-- Verify the update
SELECT id, name, tool_value, daily_rate FROM tools LIMIT 10;
      `);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

addDailyRateColumn();
