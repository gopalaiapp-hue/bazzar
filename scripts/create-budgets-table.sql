-- Budgets Table Migration for Supabase
-- Run this in Supabase SQL Editor to create the budgets table

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    category TEXT NOT NULL,
    "limit" INTEGER NOT NULL,  -- Quoted because limit is a reserved word
    spent INTEGER DEFAULT 0,
    month TEXT NOT NULL,       -- Format: YYYY-MM (e.g., "2025-12")
    icon TEXT,
    color TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);

-- Enable Row Level Security (RLS)
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own budgets
CREATE POLICY "Users can view their own budgets" 
    ON budgets FOR SELECT 
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own budgets" 
    ON budgets FOR INSERT 
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own budgets" 
    ON budgets FOR UPDATE 
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own budgets" 
    ON budgets FOR DELETE 
    USING (user_id = auth.uid()::text);

-- Grant permissions
GRANT ALL ON budgets TO authenticated;
GRANT ALL ON budgets TO service_role;
GRANT USAGE, SELECT ON SEQUENCE budgets_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE budgets_id_seq TO service_role;
