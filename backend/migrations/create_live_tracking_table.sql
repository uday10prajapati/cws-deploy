-- Drop existing live_tracking table if it exists
DROP TABLE IF EXISTS live_tracking CASCADE;

-- Create live_tracking table for real-time washer location tracking
CREATE TABLE live_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  emergency_request_id UUID NOT NULL REFERENCES emergency_wash_requests(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Location Data
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(7, 2),
  heading DECIMAL(6, 2),
  speed DECIMAL(6, 2),
  
  -- Status & Timeline
  status VARCHAR(20) DEFAULT 'on_the_way' CHECK (status IN ('on_the_way', 'reached', 'stopped')),
  tracking_started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reached_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Additional Info
  distance_covered DECIMAL(10, 2) DEFAULT 0,
  estimated_arrival TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Create indexes for faster queries
CREATE INDEX idx_live_tracking_emergency_request_id ON live_tracking(emergency_request_id);
CREATE INDEX idx_live_tracking_employee_id ON live_tracking(employee_id);
CREATE INDEX idx_live_tracking_status ON live_tracking(status);
CREATE INDEX idx_live_tracking_created_at ON live_tracking(created_at DESC);
CREATE INDEX idx_live_tracking_updated_at ON live_tracking(updated_at DESC);

-- Enable RLS
ALTER TABLE live_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Customers can view tracking for their emergency requests
CREATE POLICY "Customers can view tracking" ON live_tracking
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM emergency_wash_requests WHERE id = live_tracking.emergency_request_id
    )
  );

-- Employees (washers) can view their own tracking
CREATE POLICY "Employees can view their tracking" ON live_tracking
  FOR SELECT USING (auth.uid() = employee_id);

-- Employees (washers) can insert tracking data
CREATE POLICY "Employees can insert tracking data" ON live_tracking
  FOR INSERT WITH CHECK (auth.uid() = employee_id);

-- Employees (washers) can update their own tracking data
CREATE POLICY "Employees can update their tracking data" ON live_tracking
  FOR UPDATE USING (auth.uid() = employee_id);

-- Service role full access for backend operations
CREATE POLICY "Service role full access" ON live_tracking
  FOR ALL USING (auth.role() = 'service_role');

-- Update emergency_wash_requests table to add tracking reference
ALTER TABLE emergency_wash_requests
ADD COLUMN IF NOT EXISTS tracking_id UUID REFERENCES live_tracking(id) ON DELETE SET NULL;

ALTER TABLE emergency_wash_requests
ADD COLUMN IF NOT EXISTS tracking_status VARCHAR(20) DEFAULT NULL CHECK (tracking_status IS NULL OR tracking_status IN ('on_the_way', 'reached', 'stopped'));

-- Create index for tracking_status
CREATE INDEX IF NOT EXISTS idx_emergency_wash_tracking_status ON emergency_wash_requests(tracking_status);
