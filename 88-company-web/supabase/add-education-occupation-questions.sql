-- ========================================
-- 학력/전공 및 직업 질문 추가 마이그레이션
-- 목적: 3번 질문 이후에 학력/전공(4번)과 직업(5번) 질문 추가
-- 기존 질문 4-8번은 6-10번으로 이동
-- Date: 2025-01-03
-- ========================================

-- 트랜잭션 시작
BEGIN;

-- 1. 기존 질문 4-8번의 order_index를 +2 증가 (뒤로 밀기)
UPDATE chat_questions SET order_index = 10 WHERE order_index = 8;  -- 전화번호
UPDATE chat_questions SET order_index = 9 WHERE order_index = 7;   -- 이름
UPDATE chat_questions SET order_index = 8 WHERE order_index = 6;   -- 나이
UPDATE chat_questions SET order_index = 7 WHERE order_index = 5;   -- 성별
UPDATE chat_questions SET order_index = 6 WHERE order_index = 4;   -- 지역

-- 2. 새로운 질문 추가: 학력과 전공 (order_index = 4)
INSERT INTO chat_questions (
  type,
  question,
  placeholder,
  options,
  validation,
  order_index
) VALUES (
  'select',
  '최종 학력과 전공을 선택해주세요.
*학력에 따라 지원 가능한 사업이 달라집니다.',
  NULL,
  '["고졸 이하","전문대졸","대졸 (학사)","석사","박사","재학 중","기타"]'::jsonb,
  NULL,
  4
);

-- 3. 새로운 질문 추가: 현재 직업 (order_index = 5)
INSERT INTO chat_questions (
  type,
  question,
  placeholder,
  options,
  validation,
  order_index
) VALUES (
  'select',
  '현재 직업 상태를 선택해주세요.
*직업에 따라 맞춤형 지원사업을 추천해드립니다.',
  NULL,
  '["학생","직장인 (재직 중)","프리랜서","자영업자","구직 중","주부","기타"]'::jsonb,
  NULL,
  5
);

-- 트랜잭션 커밋
COMMIT;

-- ========================================
-- 마이그레이션 검증 쿼리
-- ========================================
-- 실행 후 다음 쿼리로 확인:
/*
SELECT 
  order_index,
  type,
  LEFT(question, 50) as question_preview
FROM chat_questions
ORDER BY order_index;

-- 총 질문 수 확인 (10개여야 함)
SELECT COUNT(*) as total_questions FROM chat_questions;
*/
