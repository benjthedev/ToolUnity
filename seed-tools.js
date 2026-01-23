const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Helper to generate UUIDs
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key length:', supabaseKey ? supabaseKey.length : 0);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleTools = [
  {
    name: 'Power Drill - DeWalt 20V',
    description: 'DeWalt 20V cordless drill in excellent condition',
    category: 'Power Tools',
    condition: 'excellent',
    owner_id: null,
    postcode: '10001',
    tool_value: 150,
    available: true,
  },
  {
    name: 'Circular Saw - Makita',
    description: 'Makita 7.5" circular saw, great for cutting lumber',
    category: 'Power Tools',
    condition: 'good',
    owner_id: null,
    postcode: '10002',
    tool_value: 200,
    available: true,
  },
  {
    name: 'Complete Hand Tool Set',
    description: 'Comprehensive hand tool set with 50+ pieces',
    category: 'Hand Tools',
    condition: 'excellent',
    owner_id: null,
    postcode: '10001',
    tool_value: 85,
    available: true,
  },
  {
    name: 'Garden Hose - 50ft Retractable',
    description: 'Retractable garden hose, 50 feet, with nozzle',
    category: 'Garden',
    condition: 'good',
    owner_id: null,
    postcode: '10003',
    tool_value: 35,
    available: true,
  },
  {
    name: 'Extension Ladder - 20ft Aluminum',
    description: '20ft aluminum extension ladder, lightweight and durable',
    category: 'Ladders',
    condition: 'excellent',
    owner_id: null,
    postcode: '10002',
    tool_value: 120,
    available: true,
  },
  {
    name: 'Pressure Washer - 2500 PSI',
    description: '2500 PSI pressure washer, perfect for cleaning decks and driveways',
    category: 'Cleaning',
    condition: 'excellent',
    owner_id: null,
    postcode: '10001',
    tool_value: 250,
    available: true,
  },
  {
    name: 'Tile Saw - Wet Saw',
    description: 'Professional wet tile saw for precise cutting',
    category: 'Power Tools',
    condition: 'good',
    owner_id: null,
    postcode: '10004',
    tool_value: 300,
    available: true,
  },
  {
    name: 'Impact Driver Set',
    description: 'Impact driver with bit set and carrying case',
    category: 'Power Tools',
    condition: 'excellent',
    owner_id: null,
    postcode: '10003',
    tool_value: 110,
    available: true,
  },
];

async function seedTools() {
  try {
    console.log('Seeding tools...');
    
    // Check if we can read from the table
    const { data: existingTools, error: readError } = await supabase
      .from('tools')
      .select('*');

    if (readError) {
      console.error('Error reading tools table:', readError);
      return;
    }

    console.log('Existing tools count:', existingTools?.length || 0);

    if (existingTools && existingTools.length > 0) {
      console.log('\nExisting tools in database:\n');
      existingTools.forEach((tool) => {
        console.log(`✓ ${tool.name}`);
        console.log(`  Category: ${tool.category}`);
        console.log(`  Value: £${tool.tool_value}`);
        console.log(`  Owner ID: ${tool.owner_id}`);
        console.log(`  Area: ${tool.postcode}\n`);
      });
    } else {
      console.log('No tools found in database.');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

seedTools();
