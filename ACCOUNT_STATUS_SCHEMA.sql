-- Customer Account Status Management - Database Setup

-- Add account_status column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'active'
CHECK (account_status IN ('active', 'inactive', 'deactivate_requested'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);

-- Create index for faster status filtering combined with role
CREATE INDEX IF NOT EXISTS idx_profiles_role_account_status ON profiles(role, account_status);

-- Optional: Add audit tracking (timestamps for last status change)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create index for sorting by status change date
CREATE INDEX IF NOT EXISTS idx_profiles_status_changed_at ON profiles(status_changed_at);

-- Update existing customers to have 'active' status (if upgrading)
UPDATE profiles 
SET account_status = 'active' 
WHERE role = 'customer' AND account_status IS NULL;

-- Verify the schema update
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND column_name IN ('account_status', 'status_changed_at')
ORDER BY ordinal_position;
