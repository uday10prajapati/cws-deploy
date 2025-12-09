-- Washer Documents Upload System Schema

-- Create washer_documents table
CREATE TABLE IF NOT EXISTS washer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  washer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'aadhar', 'pancard', 'votercard', 'bankpassbook', 'profile_pic'
  document_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMP,
  notes TEXT,
  UNIQUE(washer_id, document_type)
);

-- Create washer_profile_code table
CREATE TABLE IF NOT EXISTS washer_profile_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  washer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_code VARCHAR(20) UNIQUE NOT NULL,
  documents_complete BOOLEAN DEFAULT FALSE,
  aadhar_verified BOOLEAN DEFAULT FALSE,
  identity_verified BOOLEAN DEFAULT FALSE,
  bank_verified BOOLEAN DEFAULT FALSE,
  profile_pic_uploaded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_washer_documents_washer_id ON washer_documents(washer_id);
CREATE INDEX IF NOT EXISTS idx_washer_documents_type ON washer_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_washer_documents_verified ON washer_documents(verified);

CREATE INDEX IF NOT EXISTS idx_washer_profile_codes_washer_id ON washer_profile_codes(washer_id);
CREATE INDEX IF NOT EXISTS idx_washer_profile_codes_code ON washer_profile_codes(profile_code);
CREATE INDEX IF NOT EXISTS idx_washer_profile_codes_complete ON washer_profile_codes(documents_complete);

-- Enable RLS
ALTER TABLE washer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE washer_profile_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for washer_documents
CREATE POLICY "Washers view own documents" ON washer_documents
  FOR SELECT USING (auth.uid() = washer_id);

CREATE POLICY "Washers upload own documents" ON washer_documents
  FOR INSERT WITH CHECK (auth.uid() = washer_id);

CREATE POLICY "Washers update own documents" ON washer_documents
  FOR UPDATE USING (auth.uid() = washer_id);

CREATE POLICY "Admins view all documents" ON washer_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins verify documents" ON washer_documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for washer_profile_codes
CREATE POLICY "Washers view own profile code" ON washer_profile_codes
  FOR SELECT USING (auth.uid() = washer_id);

CREATE POLICY "Washers update own profile code" ON washer_profile_codes
  FOR UPDATE USING (auth.uid() = washer_id);

CREATE POLICY "Admins view all profile codes" ON washer_profile_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
