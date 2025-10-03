-- ========================================
-- leads 테이블 컬럼 순서 재정렬 마이그레이션
-- 목적: 중요한 필드를 앞으로 배치하여 가독성과 관리 효율성 향상
-- Date: 2025-09-27
-- 새로운 순서: [name, phone, 질문1-4 응답, 기타 컬럼들]
-- ========================================

-- 1. 백업 테이블 생성
CREATE TABLE IF NOT EXISTS leads_backup AS
SELECT * FROM leads;

-- 2. 기존 테이블 삭제 (CASCADE로 관련 제약조건도 함께 삭제)
DROP TABLE IF EXISTS leads CASCADE;

-- 3. 새로운 컬럼 순서로 테이블 재생성
CREATE TABLE leads (
  -- 기본 식별 정보
  id TEXT PRIMARY KEY,                      -- 전화번호 (하이픈 제거된 형태) as ID

  -- 핵심 고객 정보 (최우선)
  name TEXT,                                -- 고객 이름
  phone TEXT,                               -- 전화번호 (하이픈 포함 원본)

  -- 첫 4개 질문에 대한 응답 (사용자 요청사항)
  welcome TEXT,                             -- 1번 질문: 서비스 선택 (구 service)
  business_status TEXT,                     -- 2번 질문: 사업자등록 상태
  pre_startup_package TEXT,                 -- 3번 질문: 예비창업패키지 인지도
  gov_support_knowledge TEXT,               -- 4번 질문: 정부지원사업 지식 수준

  -- 추가 질문 응답
  budget TEXT,                              -- 예산 범위
  timeline TEXT,                            -- 프로젝트 시작 시기
  details TEXT,                             -- 상세 요구사항
  custom_service TEXT,                      -- 기타 문의 상세내용 (구 message)

  -- 시스템 필드
  verified BOOLEAN DEFAULT FALSE,           -- 전화번호 인증 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. 백업에서 데이터 복원 (컬럼 매핑)
INSERT INTO leads (
  id,
  name,
  phone,
  welcome,                    -- service 컬럼을 welcome으로 매핑
  business_status,            -- 새 컬럼 (NULL로 초기화됨)
  pre_startup_package,        -- 새 컬럼 (NULL로 초기화됨)
  gov_support_knowledge,      -- 새 컬럼 (NULL로 초기화됨)
  budget,
  timeline,
  details,
  custom_service,             -- message 컬럼을 custom_service로 매핑
  verified,
  created_at,
  updated_at
)
SELECT
  id,
  name,
  phone,
  COALESCE(welcome, service),           -- welcome 컬럼이 있으면 사용, 없으면 service 사용
  NULL AS business_status,              -- 새 컬럼
  NULL AS pre_startup_package,          -- 새 컬럼
  NULL AS gov_support_knowledge,        -- 새 컬럼
  budget,
  timeline,
  details,
  COALESCE(custom_service, message),    -- custom_service가 있으면 사용, 없으면 message 사용
  verified,
  created_at,
  updated_at
FROM leads_backup;

-- 5. 인덱스 재생성
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_name ON leads(name);
CREATE INDEX IF NOT EXISTS idx_leads_verified ON leads(verified);

-- 6. Row Level Security 재활성화
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책 재적용
-- 익명 사용자도 리드 삽입 가능 (폼 제출용)
CREATE POLICY "Allow anonymous insert" ON leads
  FOR INSERT
  WITH CHECK (true);

-- 익명 사용자도 리드 조회 가능 (현재 관리자 페이지가 인증 없이 작동)
CREATE POLICY "Allow anonymous select" ON leads
  FOR SELECT
  USING (true);

-- 익명 사용자도 리드 수정 가능 (인증 상태 업데이트용)
CREATE POLICY "Allow anonymous update" ON leads
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 8. 컬럼 코멘트 추가 (문서화)
COMMENT ON COLUMN leads.id IS '고유 식별자 (전화번호 기반)';
COMMENT ON COLUMN leads.name IS '고객 성명';
COMMENT ON COLUMN leads.phone IS '연락처 전화번호';
COMMENT ON COLUMN leads.welcome IS '질문1: 초기 서비스 선택';
COMMENT ON COLUMN leads.business_status IS '질문2: 현재 사업자등록 상태';
COMMENT ON COLUMN leads.pre_startup_package IS '질문3: 예비창업패키지 인지도';
COMMENT ON COLUMN leads.gov_support_knowledge IS '질문4: 정부지원사업 지식 수준';
COMMENT ON COLUMN leads.budget IS '희망 예산 범위';
COMMENT ON COLUMN leads.timeline IS '프로젝트 시작 예정 시기';
COMMENT ON COLUMN leads.details IS '추가 상세 요구사항';
COMMENT ON COLUMN leads.custom_service IS '기타 문의 상세내용';
COMMENT ON COLUMN leads.verified IS '전화번호 인증 완료 여부';
COMMENT ON COLUMN leads.created_at IS '리드 생성 시간';
COMMENT ON COLUMN leads.updated_at IS '마지막 수정 시간';

-- 9. 트리거 재생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 마이그레이션 검증 쿼리
-- ========================================
-- 실행 후 다음 쿼리로 확인:
/*
-- 컬럼 순서 확인
SELECT
  column_name,
  ordinal_position,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- 데이터 개수 확인
SELECT
  (SELECT COUNT(*) FROM leads) as new_count,
  (SELECT COUNT(*) FROM leads_backup) as backup_count;

-- 백업 테이블 삭제 (확인 후)
-- DROP TABLE IF EXISTS leads_backup;
*/