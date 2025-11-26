-- Monthly Pass Table Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS monthly_pass (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  customer_id UUID,
  total_washes INTEGER DEFAULT 4,
  remaining_washes INTEGER DEFAULT 4,
  valid_till DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  
  CONSTRAINT monthly_pass_pkey PRIMARY KEY (id),
  CONSTRAINT monthly_pass_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES profiles (id)
);

-- Create Indexes for Better Performance
CREATE INDEX IF NOT EXISTS idx_monthly_pass_customer_id ON monthly_pass(customer_id);
CREATE INDEX IF NOT EXISTS idx_monthly_pass_active ON monthly_pass(active);
CREATE INDEX IF NOT EXISTS idx_monthly_pass_customer_active ON monthly_pass(customer_id, active);
CREATE INDEX IF NOT EXISTS idx_monthly_pass_valid_till ON monthly_pass(valid_till);
CREATE INDEX IF NOT EXISTS idx_monthly_pass_created_at ON monthly_pass(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE monthly_pass ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY IF NOT EXISTS "Users can view their own passes" ON monthly_pass
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY IF NOT EXISTS "Users can update their own passes" ON monthly_pass
  FOR UPDATE USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own passes" ON monthly_pass
  FOR DELETE USING (auth.uid() = customer_id);

CREATE POLICY IF NOT EXISTS "Backend can manage passes" ON monthly_pass
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_pass TO authenticated;
GRANT ALL ON monthly_pass TO service_role;

-- Verify table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'monthly_pass'
ORDER BY ordinal_position;
