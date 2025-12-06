-- Fix RLS Policies for Profiles Table
-- Run this in Supabase SQL Editor to enable profile queries from frontend

-- First, ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- DROP existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role and anon can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can select all" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon to read" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated to read own" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for signup" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert during signup" ON public.profiles;

-- ✅ POLICY 1: Allow authenticated users to read their OWN profile
CREATE POLICY "Enable read for authenticated users on own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- ✅ POLICY 2: Allow authenticated users to update their OWN profile
CREATE POLICY "Enable update for authenticated users on own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ✅ POLICY 3: Allow anon users to insert (for signup via backend)
CREATE POLICY "Enable insert for anon users during signup"
  ON public.profiles
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- ✅ POLICY 4: Allow service role to do everything (backend operations)
CREATE POLICY "Enable service role to do all operations"
  ON public.profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
