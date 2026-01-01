-- Lena Dena Table Migration for Supabase
-- Run this in Supabase SQL Editor to create the lena_dena table

-- Create lena_dena_type enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lena_dena_type') THEN
        CREATE TYPE lena_dena_type AS ENUM ('gave', 'took');
    END IF;
END$$;

-- Create status enum if not exists  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status') THEN
        CREATE TYPE status AS ENUM ('pending', 'settled');
    END IF;
END$$;

-- Create lena_dena table
CREATE TABLE IF NOT EXISTS lena_dena (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    type lena_dena_type NOT NULL,  -- 'gave' or 'took'
    name TEXT NOT NULL,             -- Person's name
    amount INTEGER NOT NULL,        -- Amount in rupees
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status status DEFAULT 'pending',
    notes TEXT
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_lena_dena_user_id ON lena_dena(user_id);
CREATE INDEX IF NOT EXISTS idx_lena_dena_status ON lena_dena(status);
CREATE INDEX IF NOT EXISTS idx_lena_dena_due_date ON lena_dena(due_date);

-- Enable Row Level Security (RLS)
ALTER TABLE lena_dena ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own entries
CREATE POLICY "Users can view their own lena-dena" 
    ON lena_dena FOR SELECT 
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own lena-dena" 
    ON lena_dena FOR INSERT 
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own lena-dena" 
    ON lena_dena FOR UPDATE 
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own lena-dena" 
    ON lena_dena FOR DELETE 
    USING (user_id = auth.uid()::text);

-- Grant permissions
GRANT ALL ON lena_dena TO authenticated;
GRANT ALL ON lena_dena TO service_role;
GRANT USAGE, SELECT ON SEQUENCE lena_dena_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE lena_dena_id_seq TO service_role;
