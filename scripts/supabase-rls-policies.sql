-- ============================================
-- Row Level Security (RLS) Policies for SahKosh
-- Run this script in Supabase SQL Editor
-- ============================================

-- ENABLE RLS ON ALL TABLES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pockets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE lena_dena ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pocket_transfers ENABLE ROW LEVEL SECURITY;

-- ============ USERS TABLE ============
-- Users can read and update their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- Allow insert for new signups (triggered by auth)
CREATE POLICY "users_insert_self" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- ============ POCKETS TABLE ============
CREATE POLICY "pockets_all_own" ON pockets
  FOR ALL USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ============ TRANSACTIONS TABLE ============
CREATE POLICY "transactions_all_own" ON transactions
  FOR ALL USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ============ BUDGETS TABLE ============
CREATE POLICY "budgets_all_own" ON budgets
  FOR ALL USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ============ GOALS TABLE ============
CREATE POLICY "goals_all_own" ON goals
  FOR ALL USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ============ LENA DENA TABLE ============
CREATE POLICY "lena_dena_all_own" ON lena_dena
  FOR ALL USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ============ FAMILY MEMBERS TABLE ============
CREATE POLICY "family_members_all_own" ON family_members
  FOR ALL USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ============ SUBSCRIPTIONS TABLE ============
CREATE POLICY "subscriptions_all_own" ON subscriptions
  FOR ALL USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ============ TAX DATA TABLE ============
CREATE POLICY "tax_data_all_own" ON tax_data
  FOR ALL USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ============ ACCOUNTS TABLE ============
CREATE POLICY "accounts_all_own" ON accounts
  FOR ALL USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ============ POCKET TRANSFERS TABLE ============
CREATE POLICY "pocket_transfers_all_own" ON pocket_transfers
  FOR ALL USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ============ INVITE CODES TABLE ============
-- Creators can manage their own codes
CREATE POLICY "invite_codes_creator" ON invite_codes
  FOR ALL USING (auth.uid()::text = creator_id)
  WITH CHECK (auth.uid()::text = creator_id);

-- Anyone authenticated can read active codes (for validation)
CREATE POLICY "invite_codes_validate" ON invite_codes
  FOR SELECT USING (status = 'active');

-- ============ JOIN REQUESTS TABLE ============
-- Requesters can see their own requests
CREATE POLICY "join_requests_requester" ON join_requests
  FOR SELECT USING (auth.uid()::text = requester_id);

-- HoF can see requests to their family
CREATE POLICY "join_requests_hof" ON join_requests
  FOR SELECT USING (auth.uid()::text = hof_id);

-- HoF can update (approve/reject) requests
CREATE POLICY "join_requests_hof_update" ON join_requests
  FOR UPDATE USING (auth.uid()::text = hof_id);

-- Authenticated users can create join requests
CREATE POLICY "join_requests_insert" ON join_requests
  FOR INSERT WITH CHECK (auth.uid()::text = requester_id);

-- ============================================
-- IMPORTANT: Run this after creating policies
-- ============================================
-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table access
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
