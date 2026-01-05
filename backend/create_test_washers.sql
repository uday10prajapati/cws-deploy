-- SQL Script to Add Test Washers with Taluko
-- Run this in Supabase SQL Editor

-- 1. First, check what talukas exist in the system
SELECT DISTINCT taluko FROM profiles WHERE taluko IS NOT NULL LIMIT 10;

-- 2. Add test washers for "Ankleshwar" taluko
-- You can modify the taluko values as needed

-- Create washer 1
INSERT INTO profiles (
  id,
  email,
  name,
  phone,
  address,
  area,
  city,
  taluko,
  state,
  employee_type,
  account_status,
  created_at
) VALUES (
  gen_random_uuid(),
  'washer1.ankleshwar@carwash.com',
  'Raj Washer',
  '9876543210',
  '123 Main Street, Ankleshwar',
  'Ankleshwar',
  'Ankleshwar',
  'Ankleshwar',
  'Gujarat',
  'washer',
  true,
  NOW()
);

-- Create washer 2
INSERT INTO profiles (
  id,
  email,
  name,
  phone,
  address,
  area,
  city,
  taluko,
  state,
  employee_type,
  account_status,
  created_at
) VALUES (
  gen_random_uuid(),
  'washer2.ankleshwar@carwash.com',
  'Vikram Washer',
  '9876543211',
  '456 Park Avenue, Ankleshwar',
  'Ankleshwar',
  'Ankleshwar',
  'Ankleshwar',
  'Gujarat',
  'washer',
  true,
  NOW()
);

-- Create washer 3
INSERT INTO profiles (
  id,
  email,
  name,
  phone,
  address,
  area,
  city,
  taluko,
  state,
  employee_type,
  account_status,
  created_at
) VALUES (
  gen_random_uuid(),
  'washer3.ankleshwar@carwash.com',
  'Priya Washer',
  '9876543212',
  '789 Market Road, Ankleshwar',
  'Ankleshwar',
  'Ankleshwar',
  'Ankleshwar',
  'Gujarat',
  'washer',
  true,
  NOW()
);

-- 3. Verify washers were created
SELECT id, name, phone, taluko, employee_type, account_status 
FROM profiles 
WHERE employee_type = 'washer' 
AND account_status = true;

-- 4. Add some test ratings for washers (optional)
INSERT INTO ratings (washer_id, rating, customer_id, created_at)
SELECT id, 4.8, gen_random_uuid(), NOW()
FROM profiles 
WHERE employee_type = 'washer' 
AND taluko = 'Ankleshwar'
LIMIT 3;
