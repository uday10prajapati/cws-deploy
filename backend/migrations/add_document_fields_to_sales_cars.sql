-- Migration: Document columns for sales_cars table
-- This documents how the existing columns are used for car and document storage

-- Column usage for car and documents
COMMENT ON COLUMN public.sales_cars.car_photo_url IS 'URL to car photo/image';
COMMENT ON COLUMN public.sales_cars.image_url_1 IS 'URL to address proof document (ID/Aadhaar/Voter ID)';
COMMENT ON COLUMN public.sales_cars.image_url_2 IS 'URL to light bill / electricity bill document';

