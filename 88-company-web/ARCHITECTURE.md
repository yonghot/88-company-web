# 88 Company 웹 애플리케이션 아키텍처

## 📦 프로젝트 구조

```
88-company-web/
├── app/                      # Next.js 15 App Router
│   ├── api/                 # API 라우트
│   │   ├── leads/          # 리드 관리 API
│   │   ├── verify/         # SMS 인증 API
│   │   └── admin/          # 관리자 API
│   ├── admin/              # 관리자 대시보드
│   ├── admin-login/        # 관리자 로그인
│   └── page.tsx            # 메인 챗봇 페이지
├── components/              # React 컴포넌트
│   ├── chatbot/           # 챗봇 인터페이스 컴포넌트
│   └── ui/                # shadcn/ui 컴포넌트
├── lib/                    # 비즈니스 로직
│   ├── chat/              # 챗봇 모듈
│   ├── sms/               # SMS 서비스
│   └── database/          # 데이터베이스 타입
├── scripts/               # 유틸리티 스크립트
│   └── test-runner.ts     # 통합 테스트 러너
├── data/                  # 로컬 데이터 저장소
└── public/               # 정적 자산

```

## 🏛️ 아키텍처 패턴

### 1. 레이어드 아키텍처

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│  (React Components, Next.js Pages)  │
├─────────────────────────────────────┤
│           API Layer                 │
│    (Next.js API Routes, REST)       │
├─────────────────────────────────────┤
│        Business Logic Layer         │
│   (Services, Managers, Validators)  │
├─────────────────────────────────────┤
│         Data Access Layer           │
│   (Supabase Client, File System)    │
└─────────────────────────────────────┘
```

### 2. 모듈 구조

#### Chat Module (`lib/chat/`)
- **목적**: 챗봇 대화 플로우 관리
- **핵심 컴포넌트**:
  - `StaticQuestionService`: 정적 질문 로드 (Singleton)
  - `ChatFlowService`: 대화 플로우 제어
  - `BackupService`: 자동 백업 시스템
- **패턴**: Singleton Pattern

#### SMS Module (`lib/sms/`)
- **목적**: SMS 인증 및 발송
- **핵심 컴포넌트**:
  - `SMSService`: SMS 발송 (Strategy Pattern)
  - `VerificationService`: 인증 코드 관리 (Singleton)
  - `CostOptimizer`: 비용 최적화 및 제한
  - `RateLimiter`: 속도 제한
- **패턴**: Strategy Pattern (다중 프로바이더), Singleton Pattern

#### Database Module (`lib/database/`)
- **목적**: 데이터 타입 정의 및 스키마 관리
- **특징**: Supabase와 파일 시스템 이중 지원

## 🔄 데이터 플로우

### 챗봇 대화 플로우
```
User Input → ChatInterface → QuestionService → ValidationService
    ↓                                               ↓
Response ← ChatInterface ← NextStepLogic ← ProcessedData
```

### SMS 인증 플로우
```
Phone Input → VerificationService → RateLimiter → SMSService
     ↓                                                 ↓
Verification ← CodeValidation ← Storage ← ProviderResponse
```

## 🔐 보안 고려사항

1. **환경 변수 관리**: 민감한 정보는 환경 변수로 관리
2. **Rate Limiting**: SMS 발송 제한 (5분 간격, 일일 한도)
3. **관리자 인증**: 비밀번호 기반 간단한 인증
4. **입력 검증**: 모든 사용자 입력 검증
5. **HMAC 서명**: SMS 인증 코드 무결성 검증

## 🚀 성능 최적화

1. **Singleton Pattern**: 서비스 인스턴스 재사용
2. **LocalStorage 캐싱**: 질문 데이터 로컬 캐싱
3. **Lazy Loading**: 필요시 서비스 초기화
4. **Turbopack**: 빠른 개발 서버 HMR

## 📊 상태 관리

- **컴포넌트 상태**: React useState/useReducer
- **실시간 동기화**: Observer Pattern + LocalStorage
- **세션 데이터**: LocalStorage (질문), SessionStorage (임시)
- **서버 상태**: Supabase 또는 파일 시스템

## 🧪 테스트 전략

1. **통합 테스트 러너**: `npm test` 명령으로 전체 테스트
2. **모듈별 테스트**:
   - `npm run test:sms` - SMS 서비스
   - `npm run test:chat` - 챗봇 플로우
   - `npm run test:verification` - 인증 시스템
3. **환경 테스트**: `npm run test:env`

## 🔄 배포 전략

1. **개발**: `npm run dev` (포트 3000)
2. **빌드**: `npm run build`
3. **배포**: Vercel 자동 배포 (main 브랜치)
4. **환경**:
   - Development: 로컬 개발
   - Production: Vercel (Seoul 리전)

## 📈 향후 개선 방안

### 단기 (1-2주)
- [ ] TypeScript strict 모드 활성화
- [ ] 자동화된 단위 테스트 추가
- [ ] 에러 경계(Error Boundary) 구현
- [ ] 로깅 시스템 개선

### 중기 (1-2개월)
- [ ] 관리자 인증 시스템 강화 (JWT)
- [ ] 리드 분석 대시보드 구현
- [ ] A/B 테스트 시스템 구축
- [ ] 성능 모니터링 도구 통합

### 장기 (3-6개월)
- [ ] 마이크로서비스 아키텍처 전환
- [ ] GraphQL API 도입
- [ ] 실시간 분석 시스템
- [ ] AI 챗봇 고도화 (GPT-4 연동)

## 🛠️ 기술 스택

- **Framework**: Next.js 15.5.3
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x
- **Database**: Supabase (PostgreSQL)
- **SMS**: 멀티 프로바이더 (NHN Cloud, Twilio, 알리고)
- **Deployment**: Vercel
- **Package Manager**: npm

## 📝 코딩 컨벤션

1. **파일 명명**: kebab-case (예: `chat-interface.tsx`)
2. **컴포넌트**: PascalCase (예: `ChatInterface`)
3. **함수/변수**: camelCase (예: `handleUserInput`)
4. **상수**: UPPER_SNAKE_CASE (예: `MAX_RETRIES`)
5. **타입/인터페이스**: PascalCase with 'I' prefix optional

## 🔗 의존성 관리

- **최소 의존성 원칙**: 필요한 패키지만 설치
- **버전 고정**: 프로덕션 패키지는 정확한 버전 지정
- **정기 업데이트**: 보안 패치 주기적 확인
- **Tree Shaking**: 사용하지 않는 코드 제거

## 📚 참고 자료

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)