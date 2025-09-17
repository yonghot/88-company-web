# 모듈화 아키텍처 문서

## 개요
이 문서는 88 Company 챗봇 시스템의 새로운 모듈화 아키텍처를 설명합니다.
각 모듈은 독립적으로 작동하며, 서로 영향을 주지 않도록 설계되었습니다.

## 핵심 원칙

### 1. 단일 책임 원칙 (Single Responsibility)
- **QuestionManager**: 질문 데이터 관리만 담당
- **SimpleChatInterface**: 채팅 UI와 상호작용만 담당
- **SimpleQuestionsManagement**: 관리자 인터페이스만 담당

### 2. 의존성 역전 (Dependency Inversion)
- 모든 컴포넌트는 추상화된 인터페이스를 통해 통신
- 직접적인 의존성 대신 이벤트 기반 통신 사용

### 3. 모듈 격리 (Module Isolation)
- 각 모듈은 자체 상태 관리
- 전역 상태 최소화
- 사이드 이펙트 방지

## 아키텍처 구조

```
┌─────────────────────────────────────────────────────┐
│                   사용자 인터페이스                    │
├─────────────────┬────────────────┬──────────────────┤
│  SimpleChatUI   │  AdminPanel    │   TestPage       │
│  (챗봇 화면)     │  (관리자)       │   (테스트)       │
└────────┬────────┴────────┬────────┴──────┬──────────┘
         │                 │                │
         ▼                 ▼                ▼
┌─────────────────────────────────────────────────────┐
│              QuestionManager (싱글톤)                │
│  - getQuestions()                                   │
│  - saveQuestions()                                  │
│  - getFlow()                                        │
└──────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              LocalStorage / Memory                   │
│  - 'chat_questions' (질문 데이터)                    │
│  - 'questions_updated' (업데이트 타임스탬프)          │
└─────────────────────────────────────────────────────┘
```

## 모듈 상세 설명

### 1. QuestionManager (`lib/chat/question-manager.ts`)

**책임**: 질문 데이터의 저장, 로드, 플로우 생성

**주요 기능**:
- `getQuestions()`: 저장된 질문 로드 (없으면 기본값)
- `saveQuestions()`: 질문 저장 및 이벤트 발생
- `getFlow()`: 질문을 ChatStep 플로우로 변환
- `clearCache()`: 캐시 관련 (현재 미사용)

**특징**:
- 싱글톤 패턴으로 인스턴스 일관성 보장
- 브라우저/Node.js 환경 모두 지원
- 자동 이벤트 발생으로 실시간 동기화

### 2. SimpleChatInterface (`components/chatbot/SimpleChatInterface.tsx`)

**책임**: 채팅 UI 렌더링 및 사용자 상호작용 처리

**주요 기능**:
- 질문 표시 및 답변 수집
- 진행 상태 표시
- 전화번호 인증 처리
- 리드 데이터 저장

**이벤트 리스닝**:
```javascript
window.addEventListener('questionsUpdated', handleQuestionsUpdate);
window.addEventListener('storage', handleStorageChange);
```

**특징**:
- QuestionManager를 통한 데이터 접근
- 실시간 업데이트 자동 반영
- 독립적인 상태 관리

### 3. SimpleQuestionsManagement (`app/admin/questions/simple/page.tsx`)

**책임**: 관리자용 질문 편집 인터페이스

**주요 기능**:
- 질문 추가/수정/삭제
- 순서 변경 (드래그 앤 드롭)
- 즉시 저장 및 동기화

**특징**:
- QuestionManager를 통한 일관된 데이터 관리
- 변경사항 즉시 반영
- 다른 모듈과 독립적 작동

## 실시간 동기화 메커니즘

### 1. 같은 탭 내 동기화
```javascript
// 질문 저장 시
questionManager.saveQuestions(questions);
// → 'questionsUpdated' 이벤트 발생
// → SimpleChatInterface가 이벤트 수신
// → 플로우 재로드 및 UI 업데이트
```

### 2. 다른 탭/창 간 동기화
```javascript
// localStorage 변경 시
window.addEventListener('storage', (e) => {
  if (e.key === 'chat_questions') {
    // 플로우 재로드
  }
});
```

## 모듈 독립성 보장 방법

### 1. 데이터 캡슐화
- 각 모듈은 자체 상태만 관리
- QuestionManager를 통해서만 데이터 접근
- 직접적인 localStorage 접근 금지

### 2. 이벤트 기반 통신
- 모듈 간 직접 호출 없음
- 이벤트를 통한 느슨한 결합
- 비동기 처리로 블로킹 방지

### 3. 인터페이스 추상화
- `QuestionManager` 인터페이스 정의
- 구현체 변경 가능 (LocalStorage → API)
- 테스트 용이성 향상

## 테스트 방법

### 1. 단위 테스트
```bash
npx tsx scripts/test-modular-system.ts
```

### 2. 브라우저 테스트
1. 개발 서버 시작: `npm run dev`
2. http://localhost:3000/test 접속
3. 각 기능 테스트 버튼 클릭

### 3. 실시간 동기화 테스트
1. 두 개의 브라우저 탭 열기
2. 탭 1: /admin/questions/simple 접속
3. 탭 2: / (메인 챗봇) 접속
4. 탭 1에서 질문 수정
5. 탭 2에서 즉시 반영 확인

## 장점

1. **유지보수성**: 각 모듈 독립적으로 수정 가능
2. **확장성**: 새 기능 추가 시 기존 코드 영향 최소화
3. **테스트 용이성**: 모듈별 독립 테스트 가능
4. **재사용성**: 모듈을 다른 프로젝트에 재사용 가능
5. **신뢰성**: 한 모듈 오류가 다른 모듈에 영향 없음

## 향후 개선 사항

1. **API 백엔드 통합**: LocalStorage → REST API
2. **상태 관리 라이브러리**: Redux/Zustand 도입 검토
3. **타입 안전성 강화**: Zod 스키마 검증 추가
4. **에러 바운더리**: 모듈별 에러 처리 강화
5. **성능 최적화**: React.memo, useMemo 활용

## 마이그레이션 가이드

### 기존 시스템에서 새 시스템으로

1. **데이터 마이그레이션**:
   - 기존 localStorage 데이터는 자동 호환
   - 추가 작업 불필요

2. **코드 변경**:
   - `DynamicChatInterface` → `SimpleChatInterface`
   - `/admin/questions` → `/admin/questions/simple`

3. **정리할 파일들** (확인 후 삭제 가능):
   - `components/chatbot/DynamicChatInterface.tsx`
   - `lib/chat/dynamic-flow.ts`
   - `lib/chat/dynamic-question-service.ts`
   - 기타 미사용 파일들

## 결론

새로운 모듈화 아키텍처는 각 기능의 독립성을 보장하며,
한 부분의 수정이 다른 부분에 영향을 주지 않도록 설계되었습니다.
이를 통해 안정적이고 유지보수가 쉬운 시스템을 구축했습니다.