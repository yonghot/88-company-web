-- ========================================
-- chat_questions 테이블에서 is_active 컬럼 제거
-- 이유: 정적 로딩 방식으로 전환하여 불필요
-- 데이터베이스에 있는 모든 질문은 활성화된 것으로 간주
-- ========================================

-- 1. is_active 관련 인덱스 삭제
DROP INDEX IF EXISTS idx_questions_active;
DROP INDEX IF EXISTS idx_questions_order;

-- 2. RLS 정책 삭제 및 재생성 (is_active 조건 제거)
DROP POLICY IF EXISTS "Allow public read active questions" ON chat_questions;

-- 모든 사용자가 모든 질문을 읽을 수 있음
CREATE POLICY "Allow public read questions" ON chat_questions
  FOR SELECT
  USING (true);

-- 3. is_active 컬럼 삭제
ALTER TABLE chat_questions DROP COLUMN IF EXISTS is_active;

-- 4. 새로운 인덱스 생성 (is_active 조건 제거)
CREATE INDEX idx_questions_order ON chat_questions(order_index);

-- 5. 결과 확인
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'chat_questions'
ORDER BY ordinal_position;
