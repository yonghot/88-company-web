-- ========================================
-- Lead 테이블 컬럼 수정 마이그레이션
-- 목적: 질문 step 이름과 컬럼명을 일치시켜 데이터 저장 로직 단순화
-- Date: 2025-01-27
-- ========================================

-- 1. 기존 컬럼 이름 변경 및 새 컬럼 추가
ALTER TABLE leads
  RENAME COLUMN service TO welcome;

ALTER TABLE leads
  RENAME COLUMN message TO custom_service;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS details TEXT;

-- 2. 컬럼 순서 정리를 위한 코멘트 추가
COMMENT ON COLUMN leads.welcome IS '서비스 유형 선택 (welcome step)';
COMMENT ON COLUMN leads.custom_service IS '기타 문의 상세 내용 (customService step)';
COMMENT ON COLUMN leads.budget IS '예산 범위 (budget step)';
COMMENT ON COLUMN leads.timeline IS '프로젝트 시작 시기 (timeline step)';
COMMENT ON COLUMN leads.details IS '추가 상세사항 (details step)';
COMMENT ON COLUMN leads.name IS '고객 이름 (name step)';
COMMENT ON COLUMN leads.phone IS '전화번호 (phone step)';
COMMENT ON COLUMN leads.verified IS '전화번호 인증 여부';

-- 3. 인덱스 재생성 (필요한 경우)
-- 기존 인덱스는 유지됨

-- 4. 트리거 확인 (updated_at 자동 업데이트는 계속 작동)
-- 기존 트리거는 컬럼명 변경에 영향받지 않음

-- ========================================
-- 실행 후 확인 쿼리
-- ========================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'leads'
-- ORDER BY ordinal_position;