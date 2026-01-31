# Fix Account Type Save - Quick Guide

## Issue
Account Type selection is not saving due to Supabase RLS (Row Level Security) policy blocking updates.

## Solution
Apply the SQL script to add proper RLS policies.

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/mtdngnyatbiipyumqmdd
2. Click "SQL Editor" in the left sidebar

### Step 2: Run the SQL Script
1. Click "New Query"
2. Copy the contents of `scripts/fix-account-type-rls.sql`
3. Paste into the SQL editor
4. Click "Run" button

### Step 3: Verify
The query should return a table showing the 3 new policies:
- `Users can read own record`
- `Users can update own record`
- `Users can insert own record`

### Step 4: Test
1. Go to http://localhost:5001
2. Sign in with your account
3. Go to Profile → Account Type
4. Click ℹ️ on "Couple" to see details
5. Click "Select Couple"
6. Click "Save"
7. ✅ Should now save successfully!

## SQL Script Location
`e:\bazzar\BazaarBudget\BazaarBudget\scripts\fix-account-type-rls.sql`
