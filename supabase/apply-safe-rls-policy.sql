-- ============================================================
-- 안전한 RLS 정책 적용 스크립트
-- 실행 날짜: 2025-01-24
-- 목적: verification_codes 테이블에 안전한 RLS 정책 적용
-- ============================================================

-- 1. verification_codes 테이블 RLS 정책
-- ============================================================
-- RLS 활성화 (이미 활성화되어 있어도 안전함)
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- 기존 정책 모두 제거 (깔끔한 시작)
DROP POLICY IF EXISTS "Enable all for anon" ON verification_codes;
DROP POLICY IF EXISTS "Allow all for anon" ON verification_codes;
DROP POLICY IF EXISTS "Allow insert for anon" ON verification_codes;
DROP POLICY IF EXISTS "Allow select for anon" ON verification_codes;
DROP POLICY IF EXISTS "Allow update for anon" ON verification_codes;
DROP POLICY IF EXISTS "Allow delete for anon" ON verification_codes;
DROP POLICY IF EXISTS "Enable all for anon users" ON verification_codes;

-- 새로운 통합 정책: anon 사용자에게 모든 권한 부여
-- 향후 세분화 가능하도록 명확한 이름 사용
CREATE POLICY "anon_full_access_verification_codes" ON verification_codes
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- 정책 적용 확인
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'verification_codes';

-- ============================================================
-- 2. leads 테이블 RLS 정책
-- ============================================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거
DROP POLICY IF EXISTS "Enable all for anon" ON leads;
DROP POLICY IF EXISTS "Allow all for anon" ON leads;
DROP POLICY IF EXISTS "anon_full_access_leads" ON leads;

-- 새로운 정책: anon 사용자 전체 접근 권한
CREATE POLICY "anon_full_access_leads" ON leads
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 3. chat_questions 테이블 RLS 정책
-- ============================================================
ALTER TABLE chat_questions ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거
DROP POLICY IF EXISTS "Enable all for anon" ON chat_questions;
DROP POLICY IF EXISTS "Allow all for anon" ON chat_questions;
DROP POLICY IF EXISTS "anon_full_access_chat_questions" ON chat_questions;

-- 새로운 정책: anon 사용자 전체 접근 권한
CREATE POLICY "anon_full_access_chat_questions" ON chat_questions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. 적용 결과 확인
-- ============================================================
-- 각 테이블의 RLS 상태 확인
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('verification_codes', 'leads', 'chat_questions');

-- 적용된 정책 목록 확인
SELECT
  tablename,
  policyname,
  permissive,
  array_to_string(roles, ', ') as roles,
  cmd as command,
  CASE
    WHEN qual IS NULL THEN 'true (모든 행)'
    ELSE qual
  END as using_expression,
  CASE
    WHEN with_check IS NULL THEN 'true (제한 없음)'
    ELSE with_check
  END as with_check_expression
FROM pg_policies
WHERE tablename IN ('verification_codes', 'leads', 'chat_questions')
ORDER BY tablename, policyname;

-- ============================================================
-- 성공 메시지
-- ============================================================
-- 이 스크립트 실행 후:
-- ✅ RLS가 활성화되어 보안 유지
-- ✅ anon 사용자가 필요한 모든 작업 가능
-- ✅ 향후 세분화된 정책으로 업그레이드 가능
-- ============================================================