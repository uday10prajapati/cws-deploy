-- PROFILES TABLE RLS COMPLETE FIX
-- If you're getting 500 errors on profiles queries, run this:

-- ============================================
-- STEP 1: DISABLE RLS on profiles table
-- ============================================
-- The backend handles authorization via user_id parameter
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Remove all RLS policies from profiles
-- ============================================
DROP POLICY IF EXISTS "Enable read for authenticated users on own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users on own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for anon users during signup" ON public.profiles;
DROP POLICY IF EXISTS "Enable service role to do all operations" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Backend can insert profiles during registration" ON public.profiles;
DROP POLICY IF EXISTS "Backend can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role and anon can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can select all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their address" ON public.profiles;

-- ============================================
-- STEP 3: Verify RLS is disabled
-- ============================================
-- SELECT oid, relname, relrowsecurity FROM pg_class WHERE relname = 'profiles';

-- ============================================
-- STEP 4: Check the schema
-- ============================================
-- Make sure all columns exist:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- ORDER BY ordinal_position;

-- Should include:
-- - id (UUID)
-- - name or full_name (VARCHAR)
-- - email (VARCHAR)
-- - phone (VARCHAR)
-- - role (VARCHAR)
-- - address (TEXT) - for address management
-- - city (VARCHAR)
-- - state (VARCHAR)
-- - postal_code (VARCHAR)
-- - country (VARCHAR)
-- - address_type (VARCHAR)
-- - employee_type (VARCHAR)
-- - approval_status (VARCHAR)
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)

-- ============================================
-- TEST QUERIES
-- ============================================
-- Run these to verify everything works:

-- 1. Test basic profile query
-- SELECT * FROM profiles LIMIT 1;

-- 2. Test address columns
-- SELECT id, address, city, state, postal_code FROM profiles WHERE address IS NOT NULL LIMIT 1;

-- 3. Verify RLS is disabled (should show false)
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';

-- ============================================
-- VERIFICATION
-- ============================================
-- After disabling RLS, these operations should work from the backend:
-- 1. GET /profile/profile/:userId - Get full profile
-- 2. GET /profile/address/:userId - Get address only
-- 3. PUT /profile/address/:userId - Update address
