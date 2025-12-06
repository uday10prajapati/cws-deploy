-- Car Wash Tracking Table Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to create the car_wash_tracking table

-- Create Car Wash Tracking Table
CREATE TABLE IF NOT EXISTS public.car_wash_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Employee Reference
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Car Details
  car_owner_name VARCHAR(255) NOT NULL,
  car_model VARCHAR(100),
  car_number VARCHAR(20) UNIQUE NOT NULL,
  car_color VARCHAR(50),
  
  -- Wash Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'washed', 'cancelled')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  wash_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional Info
  notes TEXT,
  
  -- Constraints
  CONSTRAINT valid_car_number CHECK (
    car_number ~ '^[A-Z]{2}[A-Z0-9]{2}[A-Z]{2}[0-9]{4}$' OR 
    car_number ~ '^[0-9]{10}$'
  )
);

-- Create Indexes for Better Performance
CREATE INDEX IF NOT EXISTS idx_car_wash_employee_id ON public.car_wash_tracking(employee_id);
CREATE INDEX IF NOT EXISTS idx_car_wash_status ON public.car_wash_tracking(status);
CREATE INDEX IF NOT EXISTS idx_car_wash_created_at ON public.car_wash_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_car_wash_date ON public.car_wash_tracking(DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_car_wash_car_number ON public.car_wash_tracking(car_number);
CREATE INDEX IF NOT EXISTS idx_car_wash_employee_date ON public.car_wash_tracking(employee_id, DATE(created_at));

-- Enable RLS (Row Level Security)
ALTER TABLE public.car_wash_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS Policy: Users can only see their own records
CREATE POLICY "Employees can view their own washes" ON public.car_wash_tracking
  FOR SELECT USING (auth.uid() = employee_id);

-- Create RLS Policy: Users can only insert their own records
CREATE POLICY "Employees can insert their own washes" ON public.car_wash_tracking
  FOR INSERT WITH CHECK (auth.uid() = employee_id);

-- Create RLS Policy: Users can only update their own records
CREATE POLICY "Employees can update their own washes" ON public.car_wash_tracking
  FOR UPDATE USING (auth.uid() = employee_id)
  WITH CHECK (auth.uid() = employee_id);

-- Create RLS Policy: Admins can view all records
CREATE POLICY "Admins can view all washes" ON public.car_wash_tracking
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.car_wash_tracking TO authenticated;
GRANT ALL ON public.car_wash_tracking TO service_role;

-- Create a view for daily car wash statistics
CREATE OR REPLACE VIEW daily_car_wash_stats AS
SELECT
  employee_id,
  DATE(created_at) as wash_date,
  COUNT(*) as total_washes,
  COUNT(CASE WHEN status = 'washed' THEN 1 END) as completed_washes,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_washes,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_washes
FROM public.car_wash_tracking
GROUP BY employee_id, DATE(created_at)
ORDER BY employee_id, wash_date DESC;

-- Create a view for monthly car wash statistics
CREATE OR REPLACE VIEW monthly_car_wash_stats AS
SELECT
  employee_id,
  DATE_TRUNC('month', created_at)::DATE as wash_month,
  COUNT(*) as total_washes,
  COUNT(CASE WHEN status = 'washed' THEN 1 END) as completed_washes,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_washes,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_washes
FROM public.car_wash_tracking
GROUP BY employee_id, DATE_TRUNC('month', created_at)
ORDER BY employee_id, wash_month DESC;

-- Create a view for employee performance
CREATE OR REPLACE VIEW employee_car_wash_performance AS
SELECT
  employee_id,
  COUNT(*) as total_washes,
  COUNT(CASE WHEN status = 'washed' THEN 1 END) as completed_washes,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_washes,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_washes,
  ROUND(
    (COUNT(CASE WHEN status = 'washed' THEN 1 END)::FLOAT / COUNT(*)) * 100, 
    2
  ) as completion_rate,
  MIN(created_at) as first_wash,
  MAX(created_at) as last_wash
FROM public.car_wash_tracking
GROUP BY employee_id;

-- Grant permissions on views
GRANT SELECT ON daily_car_wash_stats TO authenticated;
GRANT SELECT ON monthly_car_wash_stats TO authenticated;
GRANT SELECT ON employee_car_wash_performance TO authenticated;
GRANT ALL ON daily_car_wash_stats TO service_role;
GRANT ALL ON monthly_car_wash_stats TO service_role;
GRANT ALL ON employee_car_wash_performance TO service_role;
