# SMS 인증 시스템 수정 가이드

## 1. Supabase RLS 정책 수정 (필수!)

### Supabase 대시보드에서 SQL 실행
1. [Supabase 대시보드](https://tjizerpeyteokqhufqea.supabase.co) 접속
2. **SQL Editor** 클릭
3. **New Query** 버튼 클릭
4. 다음 SQL 붙여넣기:

```sql
-- RLS 비활성화 (개발/테스트용)
ALTER TABLE verification_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_questions DISABLE ROW LEVEL SECURITY;
```

5. **Run** 버튼 클릭
6. 성공 메시지 확인

## 2. 로컬 테스트

RLS 수정 후 로컬에서 테스트:

```bash
# 개발 서버가 실행 중인지 확인
cd 88-company-web

# 개발 서버 재시작
npx kill-port 3000
npm run dev

# 다른 터미널에서 테스트 실행
npx tsx scripts/test-local-verification.ts
```

성공적인 결과:
- ✅ 발송 성공
- ✅ 인증 성공!
- ✅ 잘못된 코드 거부 - 정상

## 3. 프로덕션 배포

### Vercel 배포
```bash
# 빌드 테스트
npm run build

# Vercel에 배포
npx vercel --prod
```

### 배포 후 프로덕션 테스트
```bash
npx tsx scripts/test-live-verification.ts
```

## 4. 수정된 내용 요약

### 코드 변경사항
1. **verification-service.ts**
   - `attempts` 필드 제거 (DB에 컬럼 없음)
   - `.single()` 제거하고 배열 처리로 변경
   - 문자열 변환 및 공백 제거 추가
   - 상세한 디버깅 로그 추가

2. **test-production-api.ts**
   - TypeScript 타입 에러 수정
   - Error 인스턴스 체크 추가

### 데이터베이스 변경사항
1. **verification_codes 테이블**
   - RLS 비활성화 필요
   - attempts 컬럼 없음 (코드에서 제거됨)

## 5. 문제 해결 체크리스트

- [ ] Supabase RLS 정책 수정 완료
- [ ] 로컬 테스트 통과
- [ ] 빌드 성공
- [ ] Vercel 배포 완료
- [ ] 프로덕션 테스트 통과

## 6. 연락처

문제 발생 시:
1. 먼저 개발 서버 로그 확인
2. Supabase 대시보드에서 테이블 데이터 확인
3. `scripts/test-local-verification.ts` 실행해서 상세 오류 확인