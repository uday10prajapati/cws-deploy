-- QR Code Management System Schema

-- 1. QR CODES TABLE - Stores QR code data for each car
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  qr_code_data TEXT NOT NULL, -- JSON encoded QR data
  qr_code_image TEXT, -- Base64 or URL to QR image
  customer_name TEXT,
  customer_email TEXT,
  customer_mobile TEXT,
  customer_address TEXT,
  customer_village TEXT,
  monthly_pass_id UUID, -- Reference to active monthly pass
  monthly_pass_active BOOLEAN DEFAULT FALSE,
  monthly_pass_expiry TIMESTAMP WITHOUT TIME ZONE, -- Auto-updated from monthly_pass
  car_brand TEXT,
  car_model TEXT,
  car_number_plate TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT qr_codes_pkey PRIMARY KEY (id),
  CONSTRAINT qr_codes_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars (id),
  CONSTRAINT qr_codes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles (id),
  CONSTRAINT qr_codes_monthly_pass_id_fkey FOREIGN KEY (monthly_pass_id) REFERENCES public.monthly_passes (id)
);

-- 2. WASH SESSIONS TABLE - Records each wash session
CREATE TABLE IF NOT EXISTS public.wash_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  qr_code_id UUID NOT NULL,
  car_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  washer_id UUID NOT NULL,
  session_start TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITHOUT TIME ZONE,
  status TEXT DEFAULT 'in_progress', -- in_progress, completed, cancelled
  monthly_pass_active BOOLEAN,
  is_completed BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT wash_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT wash_sessions_qr_code_id_fkey FOREIGN KEY (qr_code_id) REFERENCES public.qr_codes (id),
  CONSTRAINT wash_sessions_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars (id),
  CONSTRAINT wash_sessions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles (id),
  CONSTRAINT wash_sessions_washer_id_fkey FOREIGN KEY (washer_id) REFERENCES public.profiles (id)
);

-- 3. WASH SESSION IMAGES TABLE - Stores before and after images
CREATE TABLE IF NOT EXISTS public.wash_session_images (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  wash_session_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  image_type TEXT, -- 'before' or 'after'
  image_position INT, -- Position 1-4 for multiple images
  uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT wash_session_images_pkey PRIMARY KEY (id),
  CONSTRAINT wash_session_images_wash_session_id_fkey FOREIGN KEY (wash_session_id) REFERENCES public.wash_sessions (id)
);

-- 4. QR CODE SCANS LOG TABLE - Logs each QR code scan
CREATE TABLE IF NOT EXISTS public.qr_code_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  qr_code_id UUID NOT NULL,
  washer_id UUID NOT NULL,
  scan_timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  scan_location TEXT, -- Can store GPS coordinates
  device_info TEXT,
  
  CONSTRAINT qr_code_scans_pkey PRIMARY KEY (id),
  CONSTRAINT qr_code_scans_qr_code_id_fkey FOREIGN KEY (qr_code_id) REFERENCES public.qr_codes (id),
  CONSTRAINT qr_code_scans_washer_id_fkey FOREIGN KEY (washer_id) REFERENCES public.profiles (id)
);

-- 5. WASH COMPLETION RECORDS TABLE - Final record of wash completion
CREATE TABLE IF NOT EXISTS public.wash_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  wash_session_id UUID NOT NULL,
  qr_code_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  washer_id UUID NOT NULL,
  completion_timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  loyalty_points_awarded INT DEFAULT 1,
  payment_status TEXT DEFAULT 'pending', -- pending, completed, failed
  notes TEXT,
  
  CONSTRAINT wash_completions_pkey PRIMARY KEY (id),
  CONSTRAINT wash_completions_wash_session_id_fkey FOREIGN KEY (wash_session_id) REFERENCES public.wash_sessions (id),
  CONSTRAINT wash_completions_qr_code_id_fkey FOREIGN KEY (qr_code_id) REFERENCES public.qr_codes (id),
  CONSTRAINT wash_completions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles (id),
  CONSTRAINT wash_completions_washer_id_fkey FOREIGN KEY (washer_id) REFERENCES public.profiles (id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_qr_codes_car_id ON public.qr_codes(car_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_customer_id ON public.qr_codes(customer_id);
CREATE INDEX IF NOT EXISTS idx_wash_sessions_qr_code_id ON public.wash_sessions(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_wash_sessions_washer_id ON public.wash_sessions(washer_id);
CREATE INDEX IF NOT EXISTS idx_wash_sessions_status ON public.wash_sessions(status);
CREATE INDEX IF NOT EXISTS idx_qr_code_scans_qr_code_id ON public.qr_code_scans(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_code_scans_washer_id ON public.qr_code_scans(washer_id);
