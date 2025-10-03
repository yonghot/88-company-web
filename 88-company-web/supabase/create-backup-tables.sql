-- ========================================
-- 백업 테이블 생성 및 관리
-- Purpose: leads와 chat_questions 테이블의 백업 시스템 구축
-- Date: 2025-10-04
-- ========================================

-- ========================================
-- 1. LEADS BACKUP TABLE
-- ========================================

-- 기존 leads_backup 테이블이 있다면 삭제 (데이터 포함)
DROP TABLE IF EXISTS leads_backup CASCADE;

-- leads_backup 테이블 생성 (현재 leads 테이블 구조 반영)
CREATE TABLE leads_backup (
  id TEXT,                                -- 원본 리드 ID
  welcome TEXT,                           -- Q1: 예비창업자 여부
  experience TEXT,                        -- Q2: 정부지원사업 경험
  business_idea TEXT,                     -- Q3: 사업 아이템
  education TEXT,                         -- Q4: 학력/전공
  occupation TEXT,                        -- Q5: 현재 직업 상태
  region TEXT,                            -- Q6: 지역
  gender TEXT,                            -- Q7: 성별
  age TEXT,                               -- Q8: 나이
  name TEXT,                              -- Q9: 이름
  phone TEXT,                             -- Q10: 전화번호 (하이픈 포함)
  verified BOOLEAN,                       -- 전화번호 인증 여부
  original_created_at TIMESTAMP WITH TIME ZONE,  -- 원본 생성일시
  original_updated_at TIMESTAMP WITH TIME ZONE,  -- 원본 수정일시

  -- 백업 메타데이터
  backup_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  backup_reason TEXT DEFAULT 'manual_backup',
  backup_created_by TEXT DEFAULT 'system'
);

-- leads_backup 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_leads_backup_id ON leads_backup(id);
CREATE INDEX IF NOT EXISTS idx_leads_backup_phone ON leads_backup(phone);
CREATE INDEX IF NOT EXISTS idx_leads_backup_created_at ON leads_backup(backup_created_at DESC);

-- leads_backup 테이블 코멘트
COMMENT ON TABLE leads_backup IS '리드 데이터 백업 테이블 - 데이터 손실 방지 및 복구용';
COMMENT ON COLUMN leads_backup.backup_id IS '백업 고유 ID';
COMMENT ON COLUMN leads_backup.backup_created_at IS '백업 생성 시각';
COMMENT ON COLUMN leads_backup.backup_reason IS '백업 사유 (manual_backup, auto_backup, migration 등)';

-- ========================================
-- 2. CHAT QUESTIONS BACKUP TABLE
-- ========================================

-- 기존 chat_questions_backup 테이블이 있다면 삭제
DROP TABLE IF EXISTS chat_questions_backup CASCADE;

-- chat_questions_backup 테이블 생성
CREATE TABLE chat_questions_backup (
  original_id UUID,                       -- 원본 질문 ID
  type VARCHAR(20),                       -- 질문 타입
  question TEXT,                          -- 질문 내용
  placeholder TEXT,                       -- 입력 필드 플레이스홀더
  options JSONB,                          -- 선택 옵션 (select, quick-reply)
  validation JSONB,                       -- 유효성 검증 규칙
  order_index INTEGER,                    -- 질문 순서
  original_created_at TIMESTAMP WITH TIME ZONE,  -- 원본 생성일시
  original_updated_at TIMESTAMP WITH TIME ZONE,  -- 원본 수정일시

  -- 백업 메타데이터
  backup_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  backup_reason TEXT DEFAULT 'manual_backup',
  backup_created_by TEXT DEFAULT 'system'
);

-- chat_questions_backup 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_questions_backup_original_id ON chat_questions_backup(original_id);
CREATE INDEX IF NOT EXISTS idx_questions_backup_order ON chat_questions_backup(order_index);
CREATE INDEX IF NOT EXISTS idx_questions_backup_created_at ON chat_questions_backup(backup_created_at DESC);

-- chat_questions_backup 테이블 코멘트
COMMENT ON TABLE chat_questions_backup IS '챗봇 질문 데이터 백업 테이블 - 질문 수정/삭제 시 복구용';
COMMENT ON COLUMN chat_questions_backup.backup_id IS '백업 고유 ID';
COMMENT ON COLUMN chat_questions_backup.backup_created_at IS '백업 생성 시각';
COMMENT ON COLUMN chat_questions_backup.backup_reason IS '백업 사유';

-- ========================================
-- 3. RLS (Row Level Security) 설정
-- ========================================

-- leads_backup 테이블 RLS 활성화
ALTER TABLE leads_backup ENABLE ROW LEVEL SECURITY;

-- leads_backup 정책: 모든 사용자가 읽기 가능 (복구 시 필요)
CREATE POLICY "Allow public read leads backup" ON leads_backup
  FOR SELECT
  USING (true);

-- leads_backup 정책: 익명 사용자도 백업 생성 가능
CREATE POLICY "Allow anonymous insert leads backup" ON leads_backup
  FOR INSERT
  WITH CHECK (true);

-- chat_questions_backup 테이블 RLS 활성화
ALTER TABLE chat_questions_backup ENABLE ROW LEVEL SECURITY;

-- chat_questions_backup 정책: 모든 사용자가 읽기 가능
CREATE POLICY "Allow public read questions backup" ON chat_questions_backup
  FOR SELECT
  USING (true);

-- chat_questions_backup 정책: 익명 사용자도 백업 생성 가능
CREATE POLICY "Allow anonymous insert questions backup" ON chat_questions_backup
  FOR INSERT
  WITH CHECK (true);

-- ========================================
-- 4. 백업 함수 생성
-- ========================================

-- leads 테이블 전체 백업 함수
CREATE OR REPLACE FUNCTION backup_all_leads(reason TEXT DEFAULT 'manual_backup')
RETURNS INTEGER AS $$
DECLARE
  backup_count INTEGER;
BEGIN
  INSERT INTO leads_backup (
    id, welcome, experience, business_idea, education, occupation,
    region, gender, age, name, phone, verified,
    original_created_at, original_updated_at,
    backup_reason, backup_created_by
  )
  SELECT
    id, welcome, experience, business_idea, education, occupation,
    region, gender, age, name, phone, verified,
    created_at, updated_at,
    reason, 'auto_backup_function'
  FROM leads;

  GET DIAGNOSTICS backup_count = ROW_COUNT;

  RETURN backup_count;
END;
$$ LANGUAGE plpgsql;

-- chat_questions 테이블 전체 백업 함수
CREATE OR REPLACE FUNCTION backup_all_questions(reason TEXT DEFAULT 'manual_backup')
RETURNS INTEGER AS $$
DECLARE
  backup_count INTEGER;
BEGIN
  INSERT INTO chat_questions_backup (
    original_id, type, question, placeholder, options, validation, order_index,
    original_created_at, original_updated_at,
    backup_reason, backup_created_by
  )
  SELECT
    id, type, question, placeholder, options, validation, order_index,
    created_at, updated_at,
    reason, 'auto_backup_function'
  FROM chat_questions;

  GET DIAGNOSTICS backup_count = ROW_COUNT;

  RETURN backup_count;
END;
$$ LANGUAGE plpgsql;

-- 오래된 백업 정리 함수 (30일 이상)
CREATE OR REPLACE FUNCTION cleanup_old_backups(days_to_keep INTEGER DEFAULT 30)
RETURNS TABLE(leads_deleted INTEGER, questions_deleted INTEGER) AS $$
DECLARE
  leads_count INTEGER;
  questions_count INTEGER;
BEGIN
  -- leads_backup 정리
  DELETE FROM leads_backup
  WHERE backup_created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS leads_count = ROW_COUNT;

  -- chat_questions_backup 정리
  DELETE FROM chat_questions_backup
  WHERE backup_created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  GET DIAGNOSTICS questions_count = ROW_COUNT;

  RETURN QUERY SELECT leads_count, questions_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. 백업 통계 뷰 생성
-- ========================================

-- leads_backup 통계 뷰
CREATE OR REPLACE VIEW leads_backup_stats AS
SELECT
  COUNT(*) as total_backups,
  COUNT(DISTINCT id) as unique_leads,
  MIN(backup_created_at) as oldest_backup,
  MAX(backup_created_at) as latest_backup,
  COUNT(CASE WHEN backup_created_at > NOW() - INTERVAL '1 day' THEN 1 END) as backups_last_24h,
  COUNT(CASE WHEN backup_created_at > NOW() - INTERVAL '7 days' THEN 1 END) as backups_last_week
FROM leads_backup;

-- chat_questions_backup 통계 뷰
CREATE OR REPLACE VIEW questions_backup_stats AS
SELECT
  COUNT(*) as total_backups,
  COUNT(DISTINCT original_id) as unique_questions,
  MIN(backup_created_at) as oldest_backup,
  MAX(backup_created_at) as latest_backup,
  COUNT(CASE WHEN backup_created_at > NOW() - INTERVAL '1 day' THEN 1 END) as backups_last_24h,
  COUNT(CASE WHEN backup_created_at > NOW() - INTERVAL '7 days' THEN 1 END) as backups_last_week
FROM chat_questions_backup;

-- ========================================
-- 완료 메시지
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '백업 테이블 생성 완료!';
  RAISE NOTICE '- leads_backup 테이블: ✓';
  RAISE NOTICE '- chat_questions_backup 테이블: ✓';
  RAISE NOTICE '- 백업 함수: backup_all_leads(), backup_all_questions()';
  RAISE NOTICE '- 정리 함수: cleanup_old_backups(days_to_keep)';
  RAISE NOTICE '- 통계 뷰: leads_backup_stats, questions_backup_stats';
  RAISE NOTICE '';
  RAISE NOTICE '사용 예시:';
  RAISE NOTICE '  SELECT backup_all_leads(''manual_backup'');';
  RAISE NOTICE '  SELECT backup_all_questions(''before_migration'');';
  RAISE NOTICE '  SELECT * FROM leads_backup_stats;';
  RAISE NOTICE '  SELECT cleanup_old_backups(30);';
END $$;
