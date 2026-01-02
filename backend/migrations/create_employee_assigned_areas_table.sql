-- Create employee_assigned_areas table
CREATE TABLE IF NOT EXISTS employee_assigned_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city VARCHAR(100) NOT NULL,
  talukas TEXT NOT NULL, -- comma-separated list of talukas
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_employee_areas_employee_id ON employee_assigned_areas(employee_id);
CREATE INDEX idx_employee_areas_city ON employee_assigned_areas(city);

-- Enable RLS
ALTER TABLE employee_assigned_areas ENABLE ROW LEVEL SECURITY;
