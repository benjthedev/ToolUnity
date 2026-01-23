const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey ? 'Set' : 'Not set');

  try {
    // Test reading tools
    const { data: tools, error: toolsError } = await supabase
      .from('tools')
      .select('*')
      .limit(5);

    if (toolsError) {
      console.error('Tools fetch error:', toolsError);
    } else {
      console.log('Tools found:', tools?.length || 0);
      if (tools && tools.length > 0) {
        console.log('Sample tool:', tools[0]);
      }
    }

    // Check if any tools exist with available = true
    const { data: availableTools, error: availError } = await supabase
      .from('tools')
      .select('*')
      .eq('available', true)
      .limit(5);

    if (availError) {
      console.error('Available tools fetch error:', availError);
    } else {
      console.log('Available tools found:', availableTools?.length || 0);
    }

    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users_ext')
      .select('*')
      .limit(5);

    if (usersError) {
      console.error('Users fetch error:', usersError);
    } else {
      console.log('Users found:', users?.length || 0);
    }
  } catch (err) {
    console.error('Test error:', err);
  }
}

testConnection();
