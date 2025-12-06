-- BOOKINGS TABLE RLS FIX
-- Run this in Supabase SQL Editor if experiencing 500 errors on bookings queries

-- ============================================
-- STEP 1: Check if RLS is enabled
-- ============================================
-- SELECT * FROM information_schema.tables WHERE table_name = 'bookings';

-- ============================================
-- STEP 2: Temporarily disable RLS to test
-- ============================================
-- If you're getting 500 errors, uncomment this line
-- ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Test the app after disabling RLS
-- ============================================
-- If bookings now load without 500 error, RLS policies need fixing
-- If bookings STILL fail, it's a different issue (schema/connection)

-- ============================================
-- STEP 4: Re-enable with WORKING policies
-- ============================================
-- Uncomment below ONLY after confirming bookings work without RLS

/*
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Remove old broken policies if they exist
DROP POLICY IF EXISTS "Enable read access for users" ON public.bookings;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.bookings;
DROP POLICY IF EXISTS "Customers can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Employees can view bookings assigned to them" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;

-- Create new policies that work
CREATE POLICY "Enable customers to view own bookings"
  ON public.bookings FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Enable employees to view assigned bookings"
  ON public.bookings FOR SELECT
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Enable admins to view all bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Enable customers to update own bookings"
  ON public.bookings FOR UPDATE
  USING (customer_id = auth.uid());

CREATE POLICY "Enable admins to update all bookings"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Enable insert for admins"
  ON public.bookings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
*/

-- ============================================
-- ALTERNATIVE: If policies are causing issues
-- ============================================
-- You can COMPLETELY disable RLS if it's causing problems
-- The API will handle authorization via user_id parameter

-- ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
