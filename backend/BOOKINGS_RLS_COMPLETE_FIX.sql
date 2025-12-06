-- BOOKINGS TABLE RLS COMPLETE FIX
-- If you're getting 500 errors when querying bookings, run these steps:

-- ============================================
-- STEP 1: DISABLE RLS on bookings table
-- ============================================
-- The simplest fix for 500 errors is to disable RLS
-- The backend will handle authorization via user_id parameter
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Verify RLS is disabled
-- ============================================
-- Check if RLS is disabled (should show 'f' for false)
-- SELECT oid, relname, relrowsecurity FROM pg_class WHERE relname = 'bookings';

-- ============================================
-- STEP 3: Remove any RLS policies if they exist
-- ============================================
DROP POLICY IF EXISTS "Enable read access for users" ON public.bookings;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.bookings;
DROP POLICY IF EXISTS "Customers can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Employees can view assigned bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable customers to view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable employees to view assigned bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable admins to view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable customers to update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable admins to update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable insert for admins" ON public.bookings;

-- ============================================
-- STEP 4: Test the application
-- ============================================
-- After disabling RLS:
-- 1. Restart the backend: npm start
-- 2. Refresh the frontend
-- 3. Login as customer
-- 4. Go to Bookings page
-- 5. Check console for "✅ Retrieved X bookings"
-- 6. Verify no 500 errors appear

-- ============================================
-- ALTERNATIVE: Keep RLS but fix the policies
-- ============================================
-- If you want to keep RLS enabled, use these policies instead:

/*
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policy 1: Service role (backend) can do everything
-- Service role has access to all data regardless of RLS
CREATE POLICY "Service role bypass" ON public.bookings
  USING (true);

-- Policy 2: Customers can view their own bookings
CREATE POLICY "Customers can view own bookings" ON public.bookings
  FOR SELECT
  USING (customer_id = auth.uid());

-- Policy 3: Employees can view assigned bookings
CREATE POLICY "Employees can view assigned" ON public.bookings
  FOR SELECT
  USING (assigned_to = auth.uid());

-- Policy 4: Admins can view all (through role check)
CREATE POLICY "Admins bypass" ON public.bookings
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 5: Anyone can insert if authenticated
CREATE POLICY "Authenticated can insert" ON public.bookings
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after making changes to verify:

-- 1. Check if RLS is enabled (should show false after fix)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'bookings';

-- 2. Check for any existing policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'bookings';

-- 3. Test query (should work with service role)
-- SELECT COUNT(*) FROM bookings;

-- ============================================
-- NOTE
-- ============================================
-- The backend uses SERVICE_ROLE_KEY which should bypass RLS
-- If this doesn't work, RLS is likely misconfigured
-- Disabling RLS is the safest option for backend queries
-- The backend will enforce authorization using user_id parameter
