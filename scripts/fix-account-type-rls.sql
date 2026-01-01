-- Fix Account Type Save Issue
-- This adds RLS policies to allow users to update their own records

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Users can read own record" ON users;

-- Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own record
CREATE POLICY "Users can read own record"
ON users FOR SELECT
USING (auth.uid()::text = id);

-- Policy: Users can update their own record
CREATE POLICY "Users can update own record"
ON users FOR UPDATE
USING (auth.uid()::text = id);

-- Policy: Users can insert their own record (for signup)
CREATE POLICY "Users can insert own record"
ON users FOR INSERT
WITH CHECK (auth.uid()::text = id);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users';
