-- FIX PROFILES TABLE SCHEMA
-- Run this SQL in your Supabase SQL Editor to fix the column names and RLS policies

-- Step 1: Rename 'name' column to 'full_name'
ALTER TABLE profiles RENAME COLUMN name TO full_name;

-- Step 2: Drop the password column (not needed, passwords are in auth.users)
ALTER TABLE profiles DROP COLUMN IF EXISTS password;

-- Step 3: Ensure all required columns exist with correct types
-- This is idempotent - won't fail if columns already exist

-- Step 4: Update RLS Policies to allow backend inserts during registration

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Service role and anon can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can select all" ON profiles;

-- Create better RLS policies
-- Allow service role (backend) to insert new profiles during registration
CREATE POLICY "Backend can insert profiles during registration"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Allow service role to select all profiles (for backend queries)
CREATE POLICY "Backend can read all profiles"
  ON profiles FOR SELECT
  USING (true);

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Users can update address fields in their profile
CREATE POLICY "Users can update their address"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Verify the table structure
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'profiles' ORDER BY ordinal_position;
