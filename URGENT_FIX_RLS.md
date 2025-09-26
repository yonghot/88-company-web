# 🚨 긴급 RLS 오류 해결 가이드

## 즉시 실행해야 할 작업

### 1. Supabase SQL Editor 접속
👉 **[Supabase SQL Editor 바로가기](https://tjizerpeyteokqhufqea.supabase.co/project/tjizerpeyteokqhufqea/editor)**

### 2. 다음 SQL 실행 (복사하여 붙여넣기)

```sql
-- RLS 비활성화 (즉시 해결)
ALTER TABLE verification_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_questions DISABLE ROW LEVEL SECURITY;
```

### 3. Run 버튼 클릭

### 4. 확인 테스트
```bash
cd 88-company-web
npx tsx scripts/test-live-verification.ts
```

---

## 대안: RLS 활성화 상태에서 권한 부여

더 안전한 방법을 원한다면:

```sql
-- RLS는 활성화하되 anon 사용자에게 권한 부여
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거
DROP POLICY IF EXISTS "Enable all for anon" ON verification_codes;

-- anon 사용자에게 모든 권한 부여
CREATE POLICY "Enable all for anon" ON verification_codes
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- leads 테이블도 동일 처리
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for anon" ON leads;
CREATE POLICY "Enable all for anon" ON leads
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- chat_questions 테이블도 동일 처리
ALTER TABLE chat_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for anon" ON chat_questions;
CREATE POLICY "Enable all for anon" ON chat_questions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
```

---

## 실행 후 확인 사항

✅ SQL 실행 성공 메시지 확인
✅ 테스트 스크립트 실행
✅ 프로덕션 사이트에서 SMS 인증 테스트

## 문제 지속 시 연락처

1. Supabase 대시보드에서 Table Editor 확인
2. RLS Policies 탭에서 정책 상태 확인
3. Authentication > Policies 메뉴 확인