# 🚀 Supabase 데이터베이스 설정 가이드

88 Company 리드 관리 시스템을 Supabase로 마이그레이션하는 방법을 안내합니다.

## 📋 목차
1. [Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
2. [테이블 스키마 설정](#2-테이블-스키마-설정)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [데이터 마이그레이션](#4-데이터-마이그레이션)
5. [테스트 및 확인](#5-테스트-및-확인)

## 1. Supabase 프로젝트 생성

### 1.1 Supabase 계정 생성
1. [Supabase](https://app.supabase.com) 웹사이트 접속
2. GitHub 계정으로 로그인 또는 이메일로 회원가입

### 1.2 새 프로젝트 생성
1. "New Project" 버튼 클릭
2. 프로젝트 정보 입력:
   - **Name**: `88-company` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정 (잘 기억해두세요!)
   - **Region**: `Seoul (ap-northeast-2)` 선택 (한국 서버)
3. "Create new project" 클릭

### 1.3 프로젝트 생성 대기
- 프로젝트 생성에 약 2-3분 소요됩니다
- 생성 완료 후 대시보드로 자동 이동

## 2. 테이블 스키마 설정

### 2.1 SQL Editor 접속
1. 왼쪽 사이드바에서 "SQL Editor" 클릭
2. "+ New query" 버튼 클릭

### 2.2 스키마 실행
1. 이 저장소의 `supabase/schema.sql` 파일 내용을 복사
2. SQL Editor에 붙여넣기
3. "Run" 버튼 클릭 (또는 Ctrl+Enter)

### 2.3 실행 확인
- "Success. No rows returned" 메시지 확인
- 왼쪽 사이드바 "Table Editor"에서 `leads` 테이블 생성 확인

## 3. 환경 변수 설정

### 3.1 API 키 확인
1. Supabase 대시보드에서 "Settings" → "API" 클릭
2. 다음 정보를 확인:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGci...` (긴 문자열)

### 3.2 .env.local 파일 설정
프로젝트 루트(`88-company-web/`)에 `.env.local` 파일 생성 또는 수정:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here

# SMS Provider (현재 데모 모드)
SMS_PROVIDER=demo
```

⚠️ **중요**:
- `your-project-id`와 `your-anon-public-key-here`를 실제 값으로 교체
- `.env.local` 파일은 절대 Git에 커밋하지 마세요!

## 4. 데이터 마이그레이션

### 4.1 기존 데이터 확인
```bash
# data/leads.json 파일이 있는지 확인
ls data/
```

### 4.2 마이그레이션 스크립트 실행
```bash
# 의존성 설치 (처음 한 번만)
npm install

# 마이그레이션 실행
node scripts/migrate-to-supabase.js
```

### 4.3 마이그레이션 결과 확인
스크립트가 다음과 같은 정보를 표시합니다:
- 마이그레이션된 리드 수
- 성공/실패 건수
- 백업 파일 경로

## 5. 테스트 및 확인

### 5.1 개발 서버 재시작
```bash
# 개발 서버 종료 (Ctrl+C)
# 개발 서버 재시작
npm run dev
```

### 5.2 기능 테스트

#### 챗봇 테스트
1. http://localhost:3000 접속
2. 챗봇으로 새 리드 생성
3. 모든 단계 완료

#### 관리자 페이지 테스트
1. http://localhost:3000/admin 접속
2. 리드 목록 확인
3. 필터링 및 검색 테스트
4. Excel 다운로드 테스트
5. 리드 삭제 테스트

### 5.3 Supabase 대시보드 확인
1. Supabase 대시보드에서 "Table Editor" → "leads" 클릭
2. 데이터가 정상적으로 저장되었는지 확인

## 🔧 문제 해결

### Supabase 연결 오류
- 환경 변수가 올바르게 설정되었는지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인
- API 키가 정확한지 다시 확인

### 테이블 생성 오류
- SQL 구문 오류가 있는지 확인
- 이미 테이블이 존재하는 경우 먼저 삭제 후 재생성

### 마이그레이션 실패
- `data/leads.json` 파일 형식이 올바른지 확인
- Supabase 테이블 스키마와 데이터 구조가 일치하는지 확인

## 📊 데이터베이스 구조

### leads 테이블
| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| id | TEXT | 고유 ID (전화번호 하이픈 제거) |
| service | TEXT | 서비스 유형 |
| budget | TEXT | 예산 범위 |
| timeline | TEXT | 프로젝트 시작 시기 |
| message | TEXT | 상세 내용 |
| name | TEXT | 고객 이름 |
| phone | TEXT | 전화번호 (하이픈 포함) |
| verified | BOOLEAN | 전화번호 인증 여부 |
| details | TEXT | 기타 문의 상세내용 |
| created_at | TIMESTAMP | 생성일시 |
| updated_at | TIMESTAMP | 수정일시 |

## 🎉 완료!

축하합니다! 이제 88 Company 리드 관리 시스템이 Supabase와 연동되었습니다.

### 다음 단계
- [ ] 프로덕션 배포 시 Vercel 환경 변수 설정
- [ ] Row Level Security (RLS) 정책 강화
- [ ] 백업 및 복구 전략 수립
- [ ] 실시간 기능 추가 (Supabase Realtime)

### 유용한 링크
- [Supabase 문서](https://supabase.com/docs)
- [Supabase JavaScript 클라이언트](https://supabase.com/docs/reference/javascript/introduction)
- [88 Company GitHub](https://github.com/yonghot/88-company-web)

---

*문제가 발생하거나 도움이 필요하면 이슈를 생성해주세요!*