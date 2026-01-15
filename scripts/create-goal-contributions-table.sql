-- Goal Contributions Table Migration for Supabase
-- Run this in Supabase SQL Editor to create the goal_contributions table
-- This table tracks every contribution/deposit made towards a goal

-- Create goal_contributions table
CREATE TABLE IF NOT EXISTS goal_contributions (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    amount INTEGER NOT NULL,
    source TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal_id ON goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_user_id ON goal_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_created_at ON goal_contributions(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own goal contributions
CREATE POLICY "Users can view their own goal contributions" 
    ON goal_contributions FOR SELECT 
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own goal contributions" 
    ON goal_contributions FOR INSERT 
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own goal contributions" 
    ON goal_contributions FOR UPDATE 
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own goal contributions" 
    ON goal_contributions FOR DELETE 
    USING (user_id = auth.uid()::text);

-- Add reminder and tracking columns to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS reminder_frequency TEXT DEFAULT 'monthly';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS last_contribution_date TIMESTAMP WITH TIME ZONE;

-- Grant permissions
GRANT ALL ON goal_contributions TO authenticated;
GRANT ALL ON goal_contributions TO service_role;
GRANT USAGE, SELECT ON SEQUENCE goal_contributions_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE goal_contributions_id_seq TO service_role;

-- Success message
SELECT 'Goal contributions table created successfully! ✅' as message;
