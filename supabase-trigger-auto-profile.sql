-- ============================================
-- SUPABASE TRIGGER: Auto-create users_ext profile
-- ============================================
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- This trigger automatically creates a users_ext row whenever
-- a new user is created in auth.users, preventing orphaned accounts.

-- Step 1: Create the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_ext (
    user_id,
    email,
    username,
    phone_number,
    subscription_tier,
    email_verified,
    tools_count,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(SPLIT_PART(NEW.email, '@', 1), 'user'),
    NULL,
    'free',
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
    0,
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;  -- Skip if profile already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- DONE! New auth users will now automatically
-- get a profile in users_ext.
-- ============================================
