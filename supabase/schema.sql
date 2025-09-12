-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY, -- phone number as ID
  service TEXT NOT NULL,
  budget TEXT NOT NULL,
  timeline TEXT NOT NULL,
  message TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create verification_codes table for phone verification
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for leads table
-- Allow anonymous users to insert leads (for form submission)
CREATE POLICY "Allow anonymous insert" ON leads
  FOR INSERT 
  WITH CHECK (true);

-- Allow authenticated users to view all leads (for admin)
CREATE POLICY "Allow authenticated select" ON leads
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete leads (for admin)
CREATE POLICY "Allow authenticated delete" ON leads
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create policies for verification_codes table
-- Allow anonymous users to insert and select verification codes
CREATE POLICY "Allow anonymous access" ON verification_codes
  FOR ALL
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at column
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes 
  WHERE expires_at < TIMEZONE('utc', NOW());
END;
$$ language 'plpgsql';