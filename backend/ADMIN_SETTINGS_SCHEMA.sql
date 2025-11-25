-- Admin Settings Table for Bank Account Configuration
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Setting Key (unique identifier)
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  
  -- JSON Data (flexible structure for different settings)
  setting_value JSONB NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Index for faster lookups
CREATE INDEX idx_admin_settings_key ON admin_settings(setting_key);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_settings_timestamp();

-- Enable RLS (Optional but recommended)
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users (admin) can access
CREATE POLICY "Admins can access settings" ON admin_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON admin_settings TO authenticated;
GRANT ALL ON admin_settings TO service_role;

-- Sample bank account structure (for reference)
-- {
--   "account_holder_name": "Uday Prajapati",
--   "account_number": "12345678",
--   "ifsc_code": "HDFC0000001",
--   "bank_name": "HDFC Bank",
--   "account_type": "Savings",
--   "razorpay_account_id": null,
--   "last_updated": "2025-01-01T10:00:00Z",
--   "verified": false,
--   "verification_date": null,
--   "deposit1_verified": null,
--   "deposit2_verified": null
-- }

-- Verify table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_settings'
ORDER BY ordinal_position;
