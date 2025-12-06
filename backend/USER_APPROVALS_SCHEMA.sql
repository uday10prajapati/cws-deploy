-- User Approvals Table Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
-- This table tracks pending employee signup requests that need admin approval

CREATE TABLE IF NOT EXISTS user_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User Reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User Info (stored for reference)
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  
  -- Role Information
  requested_role VARCHAR(50) NOT NULL CHECK (requested_role IN ('employee_washer', 'employee_rider', 'employee_sales', 'customer')),
  
  -- Approval Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  
  -- Admin Review Info
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Better Performance
CREATE INDEX idx_user_approvals_user_id ON user_approvals(user_id);
CREATE INDEX idx_user_approvals_status ON user_approvals(status);
CREATE INDEX idx_user_approvals_email ON user_approvals(email);
CREATE INDEX idx_user_approvals_created_at ON user_approvals(created_at);

-- Add column to profiles table to track approval status (if not exists)
-- Note: Run this only if the profiles table exists and doesn't have this column
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending';

-- Enable Row Level Security (Optional)
-- ALTER TABLE user_approvals ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can see all approval requests
-- CREATE POLICY "Admins can view all approval requests"
-- ON user_approvals FOR SELECT
-- USING (
--   (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
-- );

-- Policy: Users can only see their own approval status
-- CREATE POLICY "Users can view their own approval"
-- ON user_approvals FOR SELECT
-- USING (user_id = auth.uid());
