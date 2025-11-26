-- ⭐ RATINGS SCHEMA
-- Add rating columns to bookings table

-- Add new columns if they don't exist
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS rating_comment TEXT,
ADD COLUMN IF NOT EXISTS has_rated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rated_at TIMESTAMP WITH TIME ZONE;

-- Create index on rating for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_bookings_has_rated ON bookings(has_rated);
CREATE INDEX IF NOT EXISTS idx_bookings_rated_at ON bookings(rated_at DESC);

-- Comment on columns for documentation
COMMENT ON COLUMN bookings.rating IS 'Star rating from 1-5 given by customer';
COMMENT ON COLUMN bookings.rating_comment IS 'Optional feedback comment from customer';
COMMENT ON COLUMN bookings.has_rated IS 'Flag to indicate if booking has been rated';
COMMENT ON COLUMN bookings.rated_at IS 'Timestamp when rating was submitted';

-- Add triggers to automatically set has_rated flag when rating is added
CREATE OR REPLACE FUNCTION update_has_rated_flag()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating IS NOT NULL THEN
    NEW.has_rated := TRUE;
    IF NEW.rated_at IS NULL THEN
      NEW.rated_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_has_rated_trigger ON bookings;
CREATE TRIGGER set_has_rated_trigger
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_has_rated_flag();

-- Display table structure for verification
\d bookings
