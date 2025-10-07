-- Add welcome message as order_index=0
-- This message will be displayed before the first question
-- It does not require user input and won't be counted in progress

INSERT INTO chat_questions (
  order_index,
  question,
  type,
  placeholder,
  options,
  validation,
  is_active,
  created_at,
  updated_at
) VALUES (
  0,
  '안녕하세요! 88 Company입니다. 👋

예비창업자를 위한 정부지원사업 컨설팅을 도와드리고 있습니다.

📋 **간단한 질문**에 답변해주시면,
💰 **맞춤형 지원사업**을 추천해드립니다.

⏱️ 소요시간: 약 2~3분
🎯 목적: 최적의 정부지원사업 매칭

지금 바로 시작해볼까요?',
  'welcome',
  NULL,
  NULL,
  NULL,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (order_index)
DO UPDATE SET
  question = EXCLUDED.question,
  type = EXCLUDED.type,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
