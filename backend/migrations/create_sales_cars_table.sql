-- Create sales_cars table to store car information registered by sales employees
CREATE TABLE IF NOT EXISTS public.sales_cars (
  id TEXT PRIMARY KEY,
  sales_person_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model VARCHAR(100) NOT NULL,
  number_plate VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(50),
  image_url_1 TEXT,
  image_url_2 TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_cars_sales_person_id ON public.sales_cars(sales_person_id);
CREATE INDEX IF NOT EXISTS idx_sales_cars_number_plate ON public.sales_cars(number_plate);

-- Enable RLS (Row Level Security)
ALTER TABLE public.sales_cars ENABLE ROW LEVEL SECURITY;

-- Create policy: Sales persons can only view their own cars
CREATE POLICY "Users can view own cars" ON public.sales_cars
  FOR SELECT USING (auth.uid() = sales_person_id);

-- Create policy: Sales persons can insert their own cars
CREATE POLICY "Users can insert own cars" ON public.sales_cars
  FOR INSERT WITH CHECK (auth.uid() = sales_person_id);

-- Create policy: Sales persons can update their own cars
CREATE POLICY "Users can update own cars" ON public.sales_cars
  FOR UPDATE USING (auth.uid() = sales_person_id);

-- Create policy: Sales persons can delete their own cars
CREATE POLICY "Users can delete own cars" ON public.sales_cars
  FOR DELETE USING (auth.uid() = sales_person_id);
