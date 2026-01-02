-- Create employee assigned areas table
CREATE TABLE IF NOT EXISTS employee_assigned_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id),
  city VARCHAR(100) NOT NULL,
  talukas TEXT NOT NULL, -- comma-separated taluka names
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_areas_employee ON employee_assigned_areas(employee_id);
CREATE INDEX idx_areas_city ON employee_assigned_areas(city);
CREATE INDEX idx_areas_assigned_by ON employee_assigned_areas(assigned_by);

-- Enable RLS
ALTER TABLE employee_assigned_areas ENABLE ROW LEVEL SECURITY;
