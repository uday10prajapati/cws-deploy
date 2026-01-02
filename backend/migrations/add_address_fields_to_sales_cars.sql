-- Add address fields to sales_cars table
ALTER TABLE sales_cars
ADD COLUMN customer_address TEXT,
ADD COLUMN customer_taluko TEXT,
ADD COLUMN customer_city TEXT,
ADD COLUMN customer_state TEXT,
ADD COLUMN customer_postal_code TEXT,
ADD COLUMN customer_country TEXT;
