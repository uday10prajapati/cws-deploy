-- Sales Customer Link Schema for Supabase
-- This tracks which sales person added each customer
-- Customers are stored in the existing profiles table with car_image_url added

-- 1. ALTER existing profiles table to add car image and sales tracking fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS car_image_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS added_by_sales_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS car_model VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS car_number VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS car_color VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS area VARCHAR(100);

-- Create Indexes for Better Performance on new columns
CREATE INDEX IF NOT EXISTS idx_profiles_added_by_sales_id ON profiles(added_by_sales_id);
CREATE INDEX IF NOT EXISTS idx_profiles_area ON profiles(area);
CREATE INDEX IF NOT EXISTS idx_profiles_car_image ON profiles(car_image_url);

-- 2. Create sales_customer_link table (lightweight tracking)
CREATE TABLE IF NOT EXISTS sales_customer_link (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_sales_customer_link_sales_id ON sales_customer_link(sales_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_link_customer_id ON sales_customer_link(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_link_added_at ON sales_customer_link(added_at DESC);

-- Enable Row Level Security
ALTER TABLE sales_customer_link ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_customer_link
CREATE POLICY "Sales view their own customer links" ON sales_customer_link
  FOR SELECT USING (sales_id = auth.uid());

CREATE POLICY "Sales insert customer links" ON sales_customer_link
  FOR INSERT WITH CHECK (sales_id = auth.uid());

CREATE POLICY "Admins view all customer links" ON sales_customer_link
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
