-- Invite Codes Table Migration for Supabase
-- Run this in Supabase SQL Editor to create the invite_codes table for Family Vault

-- Create invite_codes table
CREATE TABLE IF NOT EXISTS invite_codes (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    creator_id TEXT NOT NULL REFERENCES users(id),
    family_name TEXT,
    auto_accept BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',  -- 'active', 'revoked', 'used'
    used_by TEXT REFERENCES users(id),  -- Track who used the code (for one-time use)
    used_at TIMESTAMP WITH TIME ZONE,    -- When the code was used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create join_requests table for family join approval flow
CREATE TABLE IF NOT EXISTS join_requests (
    id SERIAL PRIMARY KEY,
    invite_code TEXT NOT NULL,
    requester_id TEXT NOT NULL REFERENCES users(id),
    requester_name TEXT NOT NULL,
    requester_phone TEXT,
    requester_email TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
    hof_id TEXT NOT NULL REFERENCES users(id),  -- Head of Family
    action_note TEXT,
    action_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invite_codes_creator_id ON invite_codes(creator_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_status ON invite_codes(status);
CREATE INDEX IF NOT EXISTS idx_join_requests_hof_id ON join_requests(hof_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_requester_id ON join_requests(requester_id);

-- Enable Row Level Security (RLS)
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invite_codes
CREATE POLICY "Users can view their own invite codes" 
    ON invite_codes FOR SELECT 
    USING (creator_id = auth.uid()::text);

CREATE POLICY "Users can create their own invite codes" 
    ON invite_codes FOR INSERT 
    WITH CHECK (creator_id = auth.uid()::text);

CREATE POLICY "Users can update their own invite codes" 
    ON invite_codes FOR UPDATE 
    USING (creator_id = auth.uid()::text);

-- Allow anyone to read invite codes for validation (needed for join flow)
CREATE POLICY "Anyone can validate invite codes" 
    ON invite_codes FOR SELECT 
    USING (status = 'active');

-- RLS Policies for join_requests
CREATE POLICY "HoF can view requests to their family" 
    ON join_requests FOR SELECT 
    USING (hof_id = auth.uid()::text);

CREATE POLICY "Users can view their own requests" 
    ON join_requests FOR SELECT 
    USING (requester_id = auth.uid()::text);

CREATE POLICY "Users can create join requests" 
    ON join_requests FOR INSERT 
    WITH CHECK (requester_id = auth.uid()::text);

CREATE POLICY "HoF can update requests to their family" 
    ON join_requests FOR UPDATE 
    USING (hof_id = auth.uid()::text);

-- Grant permissions
GRANT ALL ON invite_codes TO authenticated;
GRANT ALL ON invite_codes TO service_role;
GRANT USAGE, SELECT ON SEQUENCE invite_codes_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE invite_codes_id_seq TO service_role;

GRANT ALL ON join_requests TO authenticated;
GRANT ALL ON join_requests TO service_role;
GRANT USAGE, SELECT ON SEQUENCE join_requests_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE join_requests_id_seq TO service_role;
