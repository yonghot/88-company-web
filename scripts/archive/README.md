# 아카이브 스크립트

이 디렉토리에는 현재 사용하지 않지만 향후 참고용으로 보관하는 스크립트들이 있습니다.

## 📁 파일 목록

### 마이그레이션 관련
- **`execute-with-access-token.ts`** - Supabase Management API를 통한 DDL 실행 스크립트
  - is_active 컬럼 제거 시 성공한 방법
  - Personal Access Token 필요
  - 향후 DDL 마이그레이션 시 참고

- **`MIGRATION_GUIDE.md`** - 마이그레이션 가이드
  - Supabase DDL 실행 방법 3가지
  - Dashboard, CLI, Management API 가이드

### 진단 및 수정 도구
- **`diagnose-nhn-api.ts`** - NHN Cloud SMS API 진단 도구
  - API 연결 상태 확인
  - 발신번호 포맷 검증
  - 프로덕션 환경 디버깅용

- **`fix-supabase-rls.ts`** - Supabase RLS 정책 수정 스크립트
  - Row Level Security 문제 해결
  - 필요시 RLS 정책 재적용

### 유틸리티
- **`reorder-leads-columns.ts`** - leads 테이블 컬럼 순서 변경
  - 데이터베이스 스키마 정리용
  - 필요시 사용

- **`switch-to-demo-sms.ts`** - SMS 프로바이더 전환
  - Demo 모드로 빠른 전환
  - 개발 환경 설정용

## 📝 사용 방법

필요한 스크립트가 있다면:
```bash
# archive 디렉토리에서 복사
cp scripts/archive/[script-name].ts scripts/

# 실행
npx tsx scripts/[script-name].ts
```

## ⚠️ 주의사항

- 이 스크립트들은 특정 상황에서만 필요합니다
- 실행 전 반드시 백업하세요
- 프로덕션 환경에서는 신중히 사용하세요
