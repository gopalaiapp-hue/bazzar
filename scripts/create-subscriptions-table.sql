-- Subscriptions Table Migration for Supabase
-- Run this in Supabase SQL Editor to create the subscriptions table

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    due_date INTEGER, -- Day of month (1-31)
    category TEXT,
    icon TEXT DEFAULT '📺',
    is_active BOOLEAN DEFAULT true,
    reminder_days INTEGER DEFAULT 3,
    notify_on_renewal BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own subscriptions
CREATE POLICY "Users can view their own subscriptions" 
    ON subscriptions FOR SELECT 
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own subscriptions" 
    ON subscriptions FOR INSERT 
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own subscriptions" 
    ON subscriptions FOR UPDATE 
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own subscriptions" 
    ON subscriptions FOR DELETE 
    USING (user_id = auth.uid()::text);

-- Grant permissions
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON subscriptions TO service_role;
GRANT USAGE, SELECT ON SEQUENCE subscriptions_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE subscriptions_id_seq TO service_role;
