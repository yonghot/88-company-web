-- ========================================
-- leads 테이블에 학력/직업 컬럼 추가 마이그레이션
-- 목적: 새로 추가된 질문에 대한 응답 저장 컬럼 추가
-- Date: 2025-01-03
-- ========================================

-- 트랜잭션 시작
BEGIN;

-- 1. education 컬럼 추가 (학력)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS education TEXT;

-- 2. occupation 컬럼 추가 (직업)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS occupation TEXT;

-- 3. 컬럼 코멘트 추가 (문서화)
COMMENT ON COLUMN leads.education IS '질문4: 최종 학력';
COMMENT ON COLUMN leads.occupation IS '질문5: 현재 직업 상태';

-- 트랜잭션 커밋
COMMIT;

-- ========================================
-- 마이그레이션 검증 쿼리
-- ========================================
-- 실행 후 다음 쿼리로 확인:
/*
-- 컬럼 확인
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
  AND column_name IN ('education', 'occupation')
ORDER BY ordinal_position;

-- 전체 컬럼 목록 확인
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;
*/
