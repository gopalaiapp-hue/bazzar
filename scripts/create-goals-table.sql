-- Goals Table Migration for Supabase
-- Run this in Supabase SQL Editor to create the goals table

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    target_amount INTEGER NOT NULL,
    current_amount INTEGER DEFAULT 0,
    deadline TIMESTAMP WITH TIME ZONE,
    icon TEXT DEFAULT '🎯',
    is_priority BOOLEAN DEFAULT false
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own goals
CREATE POLICY "Users can view their own goals" 
    ON goals FOR SELECT 
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own goals" 
    ON goals FOR INSERT 
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own goals" 
    ON goals FOR UPDATE 
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own goals" 
    ON goals FOR DELETE 
    USING (user_id = auth.uid()::text);

-- Grant permissions
GRANT ALL ON goals TO authenticated;
GRANT ALL ON goals TO service_role;
GRANT USAGE, SELECT ON SEQUENCE goals_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE goals_id_seq TO service_role;
