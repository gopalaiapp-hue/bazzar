-- ============================================
-- COMPLETE SUPABASE SCHEMA FOR SAHKOSH
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- This creates ALL tables, enums, triggers, and RLS policies
-- ============================================

-- ============ ENUMS ============
DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('cash', 'bank', 'upi', 'wallet');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE pocket_type AS ENUM ('cash', 'bank', 'upi', 'salary', 'savings', 'family', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('debit', 'credit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE lena_dena_type AS ENUM ('gave', 'took');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE status AS ENUM ('pending', 'settled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ USERS TABLE ============
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    phone TEXT UNIQUE,
    email TEXT UNIQUE,
    hashed_password TEXT,
    name TEXT,
    language TEXT DEFAULT 'English',
    family_type TEXT,
    income_sources TEXT[] DEFAULT ARRAY[]::text[],
    is_married BOOLEAN DEFAULT false,
    has_parents BOOLEAN DEFAULT false,
    has_side_income BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 0,
    onboarding_complete BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    role TEXT DEFAULT 'admin',
    linked_admin_id TEXT,
    last_active_at TIMESTAMP
);

-- ============ OTP TABLE ============
CREATE TABLE IF NOT EXISTS otps (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ INVITE CODES TABLE ============
CREATE TABLE IF NOT EXISTS invite_codes (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    creator_id TEXT REFERENCES users(id) NOT NULL,
    family_name TEXT,
    auto_accept BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ JOIN REQUESTS TABLE ============
CREATE TABLE IF NOT EXISTS join_requests (
    id SERIAL PRIMARY KEY,
    invite_code TEXT NOT NULL,
    requester_id TEXT REFERENCES users(id) NOT NULL,
    requester_name TEXT NOT NULL,
    requester_phone TEXT,
    requester_email TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',
    hof_id TEXT REFERENCES users(id) NOT NULL,
    action_note TEXT,
    action_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ ACCOUNTS TABLE ============
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id) NOT NULL,
    type account_type NOT NULL,
    name TEXT NOT NULL,
    balance INTEGER DEFAULT 0,
    bank_name TEXT,
    account_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ POCKETS TABLE ============
CREATE TABLE IF NOT EXISTS pockets (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id) NOT NULL,
    type pocket_type NOT NULL,
    name TEXT NOT NULL,
    amount INTEGER DEFAULT 0,
    spent INTEGER DEFAULT 0,
    target_amount INTEGER,
    deadline TIMESTAMP,
    monthly_contribution INTEGER,
    linked_categories TEXT[] DEFAULT ARRAY[]::text[],
    icon TEXT DEFAULT '💰',
    color TEXT DEFAULT 'bg-blue-500',
    is_hidden BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ TRANSACTIONS TABLE ============
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id) NOT NULL,
    account_id INTEGER REFERENCES accounts(id),
    pocket_id INTEGER REFERENCES pockets(id),
    type transaction_type NOT NULL,
    amount INTEGER NOT NULL,
    merchant TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT DEFAULT '💳',
    date TIMESTAMP DEFAULT NOW(),
    description TEXT,
    payment_method TEXT,
    paid_by TEXT,
    is_borrowed BOOLEAN DEFAULT false,
    lender_name TEXT,
    lender_phone TEXT,
    is_shared BOOLEAN DEFAULT false,
    notes TEXT,
    has_split BOOLEAN DEFAULT false,
    split_amount_1 INTEGER,
    split_amount_2 INTEGER,
    split_method_1 TEXT,
    split_method_2 TEXT
);

-- ============ LENA DENA TABLE ============
CREATE TABLE IF NOT EXISTS lena_dena (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id) NOT NULL,
    type lena_dena_type NOT NULL,
    name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    date TIMESTAMP DEFAULT NOW(),
    due_date TIMESTAMP NOT NULL,
    status status DEFAULT 'pending',
    notes TEXT
);

-- ============ BUDGETS TABLE ============
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id) NOT NULL,
    category TEXT NOT NULL,
    "limit" INTEGER NOT NULL,
    spent INTEGER DEFAULT 0,
    month TEXT NOT NULL,
    icon TEXT,
    color TEXT
);

-- ============ FAMILY MEMBERS TABLE ============
CREATE TABLE IF NOT EXISTS family_members (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id) NOT NULL,
    name TEXT NOT NULL,
    relationship TEXT,
    phone TEXT,
    income INTEGER DEFAULT 0,
    is_nominee BOOLEAN DEFAULT false
);

-- ============ GOALS TABLE ============
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id) NOT NULL,
    name TEXT NOT NULL,
    target_amount INTEGER NOT NULL,
    current_amount INTEGER DEFAULT 0,
    deadline TIMESTAMP,
    icon TEXT,
    is_priority BOOLEAN DEFAULT false
);

-- ============ TAX DATA TABLE ============
CREATE TABLE IF NOT EXISTS tax_data (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id) NOT NULL,
    assessment_year TEXT NOT NULL,
    income_salary INTEGER DEFAULT 0,
    income_interest INTEGER DEFAULT 0,
    income_capital_gains INTEGER DEFAULT 0,
    deductions_80c INTEGER DEFAULT 0,
    deductions_80d INTEGER DEFAULT 0,
    hra INTEGER DEFAULT 0,
    regime TEXT DEFAULT 'new',
    tax_payable_old INTEGER DEFAULT 0,
    tax_payable_new INTEGER DEFAULT 0,
    is_filed BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============ POCKET TRANSFERS TABLE ============
CREATE TABLE IF NOT EXISTS pocket_transfers (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id) NOT NULL,
    from_pocket_id INTEGER REFERENCES pockets(id) NOT NULL,
    to_pocket_id INTEGER REFERENCES pockets(id) NOT NULL,
    amount INTEGER NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ SUBSCRIPTIONS TABLE ============
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id) NOT NULL,
    name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    due_date INTEGER,
    category TEXT,
    icon TEXT DEFAULT '📺',
    is_active BOOLEAN DEFAULT true,
    reminder_days INTEGER DEFAULT 3,
    notify_on_renewal BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ AUTO-CREATE USER PROFILE TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, onboarding_step, onboarding_complete, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NULL),
    'admin',
    0,
    false,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ ENABLE RLS ON ALL TABLES ============
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

-- ============ RLS POLICIES ============

-- Users
DROP POLICY IF EXISTS "users_select_own" ON users;
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "users_insert_self" ON users;
CREATE POLICY "users_insert_self" ON users FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Pockets
DROP POLICY IF EXISTS "pockets_all_own" ON pockets;
CREATE POLICY "pockets_all_own" ON pockets FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Transactions
DROP POLICY IF EXISTS "transactions_all_own" ON transactions;
CREATE POLICY "transactions_all_own" ON transactions FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Budgets
DROP POLICY IF EXISTS "budgets_all_own" ON budgets;
CREATE POLICY "budgets_all_own" ON budgets FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Goals
DROP POLICY IF EXISTS "goals_all_own" ON goals;
CREATE POLICY "goals_all_own" ON goals FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Lena Dena
DROP POLICY IF EXISTS "lena_dena_all_own" ON lena_dena;
CREATE POLICY "lena_dena_all_own" ON lena_dena FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Family Members
DROP POLICY IF EXISTS "family_members_all_own" ON family_members;
CREATE POLICY "family_members_all_own" ON family_members FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Subscriptions
DROP POLICY IF EXISTS "subscriptions_all_own" ON subscriptions;
CREATE POLICY "subscriptions_all_own" ON subscriptions FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Tax Data
DROP POLICY IF EXISTS "tax_data_all_own" ON tax_data;
CREATE POLICY "tax_data_all_own" ON tax_data FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Accounts
DROP POLICY IF EXISTS "accounts_all_own" ON accounts;
CREATE POLICY "accounts_all_own" ON accounts FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Pocket Transfers
DROP POLICY IF EXISTS "pocket_transfers_all_own" ON pocket_transfers;
CREATE POLICY "pocket_transfers_all_own" ON pocket_transfers FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Invite Codes
DROP POLICY IF EXISTS "invite_codes_creator" ON invite_codes;
CREATE POLICY "invite_codes_creator" ON invite_codes FOR ALL USING (auth.uid()::text = creator_id) WITH CHECK (auth.uid()::text = creator_id);

DROP POLICY IF EXISTS "invite_codes_validate" ON invite_codes;
CREATE POLICY "invite_codes_validate" ON invite_codes FOR SELECT USING (status = 'active');

-- Join Requests
DROP POLICY IF EXISTS "join_requests_requester" ON join_requests;
CREATE POLICY "join_requests_requester" ON join_requests FOR SELECT USING (auth.uid()::text = requester_id);

DROP POLICY IF EXISTS "join_requests_hof" ON join_requests;
CREATE POLICY "join_requests_hof" ON join_requests FOR SELECT USING (auth.uid()::text = hof_id);

DROP POLICY IF EXISTS "join_requests_hof_update" ON join_requests;
CREATE POLICY "join_requests_hof_update" ON join_requests FOR UPDATE USING (auth.uid()::text = hof_id);

DROP POLICY IF EXISTS "join_requests_insert" ON join_requests;
CREATE POLICY "join_requests_insert" ON join_requests FOR INSERT WITH CHECK (auth.uid()::text = requester_id);

-- ============ GRANT PERMISSIONS ============
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============ SUCCESS MESSAGE ============
SELECT 'SahKosh schema created successfully! All tables, triggers, and RLS policies are now active.' as message;
