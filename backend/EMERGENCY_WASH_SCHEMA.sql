-- Create Emergency Wash Requests Table
CREATE TABLE IF NOT EXISTS public.emergency_wash_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  car_id uuid NULL,
  car_plate text NULL,
  car_model text NULL,
  address text NOT NULL,
  description text NULL,
  status text NULL DEFAULT 'Pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  assigned_to uuid NULL,
  completed_at timestamp with time zone NULL,
  before_img_1 text NULL,
  before_img_2 text NULL,
  before_img_3 text NULL,
  before_img_4 text NULL,
  after_img_1 text NULL,
  after_img_2 text NULL,
  after_img_3 text NULL,
  after_img_4 text NULL,
  CONSTRAINT emergency_wash_requests_pkey PRIMARY KEY (id),
  CONSTRAINT emergency_wash_requests_car_id_fkey FOREIGN KEY (car_id) REFERENCES cars (id),
  CONSTRAINT emergency_wash_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id),
  CONSTRAINT emergency_wash_requests_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users (id)
) TABLESPACE pg_default;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_emergency_wash_user_id ON public.emergency_wash_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_wash_status ON public.emergency_wash_requests(status);
CREATE INDEX IF NOT EXISTS idx_emergency_wash_assigned_to ON public.emergency_wash_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_emergency_wash_created_at ON public.emergency_wash_requests(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.emergency_wash_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Policy for customers to view their own requests
CREATE POLICY "Users can view their own emergency wash requests"
ON public.emergency_wash_requests FOR SELECT
USING (auth.uid() = user_id);

-- Policy for admin to view all requests
CREATE POLICY "Admin can view all emergency wash requests"
ON public.emergency_wash_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy for employees to view assigned requests
CREATE POLICY "Employees can view assigned emergency wash requests"
ON public.emergency_wash_requests FOR SELECT
USING (
  auth.uid() = assigned_to OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('employee', 'admin')
  )
);

-- Policy for customers to insert their own requests
CREATE POLICY "Users can create emergency wash requests"
ON public.emergency_wash_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for customers to update their own requests
CREATE POLICY "Users can update their own emergency wash requests"
ON public.emergency_wash_requests FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for admin/employees to update requests
CREATE POLICY "Admin and employees can update emergency wash requests"
ON public.emergency_wash_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'employee')
  )
);

-- Create storage bucket for emergency wash images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('emergency-wash-images', 'emergency-wash-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage bucket
CREATE POLICY "Public read access for emergency wash images"
ON storage.objects FOR SELECT
USING (bucket_id = 'emergency-wash-images');

CREATE POLICY "Authenticated users can upload emergency wash images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'emergency-wash-images' AND auth.role() = 'authenticated');
