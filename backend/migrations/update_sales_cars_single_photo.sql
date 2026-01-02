-- Migration: Update sales_cars table to include customer details (name and phone)
-- This migration adds customer_name and customer_phone columns to sales_cars table

-- Add columns for customer information
ALTER TABLE public.sales_cars 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);

-- Note: Keeping image_url_1 and image_url_2 for backward compatibility
-- The car_photo_url column (if added in previous migration) can be dropped if not needed
-- DROP COLUMN IF EXISTS car_photo_url;

