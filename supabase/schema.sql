-- ========================================
-- 88 Company 리드 관리 시스템 데이터베이스 스키마
-- Backend Architecture: Reliable data persistence with ACID compliance
-- Last Updated: 2025-09-19
-- ========================================

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- CHAT QUESTIONS TABLE
-- Dynamic chat flow questions storage
-- ========================================
CREATE TABLE IF NOT EXISTS chat_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  step VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'textarea', 'select', 'quick-reply', 'verification')),
  question TEXT NOT NULL,
  placeholder TEXT,
  options JSONB,
  validation JSONB,
  next_step VARCHAR(50),
  is_active BOOLEAN DEFAULT true NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_step ON chat_questions(step);
CREATE INDEX IF NOT EXISTS idx_questions_active ON chat_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_order ON chat_questions(order_index) WHERE is_active = true;

-- ========================================
-- LEADS TABLE
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
ALTER TABLE chat_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- chat_questions 테이블 정책 생성
-- 모든 사용자가 활성 질문을 읽을 수 있음
CREATE POLICY "Allow public read active questions" ON chat_questions
  FOR SELECT
  USING (is_active = true);

-- 익명 사용자도 질문 추가/수정 가능 (관리자 페이지용)
CREATE POLICY "Allow anonymous insert questions" ON chat_questions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update questions" ON chat_questions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anonymous delete questions" ON chat_questions
  FOR DELETE
  USING (true);

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

-- ========================================
-- DEFAULT DATA INSERTION
-- Insert default chat questions if empty
-- ========================================
INSERT INTO chat_questions (step, type, question, placeholder, options, validation, next_step, is_active, order_index)
VALUES
  ('welcome', 'select', '안녕하세요! 88 Company입니다 🚀

창업 준비부터 성장까지,
어떤 서비스가 필요하신가요?', NULL,
   '["🎯 사업계획서 작성", "📊 정부지원사업 컨설팅", "💼 세무/회계 자문", "🚀 마케팅 전략 수립", "💡 기타 문의사항"]'::jsonb,
   '{"required": true}'::jsonb, 'budget', true, 1),

  ('budget', 'select', '예산은 어느 정도로 생각하고 계신가요?', NULL,
   '["500만원 이하", "500-1000만원", "1000-3000만원", "3000만원 이상", "아직 미정"]'::jsonb,
   '{"required": true}'::jsonb, 'timeline', true, 2),

  ('timeline', 'select', '언제부터 시작하실 예정인가요?', NULL,
   '["즉시 시작", "1개월 이내", "3개월 이내", "6개월 이내", "아직 미정"]'::jsonb,
   '{"required": true}'::jsonb, 'details', true, 3),

  ('details', 'textarea', '구체적으로 어떤 도움이 필요하신지 알려주세요', '예: 온라인 쇼핑몰 창업을 준비 중인데, 정부 지원금 신청 방법이 궁금합니다.',
   NULL, '{"required": true, "minLength": 10, "maxLength": 500}'::jsonb, 'name', true, 4),

  ('name', 'text', '성함을 알려주세요', '홍길동',
   NULL, '{"required": true, "minLength": 2, "maxLength": 50}'::jsonb, 'phone', true, 5),

  ('phone', 'text', '연락 받으실 전화번호를 입력해주세요', '010-1234-5678',
   NULL, '{"required": true, "pattern": "^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$"}'::jsonb, 'complete', true, 6),

  ('complete', 'text', '🎉 등록이 완료되었습니다!

빠른 시일 내에 연락드리겠습니다.
88 Company와 함께 성공적인 창업을 시작하세요!', NULL,
   NULL, NULL, NULL, true, 7)
ON CONFLICT (step) DO NOTHING;

-- Update trigger for chat_questions
CREATE TRIGGER update_chat_questions_updated_at BEFORE UPDATE ON chat_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();