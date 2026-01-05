-- Add taluko and area fields to emergency_wash_requests table
-- This allows tracking which area/taluko the emergency wash request came from
-- and makes it easy to route to area HR and sub-admin

ALTER TABLE emergency_wash_requests
ADD COLUMN IF NOT EXISTS taluko VARCHAR(255),
ADD COLUMN IF NOT EXISTS area VARCHAR(255),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

-- Create index for faster querying by taluko
CREATE INDEX IF NOT EXISTS idx_emergency_wash_taluko ON emergency_wash_requests(taluko);
CREATE INDEX IF NOT EXISTS idx_emergency_wash_area ON emergency_wash_requests(area);
CREATE INDEX IF NOT EXISTS idx_emergency_wash_status_taluko ON emergency_wash_requests(status, taluko);

-- If emergency_wash_requests table doesn't exist, create it
CREATE TABLE IF NOT EXISTS emergency_wash_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Customer Information
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  
  -- Car Information
  car_id UUID,
  car_plate VARCHAR(20),
  car_model VARCHAR(100),
  car_color VARCHAR(50),
  
  -- Location Information
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city VARCHAR(100),
  taluko VARCHAR(255),
  area VARCHAR(255),
  
  -- Request Details
  description TEXT,
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled')),
  
  -- Assignment Information
  assigned_to UUID,
  
  -- Images
  after_img_1 TEXT,
  after_img_2 TEXT,
  after_img_3 TEXT,
  after_img_4 TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  payment_status VARCHAR(20),
  payment_amount DECIMAL(10, 2) DEFAULT 149.00,
  notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_emergency_wash_user_id ON emergency_wash_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_wash_taluko ON emergency_wash_requests(taluko);
CREATE INDEX IF NOT EXISTS idx_emergency_wash_area ON emergency_wash_requests(area);
CREATE INDEX IF NOT EXISTS idx_emergency_wash_status ON emergency_wash_requests(status);
CREATE INDEX IF NOT EXISTS idx_emergency_wash_status_taluko ON emergency_wash_requests(status, taluko);
CREATE INDEX IF NOT EXISTS idx_emergency_wash_assigned_to ON emergency_wash_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_emergency_wash_created_at ON emergency_wash_requests(created_at DESC);

-- Enable RLS
ALTER TABLE emergency_wash_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own emergency wash requests" ON emergency_wash_requests;
DROP POLICY IF EXISTS "Washers can view assigned requests" ON emergency_wash_requests;
DROP POLICY IF EXISTS "Service role can manage all emergency wash requests" ON emergency_wash_requests;
DROP POLICY IF EXISTS "Users can create emergency wash requests" ON emergency_wash_requests;
DROP POLICY IF EXISTS "Users can update their own emergency wash requests" ON emergency_wash_requests;
DROP POLICY IF EXISTS "Washers can update assigned requests" ON emergency_wash_requests;
DROP POLICY IF EXISTS "Admins can update any emergency wash request" ON emergency_wash_requests;

-- RLS Policies
-- Allow users to see their own requests
CREATE POLICY "Users can view their own emergency wash requests" ON emergency_wash_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Allow washers to see requests assigned to them
CREATE POLICY "Washers can view assigned requests" ON emergency_wash_requests
  FOR SELECT USING (auth.uid() = assigned_to);

-- Allow service role full access (for admin operations)
CREATE POLICY "Service role can manage all emergency wash requests" ON emergency_wash_requests
  FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to insert their own requests
CREATE POLICY "Users can create emergency wash requests" ON emergency_wash_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own requests
CREATE POLICY "Users can update their own emergency wash requests" ON emergency_wash_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow washers to update assigned requests (status, photos, etc.)
CREATE POLICY "Washers can update assigned requests" ON emergency_wash_requests
  FOR UPDATE USING (auth.uid() = assigned_to);

-- Allow admins (users with admin role) to update any request
CREATE POLICY "Admins can update any emergency wash request" ON emergency_wash_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
