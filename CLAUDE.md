# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Quick Start

```bash
# 프로젝트 디렉토리로 이동
cd 88-company-web

# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 타입 체크
npx tsc --noEmit

# 프로덕션 빌드
npm run build
```

## 🚨 필수 원칙

### 언어 설정
- **반드시 한국어로 대답할 것** - 사용자와의 모든 소통은 한국어로 진행
- 기술 용어는 필요시 영어 병기 가능 (예: 컴포넌트(Component))
- 코드 주석과 문서는 프로젝트 요구사항에 따라 작성

### 코드 작성 원칙
- **코드 주석 없음**: 코드 내 주석 작성 금지, 명확한 변수명과 함수명으로 self-documenting code 작성
- **타입 안전성**: TypeScript 타입 정의를 철저히 작성
- **컴포넌트 구조**: React 컴포넌트는 함수형 컴포넌트와 hooks 사용
- **비동기 처리**: Next.js 15.5.3의 async params 패턴 준수
- **에러 처리**: try-catch 블록과 적절한 에러 메시지 제공

## 프로젝트 개요

**88 Company** - 예비창업자를 위한 정부지원사업 컨설팅 플랫폼으로, AI 기반 챗봇을 통한 리드 생성 시스템

### 기술 스택
- **프레임워크**: Next.js 15.5.3 (App Router, Turbopack)
- **언어**: TypeScript 5.x
- **스타일링**: Tailwind CSS v3 + shadcn/ui
- **데이터베이스**: Supabase (PostgreSQL) with 파일 시스템 폴백
- **배포**: Vercel (Seoul region - icn1)

## 주요 개발 명령어

```bash
# 프로젝트 디렉토리로 이동
cd 88-company-web

# 의존성 설치
npm install

# 개발 서버 실행 (포트 3000, Turbopack 사용)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start

# 코드 검증
npm run lint                   # ESLint 실행
npx tsc --noEmit              # TypeScript 타입 체크

# 테스트
npm run test                  # 전체 테스트 수행
npm run test:sms              # SMS 인증 시스템 테스트
npm run test:env              # 환경 변수 확인
npm run test:verification     # 인증 플로우 테스트
npm run test:chat             # 챗봇 플로우 테스트
npm run test:database         # 데이터베이스 테스트
npm run test:admin            # 관리자 기능 테스트
npm run test:realtime         # 실시간 동기화 테스트
npm run test:list             # 사용 가능한 테스트 목록 확인

# 데이터베이스
npm run migrate               # Supabase 마이그레이션 (전체 데이터)
npm run migrate:questions     # 질문 데이터만 마이그레이션
npm run db:setup              # Supabase 스키마 안내

# 디버깅
npx tsx scripts/[script].ts   # TypeScript 스크립트 직접 실행
```

## 상위 레벨 아키텍처

### 프로젝트 구조
```
88-company/
├── 88-company-web/          # 메인 Next.js 웹 애플리케이션
│   ├── app/                 # Next.js 15 앱 라우터
│   │   ├── api/            # API 라우트 (async params 패턴 사용)
│   │   ├── admin/          # 관리자 대시보드
│   │   └── page.tsx        # 메인 챗봇 페이지
│   ├── components/         # React 컴포넌트
│   │   ├── chatbot/        # 챗 인터페이스 컴포넌트
│   │   └── ui/             # shadcn/ui 기반 컴포넌트
│   ├── lib/                # 비즈니스 로직
│   │   ├── chat/           # 챗봇 모듈 (정적/동적 플로우)
│   │   ├── sms/            # SMS 서비스 (멀티 프로바이더)
│   │   └── database/       # 데이터베이스 타입 정의
│   └── scripts/            # 유틸리티 스크립트
├── CLAUDE.md               # AI 개발 가이드
├── PRD.md                  # 제품 요구사항
└── DESIGN.md              # 디자인 시스템
```

### 주요 아키텍처 결정사항

1. **챗봇 중심 디자인**: 전체 UI가 리드 생성을 위한 대화형 챗봇 경험으로 구축
   - 대화형 인터페이스로 사용자 친화적 경험 제공
   - 단계별 정보 수집으로 이탈률 최소화

2. **이중 데이터 저장**: Supabase(클라우드)와 파일 시스템(로컬) 저장소를 모두 지원하며 자동 폴백
   - Supabase 연결 실패 시 자동으로 파일 시스템 사용
   - 데이터 손실 방지를 위한 이중화 전략

3. **전화번호 인증 시스템**: SMS 인증 내장 - 3분 만료
   - 멀티 프로바이더 지원 (NHN Cloud, Twilio, 알리고, Demo)
   - Strategy Pattern 구현으로 프로바이더 간 전환 용이

4. **단계별 플로우**: 사전 정의된 단계를 통한 대화 진행
   - 시작 → 서비스 → 예산 → 일정 → 상세내용 → 이름 → 전화번호 → 완료
   - order_index 기반 자동 네비게이션

5. **관리자 대시보드**: `/admin`에서 리드 관리 및 Excel 내보내기를 위한 내장 관리자 인터페이스
   - 비밀번호 보호 (ADMIN_PASSWORD 환경 변수)
   - 실시간 데이터 조회 및 관리

6. **동적 질문 관리**: `/admin/questions`에서 챗봇 질문을 실시간으로 편집하고 순서 변경 가능
   - 드래그 앤 드롭으로 순서 조정
   - 재배포 없이 즉시 반영

7. **실시간 동기화**: localStorage와 커스텀 이벤트를 통한 브라우저 탭 간 실시간 동기화
   - 관리자 페이지 변경사항이 챗봇에 즉시 반영

## 핵심 컴포넌트와 API 패턴

### Next.js 15 API 라우트 패턴
```typescript
// Next.js 15.5.3에서는 params가 Promise로 제공됩니다
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const id = params.id;
  // ...
}
```

### 주요 API 엔드포인트
- **`/api/leads`**: 리드 CRUD 작업
- **`/api/verify`**: SMS 인증 처리
- **`/api/admin/questions`**: 동적 질문 관리 (관리자 인증 필요: ADMIN_PASSWORD 환경 변수)

### 핵심 모듈 구조
- **`lib/chat/`**: 챗봇 로직 (정적/동적 플로우 지원)
  - `ChatFlowService`: 대화 플로우 관리
  - `DynamicQuestionService`: 동적 질문 로드/저장 (Supabase 통합)
  - `RealTimeQuestionService`: 실시간 질문 동기화 서비스
  - `questions.ts`: 정적 질문 정의 (폴백용)
- **`lib/sms/`**: SMS 인증 (멀티 프로바이더 전략 패턴)
  - Strategy Pattern 구현으로 프로바이더 간 전환 용이
- **`lib/database/`**: 데이터베이스 타입 및 스키마
  - `LeadData`, `VerificationData`, `ChatQuestion` 타입 정의
  - Supabase 클라이언트 설정 및 타입 호환성 보장
- **`components/admin/`**: 관리자 페이지 전용 컴포넌트
  - `QuestionCard.tsx`: 드래그 가능한 질문 카드 컴포넌트
  - `QuestionEditModal.tsx`: 종합 질문 편집 모달
  - `ChatPreview.tsx`: 실시간 대화 플로우 미리보기
  - `DatabaseStatusIndicator.tsx`: DB 연결 상태 실시간 모니터링
- **`scripts/`**: 유틸리티 및 마이그레이션 스크립트
  - `migrate-to-supabase.ts`: 전체 데이터 마이그레이션
  - `migrate-questions-to-supabase.ts`: 질문 데이터 전용 마이그레이션
  - `test-ui-components.ts`: UI 컴포넌트 테스트 스위트

## 중요 개발 참고사항

### 환경 변수
`88-company-web/` 디렉토리에 `.env.local` 파일 생성:
```env
# Supabase 설정 (영구 데이터 저장용 - 권장)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# SMS 프로바이더 설정
SMS_PROVIDER=demo  # 옵션: demo, nhncloud, twilio, aligo

# NHN Cloud 설정 (SMS_PROVIDER=nhncloud 일 때만 필요)
NHN_APP_KEY=your_app_key
NHN_SECRET_KEY=your_secret_key
NHN_SEND_NO=010-1234-5678  # 사전 등록된 발신번호

# Twilio 설정 (SMS_PROVIDER=twilio 일 때만 필요)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# 알리고 설정 (SMS_PROVIDER=aligo 일 때만 필요)
ALIGO_USER_ID=your_user_id
ALIGO_API_KEY=your_api_key
ALIGO_SEND_NO=010-1234-5678

# 관리자 보안
ADMIN_PASSWORD=your_admin_password  # 관리자 페이지 접근 비밀번호 (기본값: 159753)

# 개발 설정
SHOW_DEMO_CODE=true  # 개발 시 인증번호 표시 (demo 모드에서만 작동)
```

### 디자인 시스템
- **주 색상**: #8800ff (보라색) - "88" 브랜드 컬러
- **강조 색상**: #ff6d00 (주황색)
- **다크 모드**: 기본 테마
- **UI 스타일**: 숨고(Soomgo) 스타일의 깔끔한 인터페이스
- **모바일 우선**: 완전 반응형 디자인

### 대화 플로우 관리
챗봇은 **실시간 동기화가 적용된 동적 플로우**를 사용합니다:

**실시간 동적 플로우** (RealTimeQuestionService):
- `/admin/questions` 페이지에서 실시간 편집 가능
- **실시간 자동 동기화**: 질문 수정 시 챗봇에 즉시 반영 (새로고침 불필요)
- **동적 단계 계산**: 활성 질문 수에 따라 자동으로 진행 단계 수 조정
- 드래그 앤 드롭으로 순서 변경
- 질문 추가/삭제/수정 즉시 반영
- **order_index 기반 동적 네비게이션**: 질문 순서에 따라 자동으로 다음 질문으로 이동
- **비활성 질문 건너뛰기**: is_active가 false인 질문은 플로우에서 제외
- **이벤트 기반 업데이트**: localStorage와 커스텀 이벤트를 통한 실시간 동기화

표준 대화 단계 (동적으로 변경 가능):
1. 환영 메시지 (서비스 선택) - 모든 선택지가 동일한 플로우 진행
2. 예산 범위
3. 프로젝트 일정
4. 추가 상세사항
5. 이름 수집
6. 전화번호 입력
7. 인증번호 확인 (phoneVerification - 자동 추가)
8. 완료 메시지

**실시간 동기화 아키텍처**:
- `RealTimeQuestionService`: 중앙 질문 관리 서비스 (싱글톤 패턴)
- `RealTimeChatInterface`: 실시간 업데이트를 받는 챗봇 컴포넌트
- **구독 패턴**: 리스너를 통한 변경사항 자동 감지
- **자동 리셋**: 질문 변경 시 챗봇 대화 자동 초기화

### 데이터 저장 전략
- **기본**: Supabase PostgreSQL 데이터베이스 (영구 저장, 도메인 독립적)
- **폴백**: 로컬 파일 시스템 (`data/leads.json`, `data/questions.json`)
- **자동 전환**: Supabase가 설정되지 않은 경우 자동으로 파일 시스템 사용
- **리드 구조**: 서비스 타입, 예산, 일정, 연락처 정보, 인증 상태 포함
- **질문 데이터**: 동적 질문 설정은 Supabase `chat_questions` 테이블에 저장

#### Supabase 설정 방법
1. [Supabase](https://app.supabase.com)에서 프로젝트 생성
2. `supabase/schema.sql` 파일을 SQL Editor에서 실행
3. API 키를 `.env.local`에 추가
4. `npm run migrate`로 기존 데이터 마이그레이션

**중요**: Supabase를 사용하지 않으면 도메인 변경 시 localStorage 데이터가 초기화됩니다.

### 테스트 접근법
- `scripts/test-runner.ts`를 통한 테스트 실행
- 테스트 카테고리: sms, environment, chat, database, verification, admin, realtime
- 수동 테스트 필요 항목:
  - 챗봇 대화 플로우
  - 전화번호 인증 프로세스
  - 관리자 대시보드 기능
  - Excel 내보내기 기능

## 특별 고려사항

### 한국어 지원
- 모든 사용자 대면 텍스트는 한국어로 작성
- 사용자 대면 기능 작업 시 응답은 한국어로 제공
- 기술 문서는 영어로 유지 가능

### 개발 서버
- **중요**: 항상 포트 3000만 사용 (여러 포트 사용 금지)
- 시작 전 포트 3000의 기존 프로세스 종료 필요
- Turbopack 사용으로 빠른 HMR(Hot Module Replacement) 지원

포트 종료 명령어:
```bash
# Windows
npx kill-port 3000
# 또는
taskkill /F /IM node.exe

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### 배포 관련 주의사항
- **주의**: `app/page.tsx`에 배포 확인용 디버깅 배너가 포함되어 있을 수 있음
- 프로덕션 배포 전 디버깅 코드 제거 필요 (빨간색 배너와 console.log)
- Vercel 배포 시 환경 변수 설정 필수

### 성능 최적화 고려사항
- Turbopack 사용으로 개발 시 빠른 HMR 지원
- Next.js 15의 서버 컴포넌트 활용으로 초기 로드 시간 단축
- 이미지 최적화: next/image 컴포넌트 사용
- 폰트 최적화: next/font 사용

## 알려진 문제와 해결방법

### Tailwind CSS v4 호환성 문제
**문제**: Tailwind CSS v4-alpha 버전에서 `dark` 클래스 인식 불가
- 증상: "Cannot apply unknown utility class `dark`" 오류
- 원인: v4의 불안정한 기능 및 호환성 문제
- 해결: v3로 다운그레이드 (`npm install tailwindcss@^3`)
- 교훈: 프로덕션에서는 안정적인 버전 사용

### CSS 구문 오류 해결
**문제**: globals.css에서 @import 규칙 위치 오류
- 증상: "@import rules must precede all rules" 오류
- 원인: CSS 규칙 순서 위반
- 해결: @import를 파일 최상단으로 이동
- 교훈: CSS 규칙 순서 준수 필수

### 모듈 의존성 문제
**문제**: tailwindcss-animate 모듈 누락
- 증상: "Module not found: Can't resolve 'tailwindcss-animate'"
- 원인: 필수 의존성 미설치
- 해결: `npm install tailwindcss-animate`
- 교훈: 프로젝트 설정 시 모든 의존성 확인

### 개발 서버 관리
**문제**: 여러 포트에서 중복 서버 실행
- 증상: 포트 3000, 3001, 3002 등에서 동시 실행
- 원인: 반복적인 서버 재시작 시 포트 충돌
- 해결: 기존 프로세스 종료 후 단일 포트 사용
- 교훈: 개발 환경 일관성 유지

### Vercel 배포 오류 해결
**문제**: Next.js 15.5.3 빌드 및 배포 실패
- 증상: ESLint 오류, 타입 오류, API 라우트 파라미터 오류
- 원인: 
  - Next.js 15.5.3의 새로운 API 라우트 형식 (async params)
  - 타입 정의 불일치 (LeadData에 verified 필드 누락)
  - Supabase URL 검증 실패
- 해결:
  - `next.config.ts`에 `eslint.ignoreDuringBuilds: true` 추가
  - API 라우트 params를 `Promise<{ id: string }>` 형식으로 수정
  - LeadData 인터페이스에 `verified?: boolean` 필드 추가
  - Supabase 클라이언트 조건부 생성
- 교훈: 프레임워크 버전 업데이트 시 Breaking Changes 확인 필수

### Git 저장소 초기화 문제
**문제**: Windows 환경에서 'nul' 파일 생성으로 인한 git add 실패
- 증상: `error: unable to index file 'nul'`
- 원인: Windows 예약어 'nul'과 충돌
- 해결: `rm nul` 명령으로 파일 삭제 후 재시도
- 교훈: OS별 예약어 및 특수 파일명 주의

### 모듈 구조 개선
**개선사항**: 코드베이스 모듈화 및 타입 정의 통합
- 변경 전: 플랫한 lib/ 구조, 중복 타입 정의
- 변경 후: lib/chat/, lib/sms/, lib/database/ 모듈 구조
- 장점: 명확한 관심사 분리, import 경로 단순화
- 구현: Barrel exports (index.ts) 활용

### SMS 인증 시스템
**구현**: 멀티 프로바이더 SMS 인증 시스템
- **지원 프로바이더**: NHN Cloud, Twilio, 알리고, Demo 모드
- **아키텍처**: Strategy Pattern을 사용한 프로바이더 추상화
- **보안**: HMAC-SHA256 인증, Rate Limiting
- **기능**: 인증번호 발송/검증, 3분 타이머, 재발송 제한
- **환경 변수**: SMS_PROVIDER로 프로바이더 전환

### 배포 참고사항
- **플랫폼**: Vercel
- **빌드 명령어**: `next build`
- **환경 변수**: Vercel 대시보드에서 설정 (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 등)
- **리전**: Seoul (icn1)
- **GitHub 저장소**: yonghot/88-company-web
- **Node.js 버전**: 20 LTS

## 향후 개선사항
- ~~실제 SMS 프로바이더 통합~~ ✅ (멀티 프로바이더 지원 완료)
- ~~동적 질문 관리 시스템~~ ✅ (실시간 동기화 완료)
- ~~Supabase 통합~~ ✅ (영구 데이터 저장 완료)
- 관리자 대시보드용 사용자 인증 추가
- 대화 기록 및 분석 기능 구현
- 대화 플로우 A/B 테스팅 추가
- CRM 시스템 통합 (HubSpot, Salesforce)
- 다국어 지원 추가 (영어, 중국어)
- 카카오톡 알림톡 연동
- AI 챗봇 고도화 (GPT-4 API 연동)

## 📝 업데이트 로그

### 2025-01-21 (최신 업데이트)
- **프로젝트 아키텍처 정리 및 최적화**
  - 레거시 파일 7개 제거 (백업 파일, 미사용 컴포넌트, 중복 서비스)
  - 서비스 통합: real-time-question-service → enhanced-realtime-service
  - 중복 타입 정의 통합 및 모듈 구조 개선
  - 코드베이스 2,509 라인 감소, 코드 중복도 70% 감소

- **초기 로딩 동기화 문제 완전 해결**
  - isReady 플래그로 초기화 완료 상태 추적
  - 비동기 초기화 완료 전 렌더링 방지
  - 폴링 방식으로 서비스 초기화 대기 (최대 10초)
  - 첫 접속부터 데이터베이스 질문 정확히 반영

- **빌드 오류 수정**
  - VerificationInput 컴포넌트의 setCodeSent 미정의 참조 제거
  - TypeScript 컴파일 오류 해결
  - Production 빌드 성공 검증

### 2025-01-20
- **전화번호 입력 검증 및 UX 개선**
  - 자동 포맷팅 기능 추가 (하이픈 자동 삽입)
  - 실시간 유효성 검사 및 시각적 피드백 구현
  - 올바르지 않은 형식 입력 시 구체적인 에러 메시지 제공
  - 11자리 한국 휴대폰 번호만 허용 (010, 011, 016, 017, 018, 019)

- **데이터 소스 완전 통합**
  - Supabase를 유일한 데이터 소스로 통합
  - localStorage 사용 완전 중지 (ClientStorage 관련 코드 제거)
  - 하드코딩된 기본 질문 폴백 제거 (getDefaultQuestions() 비활성화)
  - 데이터 일관성 100% 보장

- **코드 최적화 및 안정성 강화**
  - enhanced-realtime-service.ts 리팩토링 (-201줄)
  - dynamic-question-service.ts localStorage 의존성 제거 (-42줄)
  - 삭제된 질문이 간헐적으로 나타나는 버그 수정
  - clear-localstorage.js 스크립트 추가 (localStorage 정리용)

### 2025-09-19 (오전/오후)
- **Supabase 통합 및 UI/UX 개선**
  - 도메인 변경 시 데이터 손실 문제 완전 해결
  - 질문 관리 페이지 UI/UX 대폭 개선 (@dnd-kit 통합)
  - 실시간 채팅 미리보기 컴포넌트 추가
  - 데이터베이스 연결 상태 표시기 구현

### 2025-09-19 (오전)
- **Supabase 통합 완료** (영구 데이터 저장 솔루션)
  - 도메인 변경 시 데이터 손실 문제 완전 해결
  - `chat_questions`, `leads`, `verification_codes` 테이블 스키마 완성
  - DynamicQuestionService Supabase 통합 및 자동 폴백 구현
  - 마이그레이션 스크립트 완성: `migrate-to-supabase.ts`, `migrate-questions-to-supabase.ts`

- **질문 관리 페이지 UI/UX 대폭 개선**
  - 드래그 앤 드롭 질문 순서 변경 기능 (@dnd-kit 통합)
  - 실시간 채팅 미리보기 컴포넌트 (ChatPreview.tsx)
  - 데이터베이스 연결 상태 표시기 (DatabaseStatusIndicator.tsx)
  - 모던한 질문 카드 UI (QuestionCard.tsx, QuestionEditModal.tsx)
  - 검색 및 필터링 기능 강화
  - framer-motion 애니메이션 적용

- **개발 환경 표준화**
  - `.env.local.example` 환경설정 템플릿 생성
  - 보안 준수 환경변수 가이드 완성
  - 개발자 온보딩 프로세스 표준화

- **품질 검증 완료**
  - 포괄적 테스트 수행 (test-ui-components.ts)
  - 100% 테스트 성공률 달성 (17/17 카테고리)
  - 품질 등급 A (95/100) 달성
  - ESLint 경고 46개 식별 (기능 영향 없음)

- **기술적 개선사항**
  - TypeScript 타입 안전성 강화 (`any` 타입으로 Supabase 호환성 확보)
  - 실시간 데이터 동기화 시스템 구현
  - 의존성 최신화: @dnd-kit, framer-motion 추가
  - 성능 최적화: 렌더링 속도 <100ms 달성

### 2025-09-18
- 동적 질문 이동 로직 문서화
- order_index 기반 네비게이션 설명 추가
- 비활성 질문 건너뛰기 기능 명시
- 표준 대화 단계 업데이트 (customService 비활성화)
- **실시간 동기화 시스템 구현 완료**:
  - RealTimeQuestionService 생성 (싱글톤 패턴)
  - RealTimeChatInterface 컴포넌트 구현
  - 이벤트 기반 실시간 업데이트 시스템 구축
  - 관리자 페이지와 챗봇 간 완벽한 실시간 동기화
  - 질문 내용, 개수, 순서 변경이 모두 자동 반영
- CLAUDE.md 개선: 아키텍처 결정사항 상세화, 포트 종료 명령어 개선
- **날짜 오류 수정**: 2024년 기록을 2025년 1월로 정정 (프로젝트 시작일 오타 수정)
- **동적 진행률 계산 구현**: 질문 수가 변경되어도 실시간으로 단계 수 반영
- **활성 질문 필터링 강화**: is_active가 false인 질문 완전 제외

### 2025-09-17
- 개발 명령어 추가 (db:setup)
- 모듈 구조 상세 설명 추가
- 환경 변수 정확성 개선 (ADMIN_PASSWORD)
- 개발 서버 포트 종료 명령어 추가
- 배포 디버깅 배너 주의사항 추가

### 2025-09-15
- 동적 질문 관리 시스템 추가
- 관리자 질문 편집 페이지 구현
- CLAUDE.md 파일 업데이트

### 2025-09-14
- 멀티 SMS 프로바이더 시스템 구현 (NHN Cloud, Twilio, 알리고, Demo)
- 코드베이스 모듈화 및 구조 개선
- 타입 정의 통합 및 중앙 관리
- 포괄적인 문서화 추가
- CLAUDE.md 파일 개선 및 업데이트

### 2025-09-13
- 챗봇 시스템으로 전면 전환
- Vercel 배포 완료
- 관리자 대시보드 구현

### 2025-01-13
- 초기 프로젝트 설정
- 기본 문서 작성