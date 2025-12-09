-- Add 'notified' column to monthly_pass table if it doesn't exist
-- This tracks whether an expiration notification has been sent
ALTER TABLE monthly_pass
ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT FALSE;

-- Update any existing expired passes to mark them as notified
UPDATE monthly_pass
SET notified = TRUE
WHERE valid_till < NOW();

-- Add index on valid_till for performance on expiration checks
CREATE INDEX IF NOT EXISTS idx_monthly_pass_valid_till ON monthly_pass(valid_till);

-- Add index on notified column for filtering
CREATE INDEX IF NOT EXISTS idx_monthly_pass_notified ON monthly_pass(notified);

-- Ensure notifications table has the required columns
-- (if it doesn't exist, this should already be created)
-- The notification will use: type='pass_expired', related_id=pass_id
