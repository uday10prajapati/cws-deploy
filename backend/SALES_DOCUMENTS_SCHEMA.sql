-- Sales Documents Upload System Schema

-- Create sales_documents table
CREATE TABLE IF NOT EXISTS sales_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'aadhar', 'identity', 'bank_passbook', 'selfie', 'educational_certificate'
  document_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMP,
  notes TEXT,
  UNIQUE(sales_id, document_type)
);

-- Create sales_profile_codes table
CREATE TABLE IF NOT EXISTS sales_profile_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_code VARCHAR(20) UNIQUE NOT NULL,
  documents_complete BOOLEAN DEFAULT FALSE,
  aadhar_verified BOOLEAN DEFAULT FALSE,
  identity_verified BOOLEAN DEFAULT FALSE,
  bank_verified BOOLEAN DEFAULT FALSE,
  selfie_verified BOOLEAN DEFAULT FALSE,
  educational_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sales_documents_sales_id ON sales_documents(sales_id);
CREATE INDEX IF NOT EXISTS idx_sales_documents_type ON sales_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_sales_documents_verified ON sales_documents(verified);

CREATE INDEX IF NOT EXISTS idx_sales_profile_codes_sales_id ON sales_profile_codes(sales_id);
CREATE INDEX IF NOT EXISTS idx_sales_profile_codes_code ON sales_profile_codes(profile_code);
CREATE INDEX IF NOT EXISTS idx_sales_profile_codes_complete ON sales_profile_codes(documents_complete);

-- Enable RLS
ALTER TABLE sales_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_profile_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_documents
CREATE POLICY "Sales view own documents" ON sales_documents
  FOR SELECT USING (auth.uid() = sales_id);

CREATE POLICY "Sales upload own documents" ON sales_documents
  FOR INSERT WITH CHECK (auth.uid() = sales_id);

CREATE POLICY "Sales update own documents" ON sales_documents
  FOR UPDATE USING (auth.uid() = sales_id);

CREATE POLICY "Admins view all sales documents" ON sales_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins verify sales documents" ON sales_documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for sales_profile_codes
CREATE POLICY "Sales view own profile code" ON sales_profile_codes
  FOR SELECT USING (auth.uid() = sales_id);

CREATE POLICY "Sales update own profile code" ON sales_profile_codes
  FOR UPDATE USING (auth.uid() = sales_id);

CREATE POLICY "Admins view all sales profile codes" ON sales_profile_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
