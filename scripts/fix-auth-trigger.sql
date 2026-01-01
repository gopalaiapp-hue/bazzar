-- ============================================
-- FIX: Auth User Profile Auto-Creation Trigger
-- Run this in Supabase SQL Editor to ensure
-- user profiles are created when auth.users signup
-- ============================================

-- Step 1: Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Create or replace the function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users with ON CONFLICT to handle duplicates gracefully
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    role, 
    onboarding_step, 
    onboarding_complete, 
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NULL),
    'admin',
    0,
    false,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name);
    
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the auth signup
  RAISE WARNING 'handle_new_user trigger error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Sync any existing auth users without profiles
INSERT INTO public.users (id, email, role, onboarding_step, onboarding_complete, created_at)
SELECT 
  au.id, 
  au.email, 
  'admin', 
  0, 
  false, 
  NOW()
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users WHERE id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

-- Step 5: Verify
SELECT 
  'Auth users: ' || (SELECT COUNT(*) FROM auth.users)::text || 
  ', Profile users: ' || (SELECT COUNT(*) FROM public.users)::text AS status;

-- ============================================
-- IMPORTANT: Check Supabase Email Settings
-- ============================================
-- Go to: Dashboard -> Authentication -> Providers -> Email
-- 
-- Option 1: DISABLE email confirmation (easier for dev)
--   - Set "Confirm email" to OFF
--   - New users can sign in immediately
--
-- Option 2: Keep email confirmation ON (production)
--   - Users must verify email before signin
--   - Make sure emails are being sent
--
-- Check: Dashboard -> Authentication -> Users
--   - See "Last Sign In" and "Email Confirmed" columns
-- ============================================
