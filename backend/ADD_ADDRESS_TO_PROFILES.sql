-- Add Address Fields to Profiles Table
-- Run this SQL in your Supabase SQL Editor

-- Add address columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS address_type VARCHAR(50) DEFAULT 'home' CHECK (address_type IN ('home', 'office', 'other'));

-- Create index for faster address lookups
CREATE INDEX IF NOT EXISTS idx_profiles_address ON profiles(address);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);

-- Add comment for documentation
COMMENT ON COLUMN profiles.address IS 'Street address, building name, flat number, etc.';
COMMENT ON COLUMN profiles.city IS 'City/Town name';
COMMENT ON COLUMN profiles.state IS 'State/Province name';
COMMENT ON COLUMN profiles.postal_code IS 'Postal/ZIP code';
COMMENT ON COLUMN profiles.country IS 'Country name';
COMMENT ON COLUMN profiles.address_type IS 'Type of address (home, office, other)';
