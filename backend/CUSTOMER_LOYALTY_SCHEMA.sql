-- Customer Loyalty Points System Schema

-- Create customer_loyalty_points table
CREATE TABLE IF NOT EXISTS customer_loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  cars_washed INTEGER NOT NULL DEFAULT 0,
  last_wash_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id)
);

-- Create customer_wash_history table
CREATE TABLE IF NOT EXISTS customer_wash_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  washer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  wash_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create loyalty_offers table
CREATE TABLE IF NOT EXISTS loyalty_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_title VARCHAR(255) NOT NULL,
  offer_description TEXT,
  points_required INTEGER NOT NULL,
  discount_percentage INTEGER DEFAULT 0,
  coupon_code VARCHAR(100) UNIQUE NOT NULL,
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create loyalty_redemptions table (track who redeemed what)
CREATE TABLE IF NOT EXISTS loyalty_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES loyalty_offers(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  redeemed_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_customer_id ON customer_loyalty_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_total_points ON customer_loyalty_points(total_points DESC);

CREATE INDEX IF NOT EXISTS idx_customer_wash_history_customer_id ON customer_wash_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_wash_history_wash_date ON customer_wash_history(wash_date);
CREATE INDEX IF NOT EXISTS idx_customer_wash_history_washer_id ON customer_wash_history(washer_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_offers_points ON loyalty_offers(points_required);
CREATE INDEX IF NOT EXISTS idx_loyalty_offers_active ON loyalty_offers(is_active);

CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_customer_id ON loyalty_redemptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_redemptions_offer_id ON loyalty_redemptions(offer_id);

-- Enable RLS (Row Level Security)
ALTER TABLE customer_loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_wash_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_loyalty_points
CREATE POLICY "Customers view own loyalty points" ON customer_loyalty_points
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Admins view all loyalty points" ON customer_loyalty_points
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for customer_wash_history
CREATE POLICY "Customers view own wash history" ON customer_wash_history
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Admins view all wash history" ON customer_wash_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for loyalty_offers
CREATE POLICY "Everyone view active offers" ON loyalty_offers
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins manage offers" ON loyalty_offers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for loyalty_redemptions
CREATE POLICY "Customers view own redemptions" ON loyalty_redemptions
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Admins view all redemptions" ON loyalty_redemptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
