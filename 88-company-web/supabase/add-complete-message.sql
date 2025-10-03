-- 완료 메시지를 chat_questions 테이블에 추가
-- order_index 999를 사용하여 마지막에 위치시킴

INSERT INTO chat_questions (
  order_index,
  question,
  type,
  placeholder,
  options,
  is_active,
  field_name,
  created_at,
  updated_at
) VALUES (
  999,
  E'등록이 완료되었습니다! 🎉\n\n빠른 시일 내에 88 Company에서 무료 유선 상담 연락을 드릴 예정입니다.\n\n창업 여정의 시작을 함께 하게 되어 기쁩니다.',
  'complete',
  NULL,
  NULL,
  true,
  'complete',
  NOW(),
  NOW()
)
ON CONFLICT (order_index)
DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  field_name = EXCLUDED.field_name,
  updated_at = NOW();
