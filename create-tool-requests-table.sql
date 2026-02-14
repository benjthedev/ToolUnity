-- Tool Requests table
-- Allows users to request tools they need, visible publicly to encourage owners to list them
CREATE TABLE IF NOT EXISTS tool_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  category TEXT NOT NULL,
  postcode TEXT NOT NULL,
  description TEXT,
  upvote_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'fulfilled', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upvotes tracking table (one upvote per user per request)
CREATE TABLE IF NOT EXISTS tool_request_upvotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES tool_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE tool_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_request_upvotes ENABLE ROW LEVEL SECURITY;

-- Policies for tool_requests
CREATE POLICY "Anyone can view tool requests" ON tool_requests
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create requests" ON tool_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests" ON tool_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for tool_request_upvotes
CREATE POLICY "Anyone can view upvotes" ON tool_request_upvotes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upvote" ON tool_request_upvotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own upvotes" ON tool_request_upvotes
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_tool_requests_status ON tool_requests(status);
CREATE INDEX idx_tool_requests_postcode ON tool_requests(postcode);
CREATE INDEX idx_tool_requests_created_at ON tool_requests(created_at DESC);
CREATE INDEX idx_tool_request_upvotes_request_id ON tool_request_upvotes(request_id);
CREATE INDEX idx_tool_request_upvotes_user_id ON tool_request_upvotes(user_id);
