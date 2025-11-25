-- Transactions Table Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Customer Reference
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Related Records
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  pass_id UUID REFERENCES monthly_pass(id) ON DELETE SET NULL,
  
  -- Transaction Details
  type VARCHAR(50) NOT NULL CHECK (type IN ('booking_payment', 'monthly_pass', 'wallet_topup', 'refund', 'cashback')),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('debit', 'credit')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('success', 'failed', 'pending', 'refunded')),
  
  -- Amount Details
  amount DECIMAL(10, 2) NOT NULL,
  gst DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- Payment Details
  payment_method VARCHAR(20) CHECK (payment_method IN ('upi', 'card', 'wallet', 'netbanking', 'other')),
  gateway_order_id VARCHAR(100),
  gateway_payment_id VARCHAR(100),
  
  -- Invoice & Tax
  invoice_url TEXT,
  gst_number VARCHAR(50),
  
  -- Additional Info
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Enable RLS (Row Level Security) if needed
  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Create Indexes for Better Performance
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transactions_booking_id ON transactions(booking_id);
CREATE INDEX idx_transactions_pass_id ON transactions(pass_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_customer_created ON transactions(customer_id, created_at DESC);

-- Create Composite Index for common queries
CREATE INDEX idx_transactions_customer_status ON transactions(customer_id, status);

-- Enable RLS (Row Level Security) - Optional but recommended
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policy: Users can only see their own transactions
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = customer_id);

-- Create RLS Policy: Only backend can insert transactions
CREATE POLICY "Backend can insert transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Create RLS Policy: Only backend can update transactions
CREATE POLICY "Backend can update transactions" ON transactions
  FOR UPDATE USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- Create RLS Policy: Admins can delete transactions
CREATE POLICY "Admins can delete transactions" ON transactions
  FOR DELETE USING (auth.uid() = customer_id);

-- Create a function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view for transaction summary
CREATE OR REPLACE VIEW transaction_summary AS
SELECT
  customer_id,
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  SUM(CASE WHEN direction = 'debit' AND status = 'success' THEN total_amount ELSE 0 END) as total_spent,
  SUM(CASE WHEN type = 'refund' AND status = 'success' THEN amount ELSE 0 END) as total_refunded,
  SUM(CASE WHEN direction = 'credit' THEN amount ELSE 0 END) as total_credited,
  MAX(created_at) as last_transaction
FROM transactions
GROUP BY customer_id;

-- Create a view for monthly transaction summary
CREATE OR REPLACE VIEW monthly_transaction_summary AS
SELECT
  customer_id,
  DATE_TRUNC('month', created_at)::DATE as month,
  COUNT(*) as transaction_count,
  SUM(CASE WHEN direction = 'debit' AND status = 'success' THEN total_amount ELSE 0 END) as monthly_spent,
  SUM(CASE WHEN type = 'refund' AND status = 'success' THEN amount ELSE 0 END) as monthly_refunded
FROM transactions
GROUP BY customer_id, DATE_TRUNC('month', created_at);

-- Sample data for testing (optional)
INSERT INTO transactions (
  customer_id,
  booking_id,
  type,
  direction,
  status,
  amount,
  gst,
  total_amount,
  currency,
  payment_method,
  gst_number,
  notes
) VALUES
-- Note: Replace 'your-user-uuid' with actual Supabase user UUID
-- (
--   'your-user-uuid'::uuid,
--   'booking-uuid'::uuid,
--   'booking_payment',
--   'debit',
--   'success',
--   399.00,
--   72.00,
--   471.00,
--   'INR',
--   'upi',
--   '18AABCT1234H1Z0',
--   'Exterior + Interior wash'
-- ),
-- (
--   'your-user-uuid'::uuid,
--   NULL,
--   'monthly_pass',
--   'debit',
--   'success',
--   1499.00,
--   269.82,
--   1768.82,
--   'INR',
--   'card',
--   '18AABCT1234H1Z0',
--   'Standard Monthly Pass (8 washes)'
-- )
ON CONFLICT DO NOTHING;

-- Verify table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

-- Grant permissions (if needed)
GRANT SELECT, INSERT, UPDATE ON transactions TO authenticated;
GRANT ALL ON transactions TO service_role;
