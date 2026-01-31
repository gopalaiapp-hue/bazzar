-- Fix Account Type Save - Add WITH CHECK to UPDATE policy
-- The UPDATE policy needs both USING and WITH CHECK clauses

-- Drop and recreate the UPDATE policy with WITH CHECK
DROP POLICY IF EXISTS "Users can update own record" ON users;

CREATE POLICY "Users can update own record"
ON users FOR UPDATE
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- Verify the policy
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users' AND policyname = 'Users can update own record';
