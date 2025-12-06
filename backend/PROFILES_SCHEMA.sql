-- Profiles Table Schema for Supabase
-- This table stores user profile information extended from auth.users

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User Information
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Authentication
  password VARCHAR(255),
  
  -- User Role
  role VARCHAR(50) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'employee', 'admin')),
  
  -- Employee-specific fields
  employee_type VARCHAR(50) CHECK (employee_type IN ('washer', 'rider', 'sales', NULL)),
  
  -- Approval Status (for employees)
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Better Performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_employee_type ON profiles(employee_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Policy: Bypass RLS for service role and anon can insert
CREATE POLICY "Service role and anon can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can select all (for backend queries)
CREATE POLICY "Service role can select all"
  ON profiles FOR SELECT
  USING (true);
