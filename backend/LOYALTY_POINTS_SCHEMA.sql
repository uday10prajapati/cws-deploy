-- Loyalty Points Schema for Washer Rewards

-- Create washer_loyalty_points table
CREATE TABLE IF NOT EXISTS washer_loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  washer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  cars_washed_today INTEGER NOT NULL DEFAULT 0,
  cars_washed_all_time INTEGER NOT NULL DEFAULT 0,
  last_wash_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(washer_id)
);

-- Create wash_history table for detailed tracking
CREATE TABLE IF NOT EXISTS wash_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  washer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  wash_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_washer_loyalty_washer_id ON washer_loyalty_points(washer_id);
CREATE INDEX IF NOT EXISTS idx_washer_loyalty_total_points ON washer_loyalty_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_washer_loyalty_last_wash_date ON washer_loyalty_points(last_wash_date);

CREATE INDEX IF NOT EXISTS idx_wash_history_washer_id ON wash_history(washer_id);
CREATE INDEX IF NOT EXISTS idx_wash_history_wash_date ON wash_history(wash_date);
CREATE INDEX IF NOT EXISTS idx_wash_history_booking_id ON wash_history(booking_id);

-- Enable RLS (Row Level Security) on loyalty tables
ALTER TABLE washer_loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE wash_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Washers can view their own loyalty points
CREATE POLICY "Washers view own loyalty points" ON washer_loyalty_points
  FOR SELECT USING (auth.uid() = washer_id);

-- RLS Policy: Admins can view all loyalty points
CREATE POLICY "Admins view all loyalty points" ON washer_loyalty_points
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policy: Washers can view their own wash history
CREATE POLICY "Washers view own wash history" ON wash_history
  FOR SELECT USING (auth.uid() = washer_id);

-- RLS Policy: Admins can view all wash history
CREATE POLICY "Admins view all wash history" ON wash_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
