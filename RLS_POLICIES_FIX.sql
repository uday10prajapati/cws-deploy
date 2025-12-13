-- ============================================================
-- FIX FOR "DATABASE ACCESS DENIED" ERROR - RLS POLICIES
-- ============================================================
-- 
-- This error occurs when Row Level Security (RLS) policies
-- are blocking your Android app from accessing Supabase tables.
--
-- Run these SQL commands in your Supabase SQL Editor to fix it.
-- ============================================================

-- ============================================================
-- 1. FIX: CARS TABLE RLS
-- ============================================================

-- First, DISABLE RLS on cars table (simpler for MVP)
ALTER TABLE public.cars DISABLE ROW LEVEL SECURITY;

-- OR if you want to keep RLS, use this policy:
-- Allow authenticated users to read all cars
CREATE POLICY "Allow authenticated users to read cars" ON public.cars
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow users to read their own cars
CREATE POLICY "Users can read their own cars" ON public.cars
  FOR SELECT
  USING (auth.uid() = customer_id);

-- ============================================================
-- 2. FIX: PROFILES TABLE RLS
-- ============================================================

-- DISABLE RLS on profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- OR if you want RLS, use these policies:
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow authenticated users to read profiles
CREATE POLICY "Allow authenticated read profiles" ON public.profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 3. FIX: MONTHLY_PASS TABLE RLS
-- ============================================================

-- DISABLE RLS on monthly_pass table
ALTER TABLE public.monthly_pass DISABLE ROW LEVEL SECURITY;

-- OR if you want RLS:
-- Allow users to read passes for their cars
CREATE POLICY "Users can read own passes" ON public.monthly_pass
  FOR SELECT
  USING (
    auth.uid() = customer_id OR
    car_id IN (
      SELECT id FROM public.cars WHERE customer_id = auth.uid()
    )
  );

-- ============================================================
-- 4. FIX: QR_CODES TABLE RLS
-- ============================================================

-- DISABLE RLS on qr_codes table
ALTER TABLE public.qr_codes DISABLE ROW LEVEL SECURITY;

-- OR if you want RLS:
-- Allow users to read QR codes for their cars
CREATE POLICY "Users can read own QR codes" ON public.qr_codes
  FOR SELECT
  USING (auth.uid() = customer_id);

-- ============================================================
-- 5. FIX: BOOKINGS TABLE RLS
-- ============================================================

-- DISABLE RLS on bookings table
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;

-- OR if you want RLS:
-- Allow users to read their bookings
CREATE POLICY "Users can read own bookings" ON public.bookings
  FOR SELECT
  USING (auth.uid() = customer_id);

-- ============================================================
-- 6. FIX: LOYALTY_POINTS TABLE RLS
-- ============================================================

-- DISABLE RLS on loyalty_points table
ALTER TABLE public.loyalty_points DISABLE ROW LEVEL SECURITY;

-- OR if you want RLS:
-- Allow users to read their loyalty points
CREATE POLICY "Users can read own loyalty points" ON public.loyalty_points
  FOR SELECT
  USING (auth.uid() = customer_id);

-- ============================================================
-- 7. FIX: CAR_WASH_TRACKING TABLE RLS
-- ============================================================

-- DISABLE RLS on car_wash_tracking table
ALTER TABLE public.car_wash_tracking DISABLE ROW LEVEL SECURITY;

-- OR if you want RLS:
-- Allow employees to read all washes
CREATE POLICY "Employees can read wash tracking" ON public.car_wash_tracking
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- QUICK FIX FOR IMMEDIATE USE (RUN THIS)
-- ============================================================
-- 
-- If you want to quickly disable RLS on all tables:

ALTER TABLE public.cars DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_pass DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_wash_tracking DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- VERIFY RLS STATUS (Check if disabled)
-- ============================================================

SELECT table_name, row_security_enabled 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'cars', 'profiles', 'monthly_pass', 'qr_codes', 
  'bookings', 'loyalty_points', 'car_wash_tracking'
);

-- ============================================================
-- ALTERNATIVE: BETTER RLS POLICIES (For Production)
-- ============================================================
--
-- If you want proper RLS policies instead of disabling:

-- 1. CARS - Allow reading all cars (needed for global search)
DROP POLICY IF EXISTS "Public can read cars" ON public.cars;
CREATE POLICY "Public can read cars" ON public.cars
  FOR SELECT
  USING (true);  -- Anyone can read cars (they're public data)

-- 2. PROFILES - Allow reading all profiles
DROP POLICY IF EXISTS "Public can read profiles" ON public.profiles;
CREATE POLICY "Public can read profiles" ON public.profiles
  FOR SELECT
  USING (true);  -- Anyone can read profiles

-- 3. MONTHLY_PASS - Allow reading any pass
DROP POLICY IF EXISTS "Public can read passes" ON public.monthly_pass;
CREATE POLICY "Public can read passes" ON public.monthly_pass
  FOR SELECT
  USING (true);  -- Anyone can read passes

-- 4. QR_CODES - Allow reading QR codes
DROP POLICY IF EXISTS "Public can read QR codes" ON public.qr_codes;
CREATE POLICY "Public can read QR codes" ON public.qr_codes
  FOR SELECT
  USING (true);  -- Anyone can read QR codes

-- 5. BOOKINGS - Allow reading bookings
DROP POLICY IF EXISTS "Public can read bookings" ON public.bookings;
CREATE POLICY "Public can read bookings" ON public.bookings
  FOR SELECT
  USING (true);  -- Anyone can read bookings

-- 6. LOYALTY_POINTS - Allow reading loyalty points
DROP POLICY IF EXISTS "Public can read loyalty points" ON public.loyalty_points;
CREATE POLICY "Public can read loyalty points" ON public.loyalty_points
  FOR SELECT
  USING (true);  -- Anyone can read loyalty points

-- 7. CAR_WASH_TRACKING - Allow inserting wash records
DROP POLICY IF EXISTS "Authenticated can insert wash tracking" ON public.car_wash_tracking;
CREATE POLICY "Authenticated can insert wash tracking" ON public.car_wash_tracking
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- GRANT PERMISSIONS TO SERVICE ROLE
-- ============================================================
--
-- Make sure your backend (service role key) has permissions:

GRANT SELECT, INSERT, UPDATE ON public.cars TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.monthly_pass TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.qr_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.loyalty_points TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.car_wash_tracking TO authenticated;

-- ============================================================
-- HOW TO RUN THIS IN SUPABASE
-- ============================================================
--
-- 1. Go to Supabase Dashboard
-- 2. Click "SQL Editor" in left sidebar
-- 3. Click "New Query"
-- 4. Copy and paste the SQL commands above
-- 5. Click "Run" button
-- 6. You should see "Success" messages
--
-- ============================================================
-- TESTING THE FIX
-- ============================================================
--
-- After running the SQL:
--
-- 1. Restart your Android app
-- 2. Try scanning a QR code or loading booking
-- 3. The "Database Access Denied" error should disappear
-- 4. You should see car details, customer name, and monthly pass info
--
-- ============================================================
-- IF ERROR STILL PERSISTS
-- ============================================================
--
-- Check these common issues:
--
-- 1. Wrong Supabase Key in Android app
--    - Make sure using ANON_KEY (not SERVICE_ROLE_KEY)
--    - ANON_KEY is in: Settings > API > anon public key
--
-- 2. Auth Token Invalid
--    - Check if Bearer token is properly set
--    - Token must be valid JWT from Supabase Auth
--
-- 3. Network Request Headers
--    - Authorization: Bearer {token}
--    - apikey: {SUPABASE_ANON_KEY}
--
-- 4. Check Supabase Logs
--    - Go to Logs > Edge Functions > Check recent requests
--    - Look for error messages
--
-- ============================================================
