-- ========================================
-- chat_questions 테이블에서 step, next_step 컬럼 제거
-- 이유: order_index만으로 순서 관리하도록 단순화
-- step 대신 step_{order_index} 형식의 동적 ID 사용
-- ========================================

-- 1. 기존 인덱스 확인 및 삭제 (step 컬럼 관련)
DROP INDEX IF EXISTS idx_questions_step;

-- 2. step, next_step 컬럼 삭제
ALTER TABLE chat_questions DROP COLUMN IF EXISTS step;
ALTER TABLE chat_questions DROP COLUMN IF EXISTS next_step;

-- 3. type 컬럼에 'phone' 타입 추가 (이미 있을 수 있음)
-- 참고: 기존 타입에 phone이 없다면 추가 필요
-- PostgreSQL에서는 ENUM 타입 수정이 복잡하므로 VARCHAR로 관리

-- 4. 결과 확인
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'chat_questions'
ORDER BY ordinal_position;
