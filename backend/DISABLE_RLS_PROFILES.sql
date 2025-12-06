-- IMMEDIATE FIX: Disable RLS on profiles table
-- This will fix the 500 error immediately
-- Run this ONCE in Supabase SQL Editor

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- This output should show "rls_enabled = false" for the profiles table
