// Create tool_requests tables using Supabase SQL API
const fs = require('fs');
const path = require('path');

// Load .env.local
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
envFile.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  const sql = `
    CREATE TABLE IF NOT EXISTS tool_requests (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      tool_name TEXT NOT NULL,
      category TEXT NOT NULL,
      postcode TEXT NOT NULL,
      description TEXT,
      upvote_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'open',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tool_request_upvotes (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      request_id UUID NOT NULL REFERENCES tool_requests(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(request_id, user_id)
    );

    ALTER TABLE tool_requests ENABLE ROW LEVEL SECURITY;
    ALTER TABLE tool_request_upvotes ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Anyone can view tool requests" ON tool_requests;
    DROP POLICY IF EXISTS "Service role full access to tool_requests" ON tool_requests;
    DROP POLICY IF EXISTS "Anyone can view upvotes" ON tool_request_upvotes;
    DROP POLICY IF EXISTS "Service role full access to upvotes" ON tool_request_upvotes;

    CREATE POLICY "Anyone can view tool requests" ON tool_requests FOR SELECT USING (true);
    CREATE POLICY "Service role full access to tool_requests" ON tool_requests FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Anyone can view upvotes" ON tool_request_upvotes FOR SELECT USING (true);
    CREATE POLICY "Service role full access to upvotes" ON tool_request_upvotes FOR ALL USING (true) WITH CHECK (true);

    CREATE INDEX IF NOT EXISTS idx_tool_requests_status ON tool_requests(status);
    CREATE INDEX IF NOT EXISTS idx_tool_requests_postcode ON tool_requests(postcode);
    CREATE INDEX IF NOT EXISTS idx_tool_requests_created_at ON tool_requests(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_tool_request_upvotes_request_id ON tool_request_upvotes(request_id);
    CREATE INDEX IF NOT EXISTS idx_tool_request_upvotes_user_id ON tool_request_upvotes(user_id);
  `;

  // Try the pg-meta SQL execution endpoint
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  
  const response = await fetch(`${supabaseUrl}/pg/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ query: sql })
  });

  if (response.ok) {
    console.log('✅ Tables created successfully!');
    return;
  }

  console.log(`pg/sql endpoint status: ${response.status}`);
  const text = await response.text();
  console.log('Response:', text.slice(0, 200));

  // Try alternative endpoint
  const response2 = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'GET',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    }
  });

  if (response2.ok) {
    const tables = await response2.json();
    console.log('\nExisting API tables:', Object.keys(tables).slice(0, 20));
  }
  
  console.log('\n⚠️  Please create tables manually at:');
  console.log(`https://supabase.com/dashboard/project/${projectRef}/sql/new`);
  console.log('\nPaste the contents of create-tool-requests-table.sql');
}

run().catch(console.error);
