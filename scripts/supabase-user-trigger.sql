-- ============================================
-- Supabase User Profile Auto-Creation Trigger
-- Run this FIRST before RLS policies
-- ============================================

-- Create a function to auto-create user profile when auth user is created
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run after auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- If you already have existing auth users without profiles, run:
-- ============================================
-- INSERT INTO public.users (id, email, role, onboarding_step, onboarding_complete, created_at)
-- SELECT id, email, 'admin', 0, false, NOW()
-- FROM auth.users
-- WHERE id NOT IN (SELECT id FROM public.users);
