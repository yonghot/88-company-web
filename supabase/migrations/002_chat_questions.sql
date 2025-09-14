-- 챗봇 질문 관리 테이블
CREATE TABLE IF NOT EXISTS chat_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  step TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('text', 'textarea', 'select', 'quick-reply', 'verification')),
  question TEXT NOT NULL,
  placeholder TEXT,
  options JSONB,
  validation JSONB,
  next_step TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 챗봇 플로우 관리 테이블
CREATE TABLE IF NOT EXISTS chat_flows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  start_step TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 질문 버전 히스토리 (선택사항)
CREATE TABLE IF NOT EXISTS chat_questions_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES chat_questions(id) ON DELETE CASCADE,
  changed_by TEXT,
  change_type TEXT CHECK (change_type IN ('create', 'update', 'delete')),
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_chat_questions_step ON chat_questions(step);
CREATE INDEX idx_chat_questions_active ON chat_questions(is_active);
CREATE INDEX idx_chat_questions_order ON chat_questions(order_index);
CREATE INDEX idx_chat_flows_active ON chat_flows(is_active);

-- RLS 정책
ALTER TABLE chat_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_questions_history ENABLE ROW LEVEL SECURITY;

-- 서비스 역할 전체 접근 권한
CREATE POLICY "Service role full access to chat_questions" ON chat_questions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to chat_flows" ON chat_flows
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to chat_questions_history" ON chat_questions_history
  FOR ALL USING (auth.role() = 'service_role');

-- 공개 읽기 권한 (anon 사용자도 질문 읽기 가능)
CREATE POLICY "Public read access to active questions" ON chat_questions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access to active flows" ON chat_flows
  FOR SELECT USING (is_active = true);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_questions_updated_at
  BEFORE UPDATE ON chat_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_flows_updated_at
  BEFORE UPDATE ON chat_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 초기 데이터 삽입
INSERT INTO chat_flows (name, start_step, description, is_active) VALUES
  ('default', 'service_type', '기본 리드 생성 플로우', true);

INSERT INTO chat_questions (step, type, question, placeholder, options, validation, next_step, order_index, is_active) VALUES
  ('service_type', 'quick-reply', '안녕하세요! 88 Company입니다 👋\n\n어떤 서비스를 찾고 계신가요?', NULL,
   '["정부지원사업 컨설팅", "프로토타입 제작", "사업계획서 작성", "기타 문의"]'::jsonb,
   '{"required": true}'::jsonb, 'service_details', 1, true),

  ('service_details', 'textarea', '구체적으로 어떤 도움이 필요하신가요?', '예: 예비창업패키지 지원을 준비 중인데, 사업계획서 작성과 프로토타입 제작이 필요합니다.',
   NULL, '{"required": true, "minLength": 10}'::jsonb, 'budget', 2, true),

  ('budget', 'select', '예상 예산은 어느 정도이신가요?', '예산 범위를 선택해주세요',
   '["88만원 이하", "88만원 ~ 200만원", "200만원 ~ 500만원", "500만원 이상", "아직 미정"]'::jsonb,
   '{"required": true}'::jsonb, 'timeline', 3, true),

  ('timeline', 'quick-reply', '프로젝트는 언제까지 완료되어야 하나요?', NULL,
   '["1개월 이내", "1-3개월", "3-6개월", "6개월 이상", "협의 가능"]'::jsonb,
   '{"required": true}'::jsonb, 'additional_info', 4, true),

  ('additional_info', 'textarea', '추가로 알려주실 내용이 있나요? (선택사항)', '추가 요구사항이나 질문을 자유롭게 작성해주세요.',
   NULL, '{"required": false}'::jsonb, 'name', 5, true),

  ('name', 'text', '성함을 알려주세요.', '홍길동',
   NULL, '{"required": true, "minLength": 2}'::jsonb, 'phone', 6, true),

  ('phone', 'verification', '연락 가능한 휴대폰 번호를 입력해주세요.', '010-1234-5678',
   NULL, '{"required": true, "pattern": "^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$"}'::jsonb, 'complete', 7, true),

  ('complete', 'text', '🎉 등록이 완료되었습니다!\n\n빠른 시일 내에 연락드리겠습니다.\n88 Company와 함께 성공적인 창업을 시작하세요!', NULL,
   NULL, NULL, NULL, 8, true);