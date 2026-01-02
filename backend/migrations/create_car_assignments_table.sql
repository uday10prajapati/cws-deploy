-- Supabase Migration: Create car_assignments table for washer car assignments
-- Run this SQL in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.car_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  assigned_to uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  assigned_by_role text NOT NULL,
  assigned_by_name text,
  assigned_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_car_assignments_car_id ON public.car_assignments(car_id);
CREATE INDEX idx_car_assignments_assigned_to ON public.car_assignments(assigned_to);
CREATE INDEX idx_car_assignments_status ON public.car_assignments(status);
CREATE INDEX idx_car_assignments_assigned_by_role ON public.car_assignments(assigned_by_role);

-- Enable RLS (Row Level Security)
ALTER TABLE public.car_assignments ENABLE ROW LEVEL SECURITY;

-- Create policy for admin to view all assignments
CREATE POLICY "Admins can view all car assignments"
  ON public.car_assignments
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create policy for sub-admin to view assignments in their city and taluko
CREATE POLICY "Sub-admins can view assignments in their city and taluko"
  ON public.car_assignments
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.user_id()) = 'sub-admin'
    AND (
      (SELECT city FROM profiles WHERE id = auth.user_id()) = 
        (SELECT city FROM profiles WHERE id = assigned_to)
      OR
      (SELECT taluko FROM profiles WHERE id = auth.user_id()) = 
        (SELECT taluko FROM profiles WHERE id = assigned_to)
    )
  );

-- Create policy for HR to view assignments only in their taluko
CREATE POLICY "HR can view assignments in their taluko only"
  ON public.car_assignments
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.user_id()) = 'hr'
    AND (SELECT taluko FROM profiles WHERE id = auth.user_id()) = 
        (SELECT taluko FROM profiles WHERE id = assigned_to)
  );

-- Create policy for washers to view their own assignments
CREATE POLICY "Washers can view their own assignments"
  ON public.car_assignments
  FOR SELECT
  USING (assigned_to = auth.user_id());

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_car_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_car_assignments_updated_at_trigger ON public.car_assignments;
CREATE TRIGGER update_car_assignments_updated_at_trigger
BEFORE UPDATE ON public.car_assignments
FOR EACH ROW
EXECUTE FUNCTION update_car_assignments_updated_at();
