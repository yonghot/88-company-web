# is_active 컬럼 제거 마이그레이션 가이드

## 문제 분석

Supabase 클라이언트 라이브러리로는 **DDL(Data Definition Language)** 명령어를 실행할 수 없습니다.
- ✅ DML (INSERT, UPDATE, DELETE) - 가능
- ❌ DDL (ALTER TABLE, DROP COLUMN) - 불가능

## 해결 방법 (3가지)

### 방법 1: Supabase Dashboard 사용 ⭐⭐⭐ (권장)

**소요 시간: 10초**

1. https://app.supabase.com/project/tjizerpeyteokqhufqea/sql 접속
2. 아래 SQL을 복사하여 붙여넣기
3. **Run** 버튼 클릭

```sql
-- 1. 인덱스 삭제
DROP INDEX IF EXISTS idx_questions_active;
DROP INDEX IF EXISTS idx_questions_order;

-- 2. RLS 정책 업데이트
DROP POLICY IF EXISTS "Allow public read active questions" ON chat_questions;
CREATE POLICY "Allow public read questions" ON chat_questions
  FOR SELECT USING (true);

-- 3. is_active 컬럼 삭제
ALTER TABLE chat_questions DROP COLUMN IF EXISTS is_active;

-- 4. 새 인덱스 생성
CREATE INDEX idx_questions_order ON chat_questions(order_index);

-- 5. 확인
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'chat_questions' ORDER BY ordinal_position;
```

---

### 방법 2: Supabase CLI 사용 ⭐⭐

**소요 시간: 1분 (초기 설정) + 10초 (실행)**

#### 초기 설정 (한 번만)

```bash
# Supabase 로그인
npx supabase login

# 프로젝트 링크
npx supabase link --project-ref tjizerpeyteokqhufqea
```

#### 마이그레이션 실행

```bash
# 마이그레이션 푸시
npx supabase db push
```

---

### 방법 3: Management API + Personal Access Token ⭐

**소요 시간: 2분 (토큰 생성) + 5초 (실행)**

#### 1. Personal Access Token 생성

1. https://app.supabase.com/account/tokens 접속
2. **Generate new token** 클릭
3. 이름 입력 (예: "migration-token")
4. 토큰 복사

#### 2. 환경 변수 추가

`.env.local` 파일에 추가:
```env
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxxx
```

#### 3. 스크립트 실행

```bash
npx tsx scripts/execute-with-access-token.ts
```

---

## 권장 사항

- **일회성 작업**: 방법 1 (Dashboard) 사용
- **반복적인 마이그레이션**: 방법 2 (CLI) 설정 후 사용
- **자동화 필요**: 방법 3 (API) 사용

## 현재 상태

✅ TypeScript 코드 수정 완료
✅ 마이그레이션 SQL 준비 완료
⏳ 데이터베이스 실행 대기 중

SQL 실행 후 즉시 반영됩니다! 🚀
