-- Add assigned_to column to bookings table
-- Run this in Supabase SQL editor to add employee assignment support

-- Check if column exists, if not add it
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS assigned_to UUID;

-- Add comment to explain the column
COMMENT ON COLUMN bookings.assigned_to IS 'Employee/Staff ID assigned to handle this booking';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_to ON bookings(assigned_to);

-- If you want to reference auth.users table
-- Uncomment the line below:
-- ALTER TABLE bookings ADD CONSTRAINT fk_bookings_assigned_to FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;
