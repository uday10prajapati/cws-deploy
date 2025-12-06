-- COMPREHENSIVE RLS FIX FOR PROFILES TABLE
-- Run this step-by-step in Supabase SQL Editor

-- ============================================
-- STEP 1: Check current table status
-- ============================================
-- Uncomment to see table info:
-- SELECT * FROM information_schema.tables WHERE table_name = 'profiles';
-- SELECT * FROM information_schema.columns WHERE table_name = 'profiles';

-- ============================================
-- STEP 2: Disable RLS temporarily to test
-- ============================================
-- This will immediately fix the 500 error if RLS is the issue
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Test the query works without RLS
-- ============================================
-- After disabling RLS above, try logging in your app
-- If login works, then RLS policies were the issue
-- If login STILL fails, then it's something else

-- ============================================
-- STEP 4: Once you confirm it works, re-enable RLS with SIMPLE policies
-- ============================================
-- Uncomment the lines below ONLY after confirming login works without RLS

/*
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove ALL old policies
DROP POLICY IF EXISTS "Enable read for authenticated users on own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users on own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for anon users during signup" ON public.profiles;
DROP POLICY IF EXISTS "Enable service role to do all operations" ON public.profiles;

-- Create SIMPLE policies that actually work
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (true);
*/

-- ============================================
-- STEP 5: Verify RLS status
-- ============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- Show all policies on profiles table
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'profiles';
