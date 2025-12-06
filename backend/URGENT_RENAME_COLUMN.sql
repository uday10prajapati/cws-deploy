-- CRITICAL FIX: Rename 'name' column to 'full_name' in profiles table
-- Run this SQL in your Supabase SQL Editor immediately

-- Step 1: Rename 'name' column to 'full_name'
ALTER TABLE public.profiles 
RENAME COLUMN name TO full_name;

-- Step 2: Verify the column was renamed
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'profiles' ORDER BY ordinal_position;

-- Result: You should see 'full_name' column instead of 'name'
