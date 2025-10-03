-- verification_codes 테이블의 RLS 정책 수정
-- RLS를 비활성화하거나 적절한 정책을 추가

-- Option 1: RLS 비활성화 (개발/테스트용 - 권장)
ALTER TABLE verification_codes DISABLE ROW LEVEL SECURITY;

-- Option 2: RLS 정책 추가 (프로덕션용)
-- RLS를 활성화하되 anon 사용자에게 필요한 권한 부여
-- ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
--
-- -- 기존 정책 삭제
-- DROP POLICY IF EXISTS "Allow anonymous insert" ON verification_codes;
-- DROP POLICY IF EXISTS "Allow anonymous select" ON verification_codes;
-- DROP POLICY IF EXISTS "Allow anonymous update" ON verification_codes;
-- DROP POLICY IF EXISTS "Allow anonymous delete" ON verification_codes;
--
-- -- 익명 사용자에게 INSERT 권한 부여
-- CREATE POLICY "Allow anonymous insert" ON verification_codes
--   FOR INSERT
--   TO anon
--   WITH CHECK (true);
--
-- -- 익명 사용자에게 SELECT 권한 부여 (자신의 전화번호만)
-- CREATE POLICY "Allow anonymous select" ON verification_codes
--   FOR SELECT
--   TO anon
--   USING (true);
--
-- -- 익명 사용자에게 UPDATE 권한 부여 (자신의 전화번호만)
-- CREATE POLICY "Allow anonymous update" ON verification_codes
--   FOR UPDATE
--   TO anon
--   USING (true)
--   WITH CHECK (true);
--
-- -- 익명 사용자에게 DELETE 권한 부여 (자신의 전화번호만)
-- CREATE POLICY "Allow anonymous delete" ON verification_codes
--   FOR DELETE
--   TO anon
--   USING (true);

-- leads 테이블도 동일하게 처리
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- chat_questions 테이블도 동일하게 처리 (이미 비활성화되어 있을 수 있음)
ALTER TABLE chat_questions DISABLE ROW LEVEL SECURITY;