-- Password Reset OTP Table
CREATE TABLE IF NOT EXISTS password_reset_otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_email ON password_reset_otp(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_created_at ON password_reset_otp(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE password_reset_otp ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF NOT EXISTS "Anyone can insert OTP" ON password_reset_otp;
DROP POLICY IF NOT EXISTS "Anyone can view OTP" ON password_reset_otp;
DROP POLICY IF NOT EXISTS "Anyone can update OTP" ON password_reset_otp;

-- Create RLS policies
CREATE POLICY "Anyone can insert OTP" ON password_reset_otp
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view OTP" ON password_reset_otp
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update OTP" ON password_reset_otp
  FOR UPDATE
  USING (true);

-- Add comments
COMMENT ON TABLE password_reset_otp IS 'Stores temporary OTP codes for password reset functionality';
COMMENT ON COLUMN password_reset_otp.email IS 'User email for password reset';
COMMENT ON COLUMN password_reset_otp.otp IS '6-digit one-time password';
COMMENT ON COLUMN password_reset_otp.verified IS 'Whether OTP was successfully verified';
COMMENT ON COLUMN password_reset_otp.used IS 'Whether OTP was already used for password reset';
COMMENT ON COLUMN password_reset_otp.expires_at IS 'When the OTP expires (10 minutes after creation)';
