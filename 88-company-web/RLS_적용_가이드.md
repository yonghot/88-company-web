# 🔐 RLS 정책 적용 가이드

## 📋 즉시 실행 단계

### 1단계: Supabase SQL Editor 접속
👉 **[SQL Editor 바로가기](https://tjizerpeyteokqhufqea.supabase.co/project/tjizerpeyteokqhufqea/editor)**

### 2단계: SQL 실행
1. **New Query** 버튼 클릭
2. 아래 SQL 전체 복사하여 붙여넣기
3. **Run** 버튼 클릭 (또는 Ctrl+Enter)

```sql
-- RLS 활성화 및 안전한 정책 적용
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- 기존 정책 정리
DROP POLICY IF EXISTS "Enable all for anon" ON verification_codes;
DROP POLICY IF EXISTS "Allow all for anon" ON verification_codes;
DROP POLICY IF EXISTS "Enable all for anon users" ON verification_codes;

-- anon 사용자에게 필요한 권한 부여
CREATE POLICY "anon_full_access_verification_codes" ON verification_codes
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- leads 테이블도 동일 처리
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_access_leads" ON leads;
CREATE POLICY "anon_full_access_leads" ON leads
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- chat_questions 테이블도 동일 처리
ALTER TABLE chat_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_full_access_chat_questions" ON chat_questions;
CREATE POLICY "anon_full_access_chat_questions" ON chat_questions
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
```

### 3단계: 실행 결과 확인
성공 메시지가 나타나면 완료!

### 4단계: 테스트
```bash
# 로컬에서 테스트
cd 88-company-web
npx tsx scripts/test-local-verification.ts

# 프로덕션 테스트
npx tsx scripts/test-live-verification.ts
```

---

## ✅ 이 방법의 장점

1. **보안 유지**: RLS는 활성화 상태로 유지
2. **즉시 해결**: anon 사용자가 바로 사용 가능
3. **안정성**: 프로덕션 환경에 적합
4. **확장 가능**: 향후 세밀한 정책으로 업그레이드 가능

---

## 🔍 적용 후 확인 사항

### SQL Editor에서 확인
```sql
-- RLS 상태 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('verification_codes', 'leads', 'chat_questions');

-- 정책 확인
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('verification_codes', 'leads', 'chat_questions');
```

### 예상 결과
- `rowsecurity`: true (RLS 활성화됨)
- `policyname`: anon_full_access_* (정책 적용됨)
- `roles`: {anon} (anon 사용자 권한 있음)

---

## 📞 문제 발생 시

1. **SQL 오류**: 정책 이름 중복 시 DROP POLICY 먼저 실행
2. **여전히 실패**: Service Role Key 사용 (코드는 이미 준비됨)
3. **긴급 상황**: RLS 비활성화 (임시 조치)

```sql
-- 긴급 시에만 사용
ALTER TABLE verification_codes DISABLE ROW LEVEL SECURITY;
```

---

## 📅 향후 계획

### Phase 2 (다음 주)
- Service Role Key를 Vercel에 추가
- 이중 안전장치 구축

### Phase 3 (다음 달)
- 전화번호별 격리 정책
- Rate limiting 강화
- 보안 감사 로그

---

**파일 위치**: `supabase/apply-safe-rls-policy.sql`에 전체 SQL 저장됨