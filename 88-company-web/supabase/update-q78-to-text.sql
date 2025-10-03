-- 7, 8번 질문의 타입을 select에서 text로 변경
-- step_7: 최종 학력과 전공
-- step_8: 현재 직업 상태

-- step_7 (최종 학력과 전공) 타입 변경
UPDATE chat_questions
SET
  type = 'text',
  options = NULL,
  updated_at = NOW()
WHERE step_id = 'step_7';

-- step_8 (현재 직업 상태) 타입 변경
UPDATE chat_questions
SET
  type = 'text',
  options = NULL,
  updated_at = NOW()
WHERE step_id = 'step_8';

-- 변경 결과 확인
SELECT step_id, question, type, options, order_index
FROM chat_questions
WHERE step_id IN ('step_7', 'step_8')
ORDER BY order_index;
