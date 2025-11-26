-- Fix RLS Policies for Transactions Table
-- Run this in Supabase SQL Editor to fix row-level security issues

-- First, disable RLS temporarily to see current state
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Backend can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Backend can update transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can delete transactions" ON transactions;

-- Re-enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT their own transactions
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT 
  USING (auth.uid() = customer_id);

-- Policy 2: Service role (backend) can INSERT transactions
CREATE POLICY "Service role can insert transactions" ON transactions
  FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

-- Policy 3: Service role can UPDATE transactions
CREATE POLICY "Service role can update transactions" ON transactions
  FOR UPDATE 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy 4: Users can UPDATE their own transactions (for mark as read, etc.)
CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE 
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- Policy 5: Service role can DELETE transactions
CREATE POLICY "Service role can delete transactions" ON transactions
  FOR DELETE 
  USING (auth.role() = 'service_role');

-- Verify policies
SELECT tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'transactions'
ORDER BY policyname;
