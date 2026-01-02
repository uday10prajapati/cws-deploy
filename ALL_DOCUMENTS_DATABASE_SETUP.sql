-- All Documents Module - Database Setup & Verification

-- ============================================
-- 1. VERIFY REQUIRED COLUMNS IN sales_cars TABLE
-- ============================================

-- Check if all required columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sales_cars'
ORDER BY ordinal_position;

-- Expected columns:
-- - id (TEXT PRIMARY KEY)
-- - customer_name (VARCHAR)
-- - customer_phone (VARCHAR)
-- - number_plate (VARCHAR)
-- - customer_city (VARCHAR/TEXT)
-- - customer_taluko (VARCHAR/TEXT)
-- - car_photo_url (TEXT) - Car image
-- - image_url_1 (TEXT) - Address Proof
-- - image_url_2 (TEXT) - Light Bill
-- - created_at (TIMESTAMP)
-- - sales_person_id (UUID)

-- ============================================
-- 2. ADD MISSING COLUMNS (IF NEEDED)
-- ============================================

-- Add customer_city if missing
ALTER TABLE public.sales_cars
ADD COLUMN IF NOT EXISTS customer_city VARCHAR(100);

-- Add customer_taluko if missing
ALTER TABLE public.sales_cars
ADD COLUMN IF NOT EXISTS customer_taluko VARCHAR(100);

-- Add comments for documentation
COMMENT ON COLUMN public.sales_cars.customer_city IS 'City where customer is located';
COMMENT ON COLUMN public.sales_cars.customer_taluko IS 'Taluka/Subdivision where customer is located';

-- ============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index for filtering by city (Sub-General)
CREATE INDEX IF NOT EXISTS idx_sales_cars_customer_city 
ON public.sales_cars(customer_city);

-- Index for filtering by taluko (HR-General)
CREATE INDEX IF NOT EXISTS idx_sales_cars_customer_taluko 
ON public.sales_cars(customer_taluko);

-- Index for searching by customer name
CREATE INDEX IF NOT EXISTS idx_sales_cars_customer_name 
ON public.sales_cars(customer_name);

-- Index for document queries
CREATE INDEX IF NOT EXISTS idx_sales_cars_has_documents 
ON public.sales_cars(car_photo_url, image_url_1, image_url_2);

-- ============================================
-- 4. VERIFY PROFILES TABLE SETUP
-- ============================================

-- Check profiles table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Expected columns for role-based access:
-- - id (UUID PRIMARY KEY)
-- - employee_type (VARCHAR) - 'general', 'sub-general', 'hr-general', 'salesman'
-- - assigned_cities (JSONB/TEXT ARRAY)
-- - assigned_talukas (JSONB/TEXT ARRAY)

-- Add columns if missing
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS assigned_cities TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS assigned_talukas TEXT[] DEFAULT ARRAY[]::TEXT[];

COMMENT ON COLUMN public.profiles.assigned_cities IS 'Array of cities assigned to Sub-General role';
COMMENT ON COLUMN public.profiles.assigned_talukas IS 'Array of talukas assigned to HR-General role';

-- ============================================
-- 5. VIEW: Documents with Role-Based Access
-- ============================================

-- Create view for easier querying
CREATE OR REPLACE VIEW public.v_all_documents AS
SELECT 
  sc.id,
  sc.customer_name,
  sc.customer_phone,
  sc.number_plate,
  sc.model,
  sc.color,
  sc.customer_city,
  sc.customer_taluko,
  sc.car_photo_url,
  sc.image_url_1 as address_proof_url,
  sc.image_url_2 as light_bill_url,
  sc.created_at,
  sc.sales_person_id,
  CASE 
    WHEN sc.car_photo_url IS NOT NULL THEN 1 ELSE 0
  END as has_car_photo,
  CASE 
    WHEN sc.image_url_1 IS NOT NULL THEN 1 ELSE 0
  END as has_address_proof,
  CASE 
    WHEN sc.image_url_2 IS NOT NULL THEN 1 ELSE 0
  END as has_light_bill
FROM public.sales_cars sc
WHERE sc.car_photo_url IS NOT NULL 
   OR sc.image_url_1 IS NOT NULL 
   OR sc.image_url_2 IS NOT NULL
ORDER BY sc.created_at DESC;

-- ============================================
-- 6. TEST QUERIES FOR EACH ROLE
-- ============================================

-- HR-General: Documents from assigned talukas
-- Replace 'user-id' and talukas with actual values
SELECT * FROM public.sales_cars
WHERE customer_taluko IN ('Sanand', 'Bavla', 'Dholka')
  AND (car_photo_url IS NOT NULL OR image_url_1 IS NOT NULL OR image_url_2 IS NOT NULL)
ORDER BY created_at DESC;

-- Sub-General: Documents from assigned cities
SELECT * FROM public.sales_cars
WHERE customer_city IN ('Ahmedabad (City)', 'Surat (City)')
  AND (car_photo_url IS NOT NULL OR image_url_1 IS NOT NULL OR image_url_2 IS NOT NULL)
ORDER BY created_at DESC;

-- General: All documents
SELECT * FROM public.sales_cars
WHERE car_photo_url IS NOT NULL 
   OR image_url_1 IS NOT NULL 
   OR image_url_2 IS NOT NULL
ORDER BY created_at DESC;

-- ============================================
-- 7. SAMPLE DATA FOR TESTING
-- ============================================

-- Insert test data (adjust values as needed)
INSERT INTO public.sales_cars (
  id,
  sales_person_id,
  customer_name,
  customer_phone,
  model,
  number_plate,
  color,
  customer_city,
  customer_taluko,
  car_photo_url,
  image_url_1,
  image_url_2,
  created_at
) VALUES (
  'test_car_001',
  'sales-person-id-here',
  'Test Customer 1',
  '9876543210',
  'Honda Civic',
  'MH-01-AB-1234',
  'White',
  'Ahmedabad (City)',
  'Sanand',
  'https://example.com/car_photo.jpg',
  'https://example.com/address_proof.jpg',
  'https://example.com/light_bill.jpg',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on sales_cars if not already enabled
ALTER TABLE public.sales_cars ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for General role (see all documents)
CREATE POLICY "General can view all documents"
ON public.sales_cars
FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'authenticated'
);

-- ============================================
-- 9. VERIFY DATA INTEGRITY
-- ============================================

-- Check documents with missing city/taluko
SELECT id, customer_name, customer_city, customer_taluko, created_at
FROM public.sales_cars
WHERE (car_photo_url IS NOT NULL OR image_url_1 IS NOT NULL OR image_url_2 IS NOT NULL)
  AND (customer_city IS NULL OR customer_taluko IS NULL)
LIMIT 10;

-- Count documents by city
SELECT customer_city, COUNT(*) as document_count
FROM public.sales_cars
WHERE car_photo_url IS NOT NULL OR image_url_1 IS NOT NULL OR image_url_2 IS NOT NULL
GROUP BY customer_city
ORDER BY document_count DESC;

-- Count documents by taluko
SELECT customer_taluko, COUNT(*) as document_count
FROM public.sales_cars
WHERE car_photo_url IS NOT NULL OR image_url_1 IS NOT NULL OR image_url_2 IS NOT NULL
GROUP BY customer_taluko
ORDER BY document_count DESC;

-- ============================================
-- 10. PERFORMANCE ANALYSIS
-- ============================================

-- Analyze index usage
EXPLAIN ANALYZE
SELECT * FROM public.sales_cars
WHERE customer_city = 'Ahmedabad (City)'
  AND (car_photo_url IS NOT NULL OR image_url_1 IS NOT NULL OR image_url_2 IS NOT NULL);

-- Check table size
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename = 'sales_cars';
