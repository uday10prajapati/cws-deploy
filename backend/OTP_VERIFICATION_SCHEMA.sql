-- OTP Verification Table Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to create/update the otp_verification table

-- Create OTP Verification Table (with employee_type support)
CREATE TABLE IF NOT EXISTS public.otp_verification (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User Contact Info
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- OTP Details
  otp VARCHAR(6) NOT NULL,
  
  -- User Role Information
  role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'employee', 'admin')),
  employee_type VARCHAR(50) CHECK (employee_type IN ('washer', 'rider', 'sales', NULL)),
  
  -- Verification Status
  verified BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP + INTERVAL '10 minutes',
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT valid_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Create Indexes for Better Performance
CREATE INDEX IF NOT EXISTS idx_otp_verification_email ON public.otp_verification(email);
CREATE INDEX IF NOT EXISTS idx_otp_verification_phone ON public.otp_verification(phone);
CREATE INDEX IF NOT EXISTS idx_otp_verification_created_at ON public.otp_verification(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_verification_expires_at ON public.otp_verification(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_verification_role ON public.otp_verification(role);
CREATE INDEX IF NOT EXISTS idx_otp_verification_employee_type ON public.otp_verification(employee_type);

-- Enable RLS (Row Level Security)
ALTER TABLE public.otp_verification ENABLE ROW LEVEL SECURITY;

-- Create RLS Policy: Allow anonymous users to insert OTP records
CREATE POLICY "Allow anyone to insert OTP records" ON public.otp_verification
  FOR INSERT WITH CHECK (TRUE);

-- Create RLS Policy: Allow anyone to read OTP records (for verification)
CREATE POLICY "Allow anyone to read OTP records" ON public.otp_verification
  FOR SELECT USING (TRUE);

-- Create RLS Policy: Allow backend to update OTP records
CREATE POLICY "Backend can update OTP records" ON public.otp_verification
  FOR UPDATE USING (TRUE)
  WITH CHECK (TRUE);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.otp_verification TO anon;
GRANT SELECT, INSERT, UPDATE ON public.otp_verification TO authenticated;
GRANT ALL ON public.otp_verification TO service_role;

-- Cleanup old OTP records (optional - run periodically)
-- DELETE FROM otp_verification WHERE expires_at < CURRENT_TIMESTAMP;
