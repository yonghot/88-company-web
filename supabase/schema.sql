-- ========================================
-- 88 Company 리드 관리 시스템 데이터베이스 스키마
-- ========================================

-- leads 테이블 생성 (리드 정보 저장)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,           -- 전화번호 (하이픈 제거된 형태) as ID
  service TEXT,                  -- 서비스 유형
  budget TEXT,                   -- 예산 범위
  timeline TEXT,                 -- 프로젝트 시작 시기
  message TEXT,                  -- 상세 내용/추가 정보
  name TEXT,                     -- 고객 이름
  phone TEXT,                    -- 전화번호 (하이픈 포함 원본)
  verified BOOLEAN DEFAULT FALSE, -- 전화번호 인증 여부
  details TEXT,                  -- 기타 문의 상세내용 (customService)
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

-- leads 테이블 정책 생성
-- 익명 사용자도 리드 삽입 가능 (폼 제출용)
CREATE POLICY "Allow anonymous insert" ON leads
  FOR INSERT
  WITH CHECK (true);

-- 익명 사용자도 리드 조회 가능 (현재 관리자 페이지가 인증 없이 작동)
CREATE POLICY "Allow anonymous select" ON leads
  FOR SELECT
  USING (true);

-- 익명 사용자도 리드 업데이트 가능 (중복 제출 시 업데이트)
CREATE POLICY "Allow anonymous update" ON leads
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 익명 사용자도 리드 삭제 가능 (관리자 페이지에서)
CREATE POLICY "Allow anonymous delete" ON leads
  FOR DELETE
  USING (true);

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