-- Add car_id column to monthly_pass table
-- Run this in Supabase SQL Editor

ALTER TABLE monthly_pass ADD COLUMN IF NOT EXISTS car_id UUID REFERENCES cars(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_monthly_pass_car_id ON monthly_pass(car_id);
CREATE INDEX IF NOT EXISTS idx_monthly_pass_customer_car ON monthly_pass(customer_id, car_id);

-- Update RLS policies if needed (service_role can already do everything)
