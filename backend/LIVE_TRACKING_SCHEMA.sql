-- Live Tracking Table Schema for Real-time Location Tracking
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.live_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  booking_id UUID NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pickup_in_progress', 'in_wash', 'delivery_in_progress', 'completed')),
  tracking_type VARCHAR(20) NOT NULL DEFAULT 'live' CHECK (tracking_type IN ('live', 'historical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT live_tracking_pkey PRIMARY KEY (id),
  CONSTRAINT live_tracking_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
  CONSTRAINT live_tracking_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create Indexes for Better Performance
CREATE INDEX IF NOT EXISTS idx_live_tracking_booking_id ON public.live_tracking USING BTREE (booking_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_live_tracking_employee_id ON public.live_tracking USING BTREE (employee_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_live_tracking_created_at ON public.live_tracking USING BTREE (created_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_live_tracking_status ON public.live_tracking USING BTREE (status) TABLESPACE pg_default;

-- Enable RLS (Row Level Security)
ALTER TABLE public.live_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view tracking data for their own bookings
CREATE POLICY "Users can view their booking tracking" ON public.live_tracking
  FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings WHERE customer_id = auth.uid()
    )
    OR employee_id = auth.uid()
  );

-- RLS Policy: Employees can insert tracking data
CREATE POLICY "Employees can insert tracking data" ON public.live_tracking
  FOR INSERT
  WITH CHECK (employee_id = auth.uid());

-- RLS Policy: Employees can update their own tracking data
CREATE POLICY "Employees can update their own tracking" ON public.live_tracking
  FOR UPDATE
  USING (employee_id = auth.uid());
